import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {neckStretching} from '../neck-example.js';
import {createBody} from '../body.js';
import {createFloorConstraints} from '../floor-constraints.js';
import {createSelfConstraints} from '../self-constraints.js';
import {createTimeline} from '../playback.js';
import {inspectJointRanges,inspectSupports} from '../pose-validation.js';
const dimensions={pelvisHeight:.97,torso:.48,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43};
function handHeadClearance(body,side){
 body.root.updateWorldMatrix(true,true);
 const inverse=body.headMesh.matrixWorld.clone().invert();
 let clearance=Infinity;
 for(const mesh of body.hands[side].meshes){
  const vertices=mesh.geometry.attributes.position;
  for(let i=0;i<vertices.count;i++)clearance=Math.min(clearance,new THREE.Vector3().fromBufferAttribute(vertices,i).applyMatrix4(mesh.matrixWorld).applyMatrix4(inverse).length()-1);
 }
 return clearance*.105;
}
test('neck routine keeps both soles supported and completes assisted stretches without blocking',()=>{
 const material=new THREE.MeshStandardMaterial(),body=createBody({scene:new THREE.Scene(),dimensions,bodyMaterial:material,jointMaterial:material}),meshes=[];
 body.root.traverse(m=>{if(m.isMesh)meshes.push(m);});
 const rig={...body,dimensions,meshes,byId:Object.fromEntries(body.joints.map(j=>[j.id,j]))};
 const floor=createFloorConstraints(rig),self=createSelfConstraints(rig),timeline=createTimeline(neckStretching.steps);
 const frames=neckStretching.steps.map(step=>{
  body.root.position.fromArray(step.rootPosition);
  for(const j of body.joints)j.group.rotation.set(...(step.rotations[j.id]||[0,0,0]).map(THREE.MathUtils.degToRad));
  floor.settle();return floor.snapshot().pose;
 });
 assert.equal(timeline.duration,135);assert.equal(frames.length,21);
 for(let time=0;time<=timeline.duration;time+=.1){
  const s=timeline.sample(time),from=frames[s.index],to=frames[s.next];
  body.root.position.lerpVectors(from.position,to.position,s.mix);
  body.joints.forEach((j,i)=>j.group.quaternion.slerpQuaternions(from.rotations[i],to.rotations[i],s.mix));
  body.root.updateWorldMatrix(true,true);
  assert(floor.clearance()>=.0007-1e-8);
  assert.deepEqual(inspectJointRanges(body.joints).issues,[]);
  const supports=inspectSupports(rig,{source:'https://www.pocketyoga.com/pose/MountainArmsSide',category:'Standing'});
  assert(supports.requirements[0].pass,`Sole support at ${time}`);
  const currentId=neckStretching.steps[s.index].id;
  const activeSide=currentId.includes('right')?'right':currentId.includes('left')?'left':null;
  if(activeSide)assert(handHeadClearance(body,activeSide)>=-.002,`${activeSide} hand crosses into the head at ${time}`);
  body.joints.forEach((j,i)=>{
   if(j.id==='neck'||activeSide&&j.id.startsWith(activeSide)&&/Shoulder|Elbow|Wrist/.test(j.id))return;
   if(s.mix>0)return;
   assert(j.group.quaternion.angleTo(frames[0].rotations[i])<1e-7,`${j.id} should remain neutral in ${neckStretching.steps[s.index].name}`);
  });
  if(time===0)self.sync();else assert(self.commit(),`Blocked at ${time}: ${JSON.stringify({contacts:self.contacts(),limits:self.jointViolations()})}`);
 }
 const neck=rig.byId.neck.group;
 neck.rotation.set(0,THREE.MathUtils.degToRad(-35),0);
 assert(new THREE.Vector3(0,0,1).applyQuaternion(neck.quaternion).x<0,'Right follows the model, not the viewer');
 neck.rotation.set(0,0,THREE.MathUtils.degToRad(20));
 assert(new THREE.Vector3(0,1,0).applyQuaternion(neck.quaternion).x<0,'Right tilt moves toward the model right shoulder');
});
test('assisted cards use the tilting-side hand across the head and stage wrist-safe reach and release cards',()=>{
 const right=neckStretching.steps.find(step=>step.id==='neck-assisted-right');
 const left=neckStretching.steps.find(step=>step.id==='neck-assisted-left');
 assert.deepEqual(Object.keys(right.rotations).filter(id=>/Shoulder|Elbow|Wrist/.test(id)),['rightShoulder','rightElbow','rightWrist']);
 assert.deepEqual(Object.keys(left.rotations).filter(id=>/Shoulder|Elbow|Wrist/.test(id)),['leftShoulder','leftElbow','leftWrist']);
 assert(right.rotations.neck[2]>0);assert(left.rotations.neck[2]<0);
 for(const id of ['neck-center-4','neck-center-5','neck-finish']){
  const step=neckStretching.steps.find(item=>item.id===id);
  assert(!Object.keys(step.rotations).some(joint=>/Shoulder|Elbow|Wrist/.test(joint)),`${id} releases the assisting arm`);
 }
 for(const [id,side,direction] of [['neck-reach-right','right',-1],['neck-release-right','right',-1],['neck-reach-left','left',1],['neck-release-left','left',1]]){
  const step=neckStretching.steps.find(item=>item.id===id);
  assert.equal(step.rotations[side+'Wrist'][1],direction*170,`${id} stages axial hand rotation before bending`);
 }
});
test('the reaching hand stays outside the head until the assisted contact',()=>{
 const material=new THREE.MeshStandardMaterial(),body=createBody({scene:new THREE.Scene(),dimensions,bodyMaterial:material,jointMaterial:material});
 for(const [id,side] of [['neck-reach-right','right'],['neck-reach-left','left']]){
  const step=neckStretching.steps.find(item=>item.id===id);body.root.position.fromArray(step.rootPosition);
  for(const joint of body.joints)joint.group.rotation.set(...(step.rotations[joint.id]||[0,0,0]).map(THREE.MathUtils.degToRad));
  const clearance=handHeadClearance(body,side);assert(clearance>=.005,`${id} enters the head by ${(-clearance*1000).toFixed(1)} mm`);
 }
 for(const [id,side] of [['neck-assisted-right','right'],['neck-assisted-left','left']]){
  const step=neckStretching.steps.find(item=>item.id===id);body.root.position.fromArray(step.rootPosition);
  for(const joint of body.joints)joint.group.rotation.set(...(step.rotations[joint.id]||[0,0,0]).map(THREE.MathUtils.degToRad));
  const clearance=handHeadClearance(body,side);assert(clearance>=-.002&&clearance<=.004,`${id} must rest at the head surface: ${clearance}`);
 }
});
