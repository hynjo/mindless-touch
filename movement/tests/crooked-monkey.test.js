import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBody} from '../body.js';
import {yogaPoses,uncorrectedYogaPoses} from '../poses.js';
import {applyPose} from '../apply-pose.js';
import {createFloorConstraints} from '../floor-constraints.js';
import {createSelfConstraints} from '../self-constraints.js';
import {inspectPose,evaluateSupportRequirements} from '../pose-validation.js';
import {inspectRearFootGrip} from '../rear-foot-grip.js';
import {supportProfile} from '../support-profiles.js';
import {applyHandPreset} from '../hands.js';
import {mirrorRotations} from '../ashtanga-shapes.js';
import {capturePose} from '../pole-constraints.js';
import {inspectScheduledHolds} from '../scheduled-supports.js';
import {serializeSequence,parseSequence,SEQUENCE_FORMAT} from '../sequence-file.js';

const pose=yogaPoses.find(p=>p.name==='Crooked Monkey');
function fixture(step=pose){
 const dimensions={pelvisHeight:.97,torso:.48,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43},material=new THREE.MeshStandardMaterial();
 const body=createBody({scene:new THREE.Scene(),dimensions,bodyMaterial:material,jointMaterial:material}),meshes=[];
 body.root.traverse(mesh=>{if(mesh.isMesh)meshes.push(mesh);});
 const rig={...body,dimensions,meshes,byId:Object.fromEntries(body.joints.map(j=>[j.id,j]))},floor=createFloorConstraints(rig);
 const result=applyPose(rig,step,{floor});return {rig,floor,result};
}
for(const mirrored of [false,true])test(`Crooked Monkey ${mirrored?'mirrored':'original'} keeps the three-point base, heel hold and form`,()=>{
 const step={...pose,rotations:mirrored?mirrorRotations(pose.rotations):pose.rotations}, {rig,floor,result}=fixture(step),report=inspectPose(rig,step),self=createSelfConstraints(rig);
 assert.equal(result.accepted,true);assert.equal(pose.draft,false);
 assert.deepEqual(report.supports.issues,[]);assert.deepEqual(report.rom.issues,[]);assert.deepEqual(report.form.issues,[]);
 const front=mirrored?'right':'left',rear=mirrored?'left':'right';
 for(const region of [front+'-sole',rear+'-palm',rear+'-knee'])assert(report.supports.surfaces[region].pass,region);
 assert.equal(report.supports.surfaces['rear-foot-grip'].frontSide,front);
 assert.deepEqual(self.contacts(0),[]);assert.deepEqual(self.headContacts(0),[]);assert.deepEqual(self.externalContacts(0),[]);
 assert.deepEqual(self.jointViolations(),[]);assert(floor.clearance()>=.0007-1e-9);
});
test('the former Crooked Monkey draft fails its new support and heel-hold contract',()=>{
 const old=uncorrectedYogaPoses.find(p=>p.source===pose.source),{rig}=fixture(old),report=inspectPose(rig,pose);
 assert(report.supports.issues.some(i=>i.name==='opposite-sole-knee-palm'));
 assert(report.supports.issues.some(i=>i.name==='rear-foot-grip'));
 assert.deepEqual(supportProfile({...pose,supportRequirements:[]}).requirements,['opposite-sole-knee-palm','rear-foot-grip']);
});
test('a single side cannot satisfy the supporting sole and opposite knee/palm roles',()=>{
 const surfaces=Object.fromEntries(['left','right'].flatMap(side=>['sole','knee','palm'].map(part=>[`${side}-${part}`,{name:`${side}-${part}`,pass:side==='left'}])));
 assert.equal(evaluateSupportRequirements(surfaces,['opposite-sole-knee-palm'])[0].pass,false);
 surfaces['right-knee'].pass=true;assert.equal(evaluateSupportRequirements(surfaces,['opposite-sole-knee-palm'])[0].pass,false);
 surfaces['right-palm'].pass=true;assert.equal(evaluateSupportRequirements(surfaces,['opposite-sole-knee-palm'])[0].pass,true);
});
test('lifted supports, an open hand, missing thumb contact and a detached heel cannot pass',()=>{
 for(const [change,requirement] of [
  [rig=>{rig.root.position.y+=.03;},'opposite-sole-knee-palm'],
  [rig=>{rig.byId.rightShoulder.group.rotation.x+=.2;},'opposite-sole-knee-palm'],
  [rig=>{rig.byId.leftAnkle.group.rotation.x+=.2;},'opposite-sole-knee-palm'],
  [rig=>{rig.byId.rightHip.group.rotation.x-=.2;},'opposite-sole-knee-palm'],
  [rig=>applyHandPreset(rig.hands.left,'open'),'rear-foot-grip'],
  [rig=>{rig.byId.leftThumb1.group.rotation.x=0;},'rear-foot-grip'],
  [rig=>{rig.hands.left.root.position.x+=.035;},'rear-foot-grip'],
 ]){
  const {rig}=fixture();change(rig);
  assert(inspectPose(rig,pose).supports.issues.some(i=>i.name===requirement),requirement);
 }
});
test('straightening the rear knee or removing the chest twist fails form validation',()=>{
 for(const [change,name] of [
  [rig=>{rig.byId.rightKnee.group.rotation.x=.5;},'Rear knee folded'],
  [rig=>{rig.byId.torso.group.rotation.y=0;},'Chest twists toward the free hand'],
 ]){const {rig}=fixture();change(rig);assert(inspectPose(rig,pose).form.issues.some(i=>i.name===name));}
});
test('hand/heel and hand/leg penetration fails the hold independently of wrist distance',()=>{
 const {rig}=fixture(),p=rig.hands.left.palm.getWorldPosition(new THREE.Vector3());
 rig.feet.right.sole.position.copy(rig.feet.right.sole.parent.worldToLocal(p));
 const grip=inspectRearFootGrip(rig);assert.equal(grip.pass,false);assert(grip.contacts.some(c=>c.part==='palm'));
 const other=fixture().rig,shin=other.byId.rightKnee.group.children.find(m=>m.geometry?.type==='CapsuleGeometry');
 other.hands.left.root.position.copy(other.hands.left.wrist.worldToLocal(shin.getWorldPosition(new THREE.Vector3())));
 const legGrip=inspectRearFootGrip(other);assert.equal(legGrip.pass,false);assert(legGrip.contacts.some(c=>c.limb==='rightKnee'));
});
test('rear heel contact is invariant under a common rigid transform',()=>{
 const {rig}=fixture(),before=inspectRearFootGrip(rig);
 rig.root.position.add(new THREE.Vector3(.4,1.2,-.7));rig.root.quaternion.premultiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(.4,1,-.3)));
 const after=inspectRearFootGrip(rig);assert(before.pass&&after.pass);assert(Math.abs(before.gapMm-after.gapMm)<1e-5);
});
test('Crooked Monkey save/load retains fingers and contract, and scheduled hold preflight accepts its base',()=>{
 const {rig,floor}=fixture(),context={studio:'movement',dimensions:rig.dimensions,jointIds:rig.joints.map(j=>j.id)},frame=capturePose(rig.root,rig.joints);
 const step={id:'crooked',name:pose.name,poseContract:pose.poseContract,supportRequirements:supportProfile(pose).requirements,floorSupport:'ground',holdSeconds:3,transitionSeconds:2,
  pose:{rootPosition:rig.root.position.toArray(),rotations:Object.fromEntries(rig.joints.map(j=>[j.id,j.group.rotation.toArray().slice(0,3)])),poleContacts:{}}};
 const document={format:SEQUENCE_FORMAT,version:1,studio:'movement',dimensions:rig.dimensions,name:'Crooked Monkey',steps:[step]},restored=parseSequence(serializeSequence(document,context),context).steps[0];
 applyHandPreset(rig.hands.left,'open');applyPose(rig,restored,{floor});assert.deepEqual(inspectPose(rig,restored).supports.issues,[]);
 const schedule={version:1,anchors:['left-sole','right-knee','right-palm'].map(anchor=>({anchor,start:true,end:true}))};
 assert.deepEqual(inspectScheduledHolds(rig,[{...restored,contactSchedule:schedule},restored],[frame,frame]),[]);
});
