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
test('neck routine moves only the head, keeps both soles supported, and completes without blocking',()=>{
 const material=new THREE.MeshStandardMaterial(),body=createBody({scene:new THREE.Scene(),dimensions,bodyMaterial:material,jointMaterial:material}),meshes=[];
 body.root.traverse(m=>{if(m.isMesh)meshes.push(m);});
 const rig={...body,dimensions,meshes,byId:Object.fromEntries(body.joints.map(j=>[j.id,j]))};
 const floor=createFloorConstraints(rig),self=createSelfConstraints(rig),timeline=createTimeline(neckStretching.steps);
 const frames=neckStretching.steps.map(step=>{
  body.root.position.fromArray(step.rootPosition);
  for(const j of body.joints)j.group.rotation.set(...(step.rotations[j.id]||[0,0,0]).map(THREE.MathUtils.degToRad));
  floor.settle();return floor.snapshot().pose;
 });
 assert.equal(timeline.duration,61);assert.equal(frames.length,9);
 for(let time=0;time<=timeline.duration;time+=.1){
  const s=timeline.sample(time),from=frames[s.index],to=frames[s.next];
  body.root.position.lerpVectors(from.position,to.position,s.mix);
  body.joints.forEach((j,i)=>j.group.quaternion.slerpQuaternions(from.rotations[i],to.rotations[i],s.mix));
  body.root.updateWorldMatrix(true,true);
  assert(floor.clearance()>=.0007-1e-8);
  assert.deepEqual(inspectJointRanges(body.joints).issues,[]);
  const supports=inspectSupports(rig,{source:'https://www.pocketyoga.com/pose/MountainArmsSide',category:'Standing'});
  assert(supports.requirements[0].pass,`Sole support at ${time}`);
  body.joints.forEach((j,i)=>{if(j.id!=='neck')assert(j.group.quaternion.angleTo(frames[0].rotations[i])<1e-7,'Only the head changes orientation');});
  if(time===0)self.sync();else assert(self.commit(),`Blocked at ${time}`);
 }
 const neck=rig.byId.neck.group;
 neck.rotation.set(0,THREE.MathUtils.degToRad(-35),0);
 assert(new THREE.Vector3(0,0,1).applyQuaternion(neck.quaternion).x<0,'Right follows the model, not the viewer');
 neck.rotation.set(0,0,THREE.MathUtils.degToRad(20));
 assert(new THREE.Vector3(0,1,0).applyQuaternion(neck.quaternion).x<0,'Right tilt moves toward the model right shoulder');
});
