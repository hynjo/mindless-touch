import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {inspectJointRanges} from '../pose-validation.js';

// Compose rotations directly around the parent X, floating Z, then femoral Y
// axes. Avoid constructing the fixture with the Euler decoder under test.
function hip(flexion,abduction,axial,side='left'){
 const sign=side==='left'?1:-1;
 const turn=(axis,degrees)=>new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(...axis),THREE.MathUtils.degToRad(degrees));
 const group=new THREE.Group();
 group.quaternion.copy(turn([1,0,0],-flexion))
  .multiply(turn([0,0,1],sign*abduction))
  .multiply(turn([0,1,0],sign*axial));
 return {id:`${side}Hip`,group};
}
const inspect=joint=>inspectJointRanges([joint]);
const values=result=>result.measurements.map(m=>m.degrees);

test('compound hip flexion and abduction do not inflate femoral axial rotation',()=>{
 const joint=hip(120,50,55),q=joint.group.quaternion;
 // The previous reference-Y twist proxy rejected this combination.
 assert.ok(Math.abs(THREE.MathUtils.radToDeg(2*Math.atan2(q.y,q.w)))>60);
 const result=inspect(joint);
 assert.deepEqual(result.issues,[]);
 assert.deepEqual(values(result),[120,50,55]);
});

test('pure and compound excessive hip axial rotation remain invalid on both sides',()=>{
 for(const side of ['left','right'])for(const [flexion,abduction] of [[0,0],[120,50]]){
  const result=inspect(hip(flexion,abduction,75,side));
  assert.equal(result.issues.length,1);
  assert.equal(result.issues[0].motion,'axial rotation');
  assert.equal(Math.abs(result.issues[0].degrees),75);
  assert.equal(result.issues[0].excessDegrees,15);
 }
});

test('mirrored compound hips retain the same flexion and symmetric lateral angles',()=>{
 const left=inspect(hip(120,50,55)),right=inspect(hip(120,50,55,'right'));
 assert.deepEqual(left.issues,[]);
 assert.deepEqual(right.issues,[]);
 assert.deepEqual(values(left),[120,50,55]);
 assert.deepEqual(values(right),[120,-50,-55]);
});

test('hip range results are invariant to quaternion sign and Euler storage order',()=>{
 for(const side of ['left','right'])for(const angles of [[120,50,55],[100,35,75]]){
  const joint=hip(...angles,side),expected=inspect(joint);
  const q=joint.group.quaternion;
  q.set(-q.x,-q.y,-q.z,-q.w);
  assert.deepEqual(inspect(joint),expected);
  joint.group.rotation.reorder('ZYX');
  assert.deepEqual(inspect(joint),expected);
 }
});

test('hip flexion, extension and abduction limits are retained during compound motion',()=>{
 for(const side of ['left','right'])for(const [angles,motion] of [
  [[140,30,20],'flexion'],
  [[-55,30,20],'flexion'],
  [[100,80,20],'abduction/adduction'],
 ]){
  const result=inspect(hip(...angles,side));
  assert.equal(result.issues.length,1);
  assert.equal(result.issues[0].motion,motion);
  assert.equal(result.issues[0].excessDegrees,10);
 }
});
