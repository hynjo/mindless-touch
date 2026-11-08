import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBody} from '../body.js';
import {capturePose} from '../pole-constraints.js';
import {solveHandGrip} from '../hand-grip-solver.js';
function fixture(){
 const material=new THREE.MeshStandardMaterial();
 const dimensions={pelvisHeight:.97,torso:.48,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43};
 const rig=createBody({scene:new THREE.Scene(),dimensions,bodyMaterial:material,jointMaterial:material});
 rig.dimensions=dimensions;rig.byId=Object.fromEntries(rig.joints.map(j=>[j.id,j]));rig.meshes=[];rig.root.traverse(m=>{if(m.isMesh)rig.meshes.push(m)});return rig;
}
test('failed grip search rolls back every joint, root and hand offset',()=>{
 const rig=fixture();rig.hands.left.root.position.z=-.025;
 const before=capturePose(rig.root,rig.joints);
 const result=solveHandGrip(rig,{iterations:20});
 assert.equal(result.success,false);assert.equal(result.certified,false);
 assert.deepEqual(capturePose(rig.root,rig.joints),before);
 assert.equal(result.iterations,20);assert(result.blockers.supports.length);
});
test('same seed and budget reproduce the same diagnostic result',()=>{
 const rig=fixture();
 const first=solveHandGrip(rig,{iterations:25,seed:73,apply:false});
 const second=solveHandGrip(rig,{iterations:25,seed:73,apply:false});
 assert.deepEqual(first,second);
});
test('zero budget checks input and invalid budgets do not mutate it',()=>{
 const rig=fixture(),before=capturePose(rig.root,rig.joints);
 assert.equal(solveHandGrip(rig,{iterations:0}).iterations,0);
 for(const iterations of [-1,Infinity,20001,.5])assert.throws(()=>solveHandGrip(rig,{iterations}),RangeError);
 assert.deepEqual(capturePose(rig.root,rig.joints),before);
});
test('saved solved candidates pass independent guards after JSON restoration',async()=>{
 const {readFileSync}=await import('node:fs');
 const {inspectHandContact}=await import('../hand-contact-diagnostics.js');
 const {createSelfConstraints}=await import('../self-constraints.js');
 const {inspectPose}=await import('../pose-validation.js');
 const {floorClearance}=await import('../floor-constraints.js');
 const results=JSON.parse(readFileSync(new URL('../hand-grip-solver-results.json',import.meta.url),'utf8'));
 for(const result of results){
  assert(result.success);
  const rig=fixture();rig.root.position.copy(result.pose.position);
  rig.joints.forEach((j,i)=>j.group.quaternion.fromArray(result.pose.rotations[i]));
  for(const side of ['left','right'])rig.hands[side].root.position.copy(result.pose.handOffsets[side]);
  const report=inspectPose(rig,{supportRequirements:['sit-bones']}),self=createSelfConstraints(rig);
  assert.deepEqual(report.rom.issues,[]);assert.deepEqual(report.supports.issues,[]);
  assert.deepEqual(self.contacts(0),[]);assert.deepEqual(self.jointViolations(),[]);assert.deepEqual(self.externalContacts(1e-9),[]);
  assert(Math.min(...rig.meshes.map(floorClearance))>=.00068);
  assert(inspectHandContact(rig).hookedGripCandidate.pass);
  const before=capturePose(rig.root,rig.joints);
  assert.equal(solveHandGrip(rig,{iterations:0,apply:false}).success,false);
  assert.deepEqual(capturePose(rig.root,rig.joints),before);
 }
});
