import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBody} from '../body.js';
import {yogaPoses} from '../poses.js';
import {mirrorRotations} from '../ashtanga-shapes.js';
import {createFloorConstraints} from '../floor-constraints.js';
import {createSelfConstraints,segmentDistance} from '../self-constraints.js';
import {applyHandPreset} from '../hands.js';
import {applyHandOffsets} from '../hand-offsets.js';
import {placePalmsOnFloor,palmsAreSupported} from '../palm-support.js';
import {inspectSupports,inspectJointRanges} from '../pose-validation.js';
import {capturePose,restorePose} from '../pole-constraints.js';

const keys=['WarriorI','WarriorII','WarriorIII','TriangleForward','TriangleRevolved','Lunge','Lizard','LungeCrescent','WarriorIKneeling','ForwardBendBigToe'];
function fixture(){
 const dimensions={pelvisHeight:.97,torso:.48,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43},material=new THREE.MeshStandardMaterial();
 const body=createBody({scene:new THREE.Scene(),dimensions,bodyMaterial:material,jointMaterial:material}),meshes=[];
 body.root.traverse(m=>{if(m.isMesh)meshes.push(m);});
 const rig={...body,dimensions,meshes,byId:Object.fromEntries(body.joints.map(j=>[j.id,j]))};
 return {...rig,floor:createFloorConstraints(rig),self:createSelfConstraints(rig)};
}
function apply(rig,pose){
 applyHandOffsets(rig.root,pose.handOffsets);rig.root.position.fromArray(pose.rootPosition);
 for(const j of rig.joints)j.group.rotation.set(...(pose.rotations[j.id]||[0,0,0]).map(THREE.MathUtils.degToRad));
 for(const hand of Object.values(rig.hands))applyHandPreset(hand,'open');
 if(palmsAreSupported(pose))placePalmsOnFloor(rig);rig.floor.settle();
}
function verify(rig,pose){
 assert.deepEqual(inspectSupports(rig,pose).issues,[],`${pose.name}: support`);
 assert.deepEqual(inspectJointRanges(rig.joints).issues,[],`${pose.name}: joint range`);
 assert.deepEqual(rig.self.contacts(),[],`${pose.name}: body contact`);
 assert.deepEqual(rig.self.jointViolations(),[],`${pose.name}: wrist`);
 assert(rig.floor.clearance()>=.0007-1e-8,`${pose.name}: floor`);
}
test('all ten family poses and their reflections retain required supports and joint ranges',()=>{
 const rig=fixture();
 for(const key of keys){
  const pose=yogaPoses.find(p=>p.source.endsWith('/'+key));assert(pose,key);
  for(const mirrored of [false,true]){
   const p=mirrored?{...pose,rotations:mirrorRotations(pose.rotations)}:pose;
   apply(rig,p);verify(rig,p);
   // Captured poses return through the same placement function on load.
   const saved=capturePose(rig.root,rig.joints);rig.root.position.y+=.2;restorePose(rig.root,rig.joints,saved);
   if(palmsAreSupported(p))placePalmsOnFloor(rig);rig.floor.settle();verify(rig,p);
   const restored=capturePose(rig.root,rig.joints);
   assert(restored.position.distanceTo(saved.position)<1e-8,`${p.name}: reload moved root`);
   assert(restored.rotations.every((q,i)=>q.angleTo(saved.rotations[i])<1e-7),`${p.name}: reload changed joints`);
  }
 }
});
test('catalog Big Toe grounds its feet without lifting the body to clear hands and reaches toward each big toe',()=>{
 const rig=fixture(),pose=yogaPoses.find(p=>p.source.endsWith('/ForwardBendBigToe'));
 apply(rig,pose);verify(rig,pose);
 assert(Math.abs(rig.root.position.y-pose.rootPosition[1])<.001,'authored pose must not require whole-body lifting');
 assert(pose.draft);assert.match(pose.modification,/No toe grip/);
 const cap=mesh=>{const p=mesh.geometry.parameters;return {a:mesh.localToWorld(new THREE.Vector3(0,-p.height/2,0)),b:mesh.localToWorld(new THREE.Vector3(0,p.height/2,0)),r:p.radius};};
 for(const side of ['left','right']){
  assert.equal(rig.byId[side+'Knee'].group.rotation.x,0,'catalog version keeps straight knees');
  const toe=rig.feet[side].joints.filter(j=>j.id.includes('ToeBig')).map(j=>cap(j.group.children.find(m=>m.geometry?.type==='CapsuleGeometry')));
  for(const finger of ['Index','Middle']){
   const segments=rig.hands[side].joints.filter(j=>j.finger===finger).map(j=>cap(j.group.children.find(m=>m.geometry?.type==='CapsuleGeometry')));
   const gap=Math.min(...segments.flatMap(a=>toe.map(b=>segmentDistance(a.a,a.b,b.a,b.b)-a.r-b.r)));
   assert(gap>.005&&gap<.04,`${side} ${finger}: reach near the toe without pretending to grip it (${gap})`);
  }
 }
 // Disjoint individual bounds prove no hand/foot penetration in this hold.
 const feet=Object.values(rig.feet).flatMap(f=>f.meshes.map(m=>new THREE.Box3().setFromObject(m,true)));
 for(const hand of Object.values(rig.hands))for(const mesh of hand.meshes){
  const bound=new THREE.Box3().setFromObject(mesh,true);
  assert(feet.every(f=>!bound.intersectsBox(f)),'hand/foot clearance');
 }
});
test('lunge variants preserve their distinct placement and intentional rear support',()=>{
 const rig=fixture(),position=id=>rig.byId[id].group.getWorldPosition(new THREE.Vector3());
 for(const key of ['Lunge','Lizard','LungeCrescent','WarriorIKneeling']){
  const p=yogaPoses.find(p=>p.source.endsWith('/'+key));apply(rig,p);
  const s=inspectSupports(rig,p).surfaces;
  assert(s['left-sole'].pass);
  assert(position('leftAnkle').z>position('rightAnkle').z+.5,'front and rear feet must remain separated');
  if(key==='WarriorIKneeling'){assert(s['right-knee'].pass);assert(s['right-foot-top'].pass);}
  else {assert(s['right-toe'].pass);assert(!s['right-sole'].pass,'rear heel is intentionally raised');}
  if(key==='Lizard')assert(position('leftAnkle').x>position('leftWrist').x+.03,'front foot remains outside the hands');
  if(key==='Lunge')assert(position('leftAnkle').x<position('leftWrist').x,'front foot remains between the hands');
 }
});
