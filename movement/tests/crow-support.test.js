import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBody} from '../body.js';
import {yogaPoses,uncorrectedYogaPoses} from '../poses.js';
import {createFloorConstraints} from '../floor-constraints.js';
import {createSelfConstraints} from '../self-constraints.js';
import {inspectPose} from '../pose-validation.js';
import {inspectCrowSupport} from '../crow-support.js';
import {capturePose,restorePose} from '../pole-constraints.js';
import {supportProfile} from '../support-profiles.js';
import {serializeSequence,parseSequence,SEQUENCE_FORMAT} from '../sequence-file.js';

function fixture(pose=yogaPoses.find(p=>p.name==='Crow')){
 const dimensions={pelvisHeight:.97,torso:.48,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43},material=new THREE.MeshStandardMaterial();
 const body=createBody({scene:new THREE.Scene(),dimensions,bodyMaterial:material,jointMaterial:material}),meshes=[];
 body.root.traverse(m=>{if(m.isMesh)meshes.push(m);});
 const rig={...body,meshes,dimensions,byId:Object.fromEntries(body.joints.map(j=>[j.id,j]))};
 rig.root.position.fromArray(pose.rootPosition);
 for(const j of rig.joints)j.group.rotation.set(...(pose.rotations[j.id]||[0,0,0]).map(THREE.MathUtils.degToRad));
 const floor=createFloorConstraints(rig);floor.settle();
 return {rig,pose,floor};
}
test('Crow supports both palms and knee regions while all legs remain airborne after restoration',()=>{
 const {rig,pose,floor}=fixture(),self=createSelfConstraints(rig);
 const saved=capturePose(rig.root,rig.joints);rig.root.position.y+=.2;
 restorePose(rig.root,rig.joints,saved);floor.settle();
 const result=inspectPose(rig,pose);
 assert.deepEqual(result.supports.issues,[]);
 assert.deepEqual(result.rom.issues,[]);
 assert.deepEqual(self.contacts(0),[]);assert.deepEqual(self.jointViolations(),[]);
 for(const sample of result.supports.surfaces['crow-knees-on-arms'].samples){
  assert(sample.gapMm>=0&&sample.gapMm<5);assert(sample.alignment>.5);
  assert(Math.abs(sample.elbowDegrees-90)<1);
 }
 assert(result.supports.surfaces['legs-airborne'].gapMm>50);
 assert(!result.supports.actualContactRegions.includes('legs-airborne'),'clearance is not contact');
 assert(result.supports.actualContactRegions.includes('crow-knees-on-arms'));
});
test('the original collision-free Crow fails palms, knee support and airborne-leg requirements',()=>{
 const {rig,pose}=fixture(uncorrectedYogaPoses.find(p=>p.name==='Crow'));
 assert.deepEqual(inspectPose(rig,pose).supports.issues.map(r=>r.name),['palms','crow-knees-on-arms','legs-airborne']);
});
test('one separated knee, contact below the arm and straight elbows cannot pass Crow support',()=>{
 const {rig}=fixture();
 rig.byId.leftHip.group.position.x+=.1;
 let relation=inspectCrowSupport(rig)['crow-knees-on-arms'];
 assert(!relation.pass);assert(relation.samples.find(s=>s.side==='right').pass);
 const underside=fixture().rig;underside.root.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),Math.PI));
 assert(!inspectCrowSupport(underside)['crow-knees-on-arms'].pass);
 const straight=fixture().rig;straight.byId.leftElbow.group.rotation.set(0,0,0);
 assert(!inspectCrowSupport(straight)['crow-knees-on-arms'].pass);
});
test('lowering the legs into the floor fails clearance even with the knee-arm relation intact',()=>{
 const {rig}=fixture();rig.root.position.y-=.2;
 const result=inspectCrowSupport(rig);
 assert(result['crow-knees-on-arms'].pass);
 assert(!result['legs-airborne'].pass);
});
test('knee-region penetration is rejected rather than counted as supporting contact',()=>{
 const {rig}=fixture();
 const localDown=new THREE.Vector3(0,-.02,0).applyQuaternion(rig.root.getWorldQuaternion(new THREE.Quaternion()).invert());
 rig.byId.leftHip.group.position.add(localDown);
 const relation=inspectCrowSupport(rig)['crow-knees-on-arms'];
 assert(relation.minGapMm< -1);
 assert(!relation.pass);
});
test('Crow relational and clearance requirements survive a sequence JSON round trip',()=>{
 const {rig,pose}=fixture(),context={studio:'movement',dimensions:rig.dimensions,jointIds:rig.joints.map(j=>j.id)};
 const document={format:SEQUENCE_FORMAT,version:1,studio:'movement',dimensions:rig.dimensions,name:'Crow review',steps:[{
  id:'crow',name:'Crow',holdSeconds:3,transitionSeconds:2,floorSupport:'ground',supportRequirements:supportProfile(pose).requirements,
  pose:{rootPosition:rig.root.position.toArray(),rotations:Object.fromEntries(rig.joints.map(j=>[j.id,j.group.rotation.toArray().slice(0,3)])),poleContacts:{}},
 }]};
 const restored=parseSequence(serializeSequence(document,context),context);
 assert.deepEqual(restored.steps[0].supportRequirements,['palms','crow-knees-on-arms','legs-airborne']);
});
