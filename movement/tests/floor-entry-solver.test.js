import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createBody} from '../body.js';
import {yogaPoses} from '../poses.js';
import {applyPose} from '../apply-pose.js';
import {createFloorConstraints,floorClearance} from '../floor-constraints.js';
import {createSelfConstraints} from '../self-constraints.js';
import {capturePose,restorePose} from '../pole-constraints.js';
import {inspectSupports,inspectJointRanges} from '../pose-validation.js';
import {solveFloorEntry} from '../floor-entry-solver.js';
function fixture(){
 const dimensions={pelvisHeight:.97,torso:.48,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43},material=new T.MeshStandardMaterial();
 const rig=createBody({scene:new T.Scene(),dimensions,bodyMaterial:material,jointMaterial:material});rig.dimensions=dimensions;rig.byId=Object.fromEntries(rig.joints.map(j=>[j.id,j]));rig.meshes=[];rig.root.traverse(m=>{if(m.isMesh)rig.meshes.push(m)});
 applyPose(rig,yogaPoses.find(p=>p.name==='Big Toe'),{floor:createFloorConstraints(rig)});return rig;
}
test('deterministic floor entry holds soles, clears collisions and lands palms between solved frames',()=>{
 const rig=fixture(),before=capturePose(rig.root,rig.joints),result=solveFloorEntry(rig);
 assert(result.success);assert.deepEqual(capturePose(rig.root,rig.joints),before);
 const anchors=['left','right'].map(side=>rig.byId[side+'Ankle'].group.getWorldPosition(new T.Vector3()));
 const self=createSelfConstraints(rig);self.sync();
 for(let i=1;i<result.frames.length;i++)for(let part=1;part<=4;part++){
  const a=result.frames[i-1],b=result.frames[i],t=part/4;
  rig.root.position.lerpVectors(a.position,b.position,t);rig.joints.forEach((j,k)=>j.group.quaternion.slerpQuaternions(a.rotations[k],b.rotations[k],t));
  rig.root.updateWorldMatrix(true,true);
  assert.deepEqual(inspectSupports(rig,{supportRequirements:['soles']}).issues,[]);
  assert.deepEqual(inspectJointRanges(rig.joints).issues,[]);
  assert(Math.min(...rig.meshes.map(floorClearance))>=.00068);
  assert.deepEqual(self.externalContacts(1e-9),[]);
  assert(self.commit(),JSON.stringify(self.failure()));
  for(const [index,side] of ['left','right'].entries())assert(rig.byId[side+'Ankle'].group.getWorldPosition(new T.Vector3()).distanceTo(anchors[index])<.0005);
 }
 assert.deepEqual(inspectSupports(rig,{supportRequirements:['soles','palms']}).issues,[]);
 restorePose(rig.root,rig.joints,before);const again=solveFloorEntry(rig);
 assert.equal(again.success,true);assert.equal(again.attempts.length,result.attempts.length);
 again.frames.forEach((f,i)=>{assert(f.position.distanceTo(result.frames[i].position)<1e-9);f.rotations.forEach((q,k)=>assert(q.angleTo(result.frames[i].rotations[k])<1e-7));});
});
test('invalid initial support and invalid budgets preserve input',()=>{
 const rig=fixture();rig.root.position.y+=.1;const before=capturePose(rig.root,rig.joints);
 assert.equal(solveFloorEntry(rig).success,false);
 assert.throws(()=>solveFloorEntry(rig,{samples:0}),RangeError);
 assert.deepEqual(capturePose(rig.root,rig.joints),before);
});
