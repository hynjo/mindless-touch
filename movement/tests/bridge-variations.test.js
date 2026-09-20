import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBody} from '../body.js';
import {createFloorConstraints} from '../floor-constraints.js';
import {applyPose} from '../apply-pose.js';
import {yogaPoses} from '../poses.js';
import {inspectPose} from '../pose-validation.js';

const names=['Bridge','Supported Bridge','One Legged Bridge','One Legged Supported Bridge','Extended Bridge (Preparation)'];
function fixture(){const dimensions={pelvisHeight:.97,torso:.48,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43},m=new THREE.MeshStandardMaterial(),body=createBody({scene:new THREE.Scene(),dimensions,bodyMaterial:m,jointMaterial:m}),meshes=[];body.root.traverse(x=>{if(x.isMesh)meshes.push(x)});const rig={...body,dimensions,meshes,byId:Object.fromEntries(body.joints.map(j=>[j.id,j]))};return {rig,floor:createFloorConstraints(rig)};}

test('named Bridge variations are distinct shareable library poses',()=>{
 for(const name of names)assert(yogaPoses.find(p=>p.name===name),name);
 assert.equal(new Set(names.map(name=>yogaPoses.find(p=>p.name===name).source)).size,names.length);
});

test('regular Bridge retains its versioned arm and foot support contract',()=>{
 const {rig,floor}=fixture(),pose=yogaPoses.find(p=>p.name==='Bridge'),result=applyPose(rig,pose,{floor});
 assert.equal(result.accepted,true,JSON.stringify(result.attempted));
 assert.deepEqual(inspectPose(rig,pose).supports.issues,[]);
});

test('each Bridge variation keeps its declared supports and joint envelope',()=>{
 const {rig,floor}=fixture();
 for(const name of names){
  const pose=yogaPoses.find(p=>p.name===name);applyPose(rig,pose,{floor});const result=inspectPose(rig,pose);
  assert.deepEqual(result.supports.issues,[],name);
  assert.deepEqual(result.rom.issues,[],name);
 }
});
