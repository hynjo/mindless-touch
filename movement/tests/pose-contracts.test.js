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
 const stored={...pose,pose:{rootPosition:rig.root.position.toArray(),rotations:Object.fromEntries(rig.joints.map(j=>[j.id,[j.group.rotation.x,j.group.rotation.y,j.group.rotation.z]]))}};
 const snapshot=capturePose(rig.root,rig.joints);
 applyPose(rig,yogaPoses.find(p=>p.name==='Mountain'),{floor});
 applyPose(rig,stored,{floor});
 const restored=capturePose(rig.root,rig.joints);
 assert(restored.position.distanceTo(snapshot.position)<1e-10);
 restored.rotations.forEach((q,index)=>assert(q.angleTo(snapshot.rotations[index])<1e-7,`${pose.name}: joint ${index} changed during restore`));
 assert.deepEqual(inspectPose(rig,stored).supports.issues,[]);
 assert.deepEqual(inspectScheduledHolds(rig,[stored],[snapshot]),[]);
});
test('contract requirements cannot be weakened through editable support metadata',()=>{
 assert.deepEqual(supportProfile({poseContract:'archer-forward-lean-v1',supportRequirements:[]}).requirements,['sit-bones','archer-leg-support','both-toe-grips']);
 assert.throws(()=>supportProfile({poseContract:'unknown'}),/Unknown/);
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
