import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBody} from '../body.js';
import {createFloorConstraints} from '../floor-constraints.js';
import {applyPose} from '../apply-pose.js';
import {yogaPoses} from '../poses.js';
import {inspectPose} from '../pose-validation.js';
import {capturePose} from '../pole-constraints.js';
import {supportProfile} from '../support-profiles.js';
import {inspectScheduledHolds} from '../scheduled-supports.js';
import {inspectPoseForm} from '../pose-contracts.js';
import {captureHandOffsets} from '../hand-offsets.js';
import {uncorrectedYogaPoses} from '../poses.js';
import {floorClearance,FLOOR_SKIN} from '../floor-constraints.js';
import {findPoseByPath,posePath} from '../pose-routes.js';
import {createSelfConstraints} from '../self-constraints.js';

function fixture(){
 const dimensions={pelvisHeight:.97,torso:.48,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43},material=new THREE.MeshStandardMaterial();
 const body=createBody({scene:new THREE.Scene(),dimensions,bodyMaterial:material,jointMaterial:material}),meshes=[];
 body.root.traverse(m=>{if(m.isMesh)meshes.push(m);});
 const rig={...body,meshes,dimensions,byId:Object.fromEntries(body.joints.map(j=>[j.id,j]))};
 return {rig,floor:createFloorConstraints(rig)};
}
for(const pose of yogaPoses.filter(p=>p.poseContract))test(`${pose.name}: shared application and serialized restore retain contract`,()=>{
 const {rig,floor}=fixture();
 const result=applyPose(rig,pose,{floor});
 assert.equal(result.accepted,true,JSON.stringify(result.after));
 const stored=JSON.parse(JSON.stringify({...pose,pose:{rootPosition:rig.root.position.toArray(),handOffsets:Object.fromEntries(Object.entries(captureHandOffsets(rig.root)).map(([side,v])=>[side,v.toArray()])),rotations:Object.fromEntries(rig.joints.map(j=>[j.id,[j.group.rotation.x,j.group.rotation.y,j.group.rotation.z]]))}}));
 const snapshot=capturePose(rig.root,rig.joints);
 applyPose(rig,yogaPoses.find(p=>p.name==='Mountain'),{floor});
 applyPose(rig,stored,{floor});
 const restored=capturePose(rig.root,rig.joints);
 assert(restored.position.distanceTo(snapshot.position)<1e-10);
 restored.rotations.forEach((q,index)=>assert(q.angleTo(snapshot.rotations[index])<1e-7,`${pose.name}: joint ${index} changed during restore`));
 assert.deepEqual(inspectPose(rig,stored).supports.issues,[]);
 assert.deepEqual(inspectPose(rig,stored).form.issues,[]);
 assert.deepEqual(inspectPose(rig,stored).rom.issues,[]);
 assert.deepEqual(inspectScheduledHolds(rig,[stored],[snapshot]),[]);
});
test('contract requirements cannot be weakened through editable support metadata',()=>{
 assert.deepEqual(supportProfile({poseContract:'archer-forward-lean-v1',supportRequirements:[]}).requirements,['sit-bones','archer-leg-support','both-toe-grips']);
 assert.throws(()=>supportProfile({poseContract:'unknown'}),/Unknown/);
});
test('Cow Face remains a clearly labeled preparation at its stable shared route',()=>{
 const pose=findPoseByPath(yogaPoses,'/movement/poses/knee-pile-bind');
 assert.equal(pose.poseContract,'cow-face-preparation-v1');
 assert.equal(posePath(pose),'/movement/poses/knee-pile-bind');
 assert.match(pose.name,/Preparation/);assert.equal(pose.draft,true);
 assert.match(pose.modification,/Unstacked knees.*Hands apart/);
 assert.deepEqual(supportProfile({...pose,supportRequirements:[]}).requirements,['sit-bones']);
 const {rig,floor}=fixture();applyPose(rig,uncorrectedYogaPoses.find(p=>p.source===pose.source),{floor});
 assert(inspectPose(rig,pose).supports.issues.some(i=>i.name==='sit-bones'));
 assert(inspectPoseForm(rig,pose).issues.some(i=>i.name==='right hand reaches behind the back'));
 assert.equal(applyPose(rig,pose,{floor}).accepted,true);
 const position=id=>rig.byId[id].group.getWorldPosition(new THREE.Vector3());
 const gap=position('leftWrist').distanceTo(position('rightWrist'));
 assert(gap>.2&&gap<=.30,'Hands approach but do not claim a completed bind');
 const self=createSelfConstraints(rig);
 assert.deepEqual(self.contacts(0),[]);assert.deepEqual(self.headContacts(0),[]);assert.deepEqual(self.externalContacts(1e-9),[]);
 assert.deepEqual(self.jointViolations(),[]);
 assert(position('leftKnee').distanceTo(position('rightKnee'))>.15,'Not stacked knees');
});
test('Cow Face preparation rejects floating support, frontward hands and unfolded knees',()=>{
 const pose=findPoseByPath(yogaPoses,'/movement/poses/knee-pile-bind');
 for(const [mutate,expected] of [
  [rig=>{rig.root.position.y+=.03;},'sit-bones'],
  [rig=>{rig.byId.rightShoulder.group.rotation.set(-Math.PI/2,0,0);rig.byId.rightElbow.group.rotation.set(0,0,0);},'right hand reaches behind the back'],
  [rig=>{rig.byId.leftKnee.group.rotation.x=0;},'left knee folded'],
  [rig=>{rig.byId.waist.group.rotation.x=.6;},'Upright trunk'],
  [rig=>{rig.byId.leftWrist.group.rotateZ(Math.PI);},'left hand points toward the other hand'],
  [rig=>{rig.byId.leftShoulder.group.rotation.set(...[154.81637795078728,-27.05711829245015,-42.008276946305585].map(THREE.MathUtils.degToRad));rig.byId.leftElbow.group.rotation.x=THREE.MathUtils.degToRad(-123.15674174216262);},'Arms clear the head'],
 ]){
  const {rig,floor}=fixture();assert.equal(applyPose(rig,pose,{floor}).accepted,true);
  mutate(rig);const r=inspectPose(rig,pose);
  assert([...r.supports.issues,...r.form.issues].some(i=>i.name===expected),expected);
 }
});
test('Cow Face rejects the former widely separated arm preparation',()=>{
 const pose=findPoseByPath(yogaPoses,'/movement/poses/knee-pile-bind'),{rig,floor}=fixture();
 applyPose(rig,pose,{floor});
 const old={leftShoulder:[-202.04974351916462,-22.87830700725317,-50.89644188154489],leftElbow:[-117.27543128002436,0,0],leftWrist:[0,0,0],rightShoulder:[53.070237138308585,71.68087643757463,-8.23997915815562],rightElbow:[-79.81265876628458,0,0],rightWrist:[0,0,0]};
 for(const [id,angles] of Object.entries(old))rig.byId[id].group.rotation.set(...angles.map(THREE.MathUtils.degToRad));
 assert(inspectPoseForm(rig,pose).issues.some(i=>i.name==='Hands approach behind the back'));
});
test('Butterfly reaches forward symmetrically without hand or body overlap',()=>{
 const pose=yogaPoses.find(p=>p.source.endsWith('/Butterfly'));
 const {rig,floor}=fixture();assert.equal(applyPose(rig,pose,{floor}).accepted,true);
 const self=createSelfConstraints(rig);
 assert.deepEqual(self.contacts(),[]);assert.deepEqual(self.externalContacts(),[]);
 assert.deepEqual(self.jointViolations(),[]);
 const position=id=>rig.byId[id].group.getWorldPosition(new THREE.Vector3());
 for(const part of ['Wrist','Elbow','Knee','Ankle']){
  const a=position('left'+part),b=position('right'+part);
  assert(Math.abs(a.x+b.x)<1e-8&&Math.abs(a.y-b.y)<1e-8&&Math.abs(a.z-b.z)<1e-8,part);
 }
 rig.byId.leftShoulder.group.rotation.set(-.7,0,-.3);
 assert(inspectPoseForm(rig,pose).issues.some(i=>i.name==='left hand reaches beyond feet'));
});
test('Butterfly rejects the original draft and retains its sole-pair requirement',()=>{
 const pose=yogaPoses.find(p=>p.source.endsWith('/Butterfly'));
 assert.equal(pose.poseContract,'butterfly-forward-fold-v1');assert.equal(pose.draft,false);
 assert.deepEqual(supportProfile({...pose,supportRequirements:[]}).requirements,['sit-bones','sole-pair','palms']);
 const {rig,floor}=fixture();applyPose(rig,uncorrectedYogaPoses.find(p=>p.source===pose.source),{floor});
 const report=inspectPose(rig,pose);
 for(const name of ['sit-bones','sole-pair'])assert(report.supports.issues.some(i=>i.name===name));
 assert(report.rom.issues.some(i=>i.joint==='leftHip'));
});
test('Butterfly detects lost contact, fold and range while Bound Angle remains independent',()=>{
 const pose=yogaPoses.find(p=>p.source.endsWith('/Butterfly'));
 for(const [mutate,expected] of [
  [rig=>{rig.root.position.y+=.03;},'sit-bones'],
  [rig=>{rig.byId.leftHip.group.rotation.z+=.1;},'sole-pair'],
  [rig=>{rig.byId.leftAnkle.group.rotation.x+=Math.PI;},'sole-pair'],
  [rig=>{rig.byId.leftWrist.group.rotation.x+=Math.PI;},'palms'],
  [rig=>{rig.byId.waist.group.rotation.x=0;rig.byId.torso.group.rotation.x=0;},'Trunk folds toward feet'],
 ]){
  const {rig,floor}=fixture();assert.equal(applyPose(rig,pose,{floor}).accepted,true);
  mutate(rig);const report=inspectPose(rig,pose);
  assert([...report.supports.issues,...report.form.issues].some(i=>i.name===expected),expected);
 }
 const {rig,floor}=fixture(),bound=yogaPoses.find(p=>p.source.endsWith('/BoundAngle'));
 applyPose(rig,pose,{floor});rig.byId.leftHip.group.rotation.set(-150*Math.PI/180,0,0);
 assert(inspectPose(rig,pose).rom.issues.some(i=>i.joint==='leftHip'));
 assert.equal(applyPose(rig,bound,{floor}).accepted,true);
 assert.equal(rig.byId.waist.group.rotation.x,0);
 assert(inspectPoseForm(rig,pose).issues.some(i=>i.name==='Trunk folds toward feet'));
 assert.equal(applyPose(rig,pose,{floor}).accepted,true);
});
test('Caterpillar requires seated, heel and palm supports even when metadata is cleared',()=>{
 const pose=yogaPoses.find(p=>p.source.endsWith('/Caterpillar'));
 assert.equal(pose.poseContract,'caterpillar-palms-v1');assert.equal(pose.draft,false);
 assert.deepEqual(supportProfile({...pose,supportRequirements:[]}).requirements,['sit-bones','palms','heels']);
 const {rig,floor}=fixture();applyPose(rig,uncorrectedYogaPoses.find(p=>p.source===pose.source),{floor});
 const report=inspectPose(rig,pose);
 assert(report.supports.issues.some(i=>i.name==='sit-bones'));
 assert(report.supports.issues.some(i=>i.name==='heels'));
 assert(report.rom.issues.some(i=>i.joint==='leftHip'));
});
test('Caterpillar rejects floating seat, reversed palm, lifted heel and loss of forward fold',()=>{
 const pose=yogaPoses.find(p=>p.source.endsWith('/Caterpillar'));
 for(const [mutate,expected] of [
  [rig=>{rig.root.position.y+=.03;},'sit-bones'],
  [rig=>{rig.byId.leftWrist.group.rotation.x+=Math.PI;},'palms'],
  [rig=>{rig.byId.leftHip.group.rotation.x-=.15;},'heels'],
  [rig=>{rig.byId.waist.group.rotation.x=0;rig.byId.torso.group.rotation.x=0;},'Trunk folds toward the legs'],
  [rig=>{rig.byId.leftKnee.group.rotation.x=.6;},'left knee remains nearly extended'],
 ]){
  const {rig,floor}=fixture();assert.equal(applyPose(rig,pose,{floor}).accepted,true);
  mutate(rig);const report=inspectPose(rig,pose);
  assert([...report.supports.issues,...report.form.issues].some(i=>i.name===expected),expected);
 }
});
test('Cobra requires a reviewed contract and rejects the original floating draft',()=>{
 const pose=yogaPoses.find(p=>p.source.endsWith('/CobraFull'));
 assert.equal(pose.poseContract,'cobra-grounded-v1');assert.equal(pose.draft,false);
 assert.deepEqual(supportProfile({...pose,supportRequirements:[]}).requirements,['front-core','palms','foot-tops']);
 const {rig,floor}=fixture();
 applyPose(rig,uncorrectedYogaPoses.find(p=>p.source===pose.source),{floor});
 assert.deepEqual(inspectPose(rig,pose).supports.issues.map(i=>i.name),['front-core','palms','foot-tops']);
});
test('Cobra rejects lifted pelvis, reversed palm, wrong foot direction and lost backbend',()=>{
 const pose=yogaPoses.find(p=>p.source.endsWith('/CobraFull'));
 for(const [mutate,expected] of [
  [rig=>{rig.root.position.y+=.03;},'front-core'],
  [rig=>{rig.byId.leftWrist.group.rotation.x+=Math.PI;},'palms'],
  [rig=>{rig.byId.leftAnkle.group.rotation.x=0;},'foot-tops'],
  [rig=>{rig.byId.waist.group.rotation.x=0;rig.byId.torso.group.rotation.x=0;},'Lumbar and thoracic extension'],
 ]){
  const {rig,floor}=fixture();assert.equal(applyPose(rig,pose,{floor}).accepted,true);
  mutate(rig);const report=inspectPose(rig,pose);
  assert([...report.supports.issues,...report.form.issues].some(i=>i.name===expected),expected);
 }
});
test('valid reviewed supports are preserved across repeated application without legacy floorSupport metadata',()=>{
 for(const key of ['CobraFull','Crow','Caterpillar','Butterfly','BoundAngle','KneePileBind']){
  const pose=structuredClone(yogaPoses.find(p=>p.source.endsWith('/'+key)));delete pose.floorSupport;
  const {rig,floor}=fixture();assert.equal(applyPose(rig,pose,{floor}).accepted,true);
  const before=capturePose(rig.root,rig.joints);
  assert.equal(applyPose(rig,pose,{floor}).accepted,true);
  const after=capturePose(rig.root,rig.joints);
  assert(before.position.distanceTo(after.position)<1e-9);
  after.rotations.forEach((q,i)=>assert(q.angleTo(before.rotations[i])<1e-7));
  assert(rig.meshes.every(m=>floorClearance(m)>=FLOOR_SKIN-.00002));
 }
});
test('forward leaning Archer does not qualify as upright merely because the toe reaches the ear',()=>{
 const {rig,floor}=fixture(),pose=yogaPoses.find(p=>p.name==="Archer's");
 applyPose(rig,pose,{floor});
 assert.equal(inspectPoseForm(rig,{...pose,poseContract:'archer-upright-v1'}).issues[0].name,'Upright trunk');
});
test('failed automatic correction restores authored joints and floor cache',()=>{
 const {rig,floor}=fixture(),pose=structuredClone(yogaPoses.find(p=>p.name==='Crow'));
 pose.rotations.leftKnee=[0,0,0];
 const result=applyPose(rig,pose,{floor});
 assert.equal(result.accepted,false);
 assert(Math.abs(rig.byId.leftKnee.group.rotation.x)<1e-12);
 assert.deepEqual(rig.root.position.toArray(),pose.rootPosition);
 assert.deepEqual(floor.snapshot().safe,capturePose(rig.root,rig.joints));
});
