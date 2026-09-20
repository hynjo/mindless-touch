import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBody} from '../body.js';
import {yogaPoses,uncorrectedYogaPoses} from '../poses.js';
import {createFloorConstraints} from '../floor-constraints.js';
import {createSelfConstraints} from '../self-constraints.js';
import {inspectPose} from '../pose-validation.js';
import {inspectToeGrips,handFootContacts} from '../toe-grip.js';
import {applyHandPreset} from '../hands.js';
import {capturePose,restorePose} from '../pole-constraints.js';
import {supportProfile} from '../support-profiles.js';
import {serializeSequence,parseSequence,SEQUENCE_FORMAT} from '../sequence-file.js';
import {mirrorRotations} from '../ashtanga-shapes.js';

function fixture(pose=yogaPoses.find(p=>p.name==="Archer's")){
 const dimensions={pelvisHeight:.97,torso:.48,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43},material=new THREE.MeshStandardMaterial();
 const body=createBody({scene:new THREE.Scene(),dimensions,bodyMaterial:material,jointMaterial:material}),meshes=[];
 body.root.traverse(m=>{if(m.isMesh)meshes.push(m);});
 const rig={...body,meshes,dimensions,byId:Object.fromEntries(body.joints.map(j=>[j.id,j]))};
 rig.root.position.fromArray(pose.rootPosition);
 for(const j of rig.joints)j.group.rotation.set(...(pose.rotations[j.id]||[0,0,0]).map(THREE.MathUtils.degToRad));
 const floor=createFloorConstraints(rig);floor.settle();
 return {rig,pose,floor};
}
test('Archer keeps both toe hooks, seated support and range limits after restore',()=>{
 const {rig,pose,floor}=fixture(),self=createSelfConstraints(rig),saved=capturePose(rig.root,rig.joints);
 applyHandPreset(rig.hands.left,'open');restorePose(rig.root,rig.joints,saved);floor.settle();
 const result=inspectPose(rig,pose);
 assert.deepEqual(result.supports.issues,[]);assert.deepEqual(result.rom.issues,[]);
 assert.deepEqual(self.contacts(0),[]);assert.deepEqual(self.jointViolations(),[]);
 assert.deepEqual(handFootContacts(rig),[]);
 const legs=result.supports.surfaces['archer-leg-support'];
 assert(legs.earDistanceMm<120);assert(legs.footClearanceMm>50);
 assert(legs.supportingKneeDegrees<7);
 assert.match(pose.modification,/Soft supporting knee/);
});
test('the original Archer fails sit-bone support, leg placement and both toe grips',()=>{
 const {rig,pose}=fixture(uncorrectedYogaPoses.find(p=>p.name==="Archer's"));
 const names=inspectPose(rig,pose).supports.issues.map(i=>i.name);
 for(const name of ['sit-bones','archer-leg-support','both-toe-grips'])assert(names.includes(name));
});
test('opening a hand or moving a hook off the toe fails the grip contract',()=>{
 const opened=fixture().rig;applyHandPreset(opened.hands.left,'open');
 const open=inspectToeGrips(opened);assert(!open.pass);assert(open.samples.find(s=>s.side==='right').pass);
 const moved=fixture().rig;moved.hands.right.root.position.x+=.04;
 const detached=inspectToeGrips(moved);assert(!detached.pass);assert(detached.samples.find(s=>s.side==='left').pass);
});
test('hand/foot overlap is rejected, including the palm and adjacent toes',()=>{
 const {rig}=fixture();
 const target=rig.hands.left.palm.getWorldPosition(new THREE.Vector3());
 rig.feet.left.wrist.position.copy(rig.feet.left.wrist.parent.worldToLocal(target));
 assert(handFootContacts(rig).length>0);
 assert(!inspectToeGrips(rig).pass);
});
test('toe contact and clearance are invariant under a common rigid transform',()=>{
 const {rig}=fixture(),before=inspectToeGrips(rig);
 rig.root.position.add(new THREE.Vector3(.4,1.2,-.7));
 rig.root.quaternion.premultiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(.6,1.1,-.4)));
 const after=inspectToeGrips(rig);
 assert(before.pass&&after.pass);
 assert(Math.abs(before.gapMm-after.gapMm)<1e-5);
 assert.deepEqual(after.contacts,[]);
});
test('mirrored Archer retains same-side grips and identifies the other lifted leg',()=>{
 const original=yogaPoses.find(p=>p.name==="Archer's"),{rig,pose}=fixture({...original,rotations:mirrorRotations(original.rotations)});
 const result=inspectPose(rig,pose);
 assert.deepEqual(result.supports.issues,[]);assert.deepEqual(result.rom.issues,[]);
 assert.equal(result.supports.surfaces['archer-leg-support'].liftedSide,'right');
 assert.deepEqual(createSelfConstraints(rig).contacts(0),[]);
});
test('sequence JSON retains authored finger curls and grip requirements',()=>{
 const {rig,pose}=fixture(),context={studio:'movement',dimensions:rig.dimensions,jointIds:rig.joints.map(j=>j.id)};
 const document={format:SEQUENCE_FORMAT,version:1,studio:'movement',dimensions:rig.dimensions,name:'Archer review',steps:[{
  id:'archer',name:pose.name,poseContract:pose.poseContract,holdSeconds:3,transitionSeconds:2,floorSupport:'ground',supportRequirements:supportProfile(pose).requirements,
  pose:{rootPosition:rig.root.position.toArray(),rotations:Object.fromEntries(rig.joints.map(j=>[j.id,j.group.rotation.toArray().slice(0,3)])),poleContacts:{}},
 }]};
 const restored=parseSequence(serializeSequence(document,context),context).steps[0];
 assert.equal(restored.poseContract,'archer-forward-lean-v1');
 const invalid=structuredClone(document);invalid.steps[0].poseContract='unknown';
 assert.throws(()=>serializeSequence(invalid,context),/Unknown pose contract/);
 assert.deepEqual(restored.supportRequirements,['sit-bones','archer-leg-support','both-toe-grips']);
 for(const hand of Object.values(rig.hands))applyHandPreset(hand,'open');
 for(const j of rig.joints)j.group.rotation.set(...restored.pose.rotations[j.id]);
 assert(inspectToeGrips(rig).pass);
});
