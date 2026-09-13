import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {wristAngles} from '../wrist-constraints.js';
import {createSelfConstraints} from '../self-constraints.js';
const rad=THREE.MathUtils.degToRad;
function rig(){const root=new THREE.Group(),group=new THREE.Group();root.add(group);const joint={id:'leftWrist',group,limits:[[-80,80],[-90,90],[-35,35]]};return {root,group,guard:createSelfConstraints({root,joints:[joint]})};}
test('wrist bend is independent of whole-body orientation, quaternion sign and axial roll',()=>{
 const q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),rad(-70));
 q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),rad(170)));
 assert(Math.abs(wristAngles(q).bend-rad(-70))<1e-10);
 assert(Math.abs(wristAngles(q).tilt)<1e-10);
 const negative=new THREE.Quaternion(-q.x,-q.y,-q.z,-q.w);
 assert(Math.abs(wristAngles(negative).bend-rad(-70))<1e-10);
 const {root,group,guard}=rig();root.rotation.set(1,2,3);group.quaternion.copy(q);assert(guard.commit());
});
test('swept edits stop excessive wrist bending and side tilt without Euler clamping',()=>{
 for(const [axis,target,limit] of [['x',-120,80],['x',120,80],['z',80,35],['z',-80,35]]){
  const {group,guard}=rig();group.rotation[axis]=rad(target);
  assert.equal(guard.commit(),false);
  const angle=wristAngles(group.quaternion)[axis==='x'?'bend':'tilt'];
  assert(Math.abs(Math.abs(angle)-rad(limit))<.0002);
  assert.deepEqual(guard.jointViolations(),[]);
 }
});
test('saved out-of-range wrists stay diagnosable and can improve but cannot worsen',()=>{
 const {group,guard}=rig();group.rotation.x=rad(-110);guard.sync();
 assert.deepEqual(guard.jointViolations(),[{id:'leftWrist'}]);
 const snapshot=guard.snapshot();group.rotation.x=rad(-100);assert(guard.commit());
 group.rotation.x=rad(-120);assert.equal(guard.commit(),false);
 assert(Math.abs(wristAngles(group.quaternion).bend-rad(-100))<.0002);
 guard.restore(snapshot);group.rotation.x=rad(-70);assert(guard.commit());
 assert.deepEqual(guard.jointViolations(),[]);
});
