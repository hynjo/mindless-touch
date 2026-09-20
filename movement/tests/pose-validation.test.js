import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBody} from '../body.js';
import {yogaPoses} from '../poses.js';
import {createFloorConstraints} from '../floor-constraints.js';
import {applyHandOffsets} from '../hand-offsets.js';
import {inspectJointRanges,inspectSupports,evaluateSupportRequirements} from '../pose-validation.js';
import {supportProfile} from '../support-profiles.js';
import {createSelfConstraints} from '../self-constraints.js';
import {capturePose,restorePose} from '../pole-constraints.js';
import {ashtangaShortPractice} from '../ashtanga-example.js';
function fixture(name){
 const dimensions={pelvisHeight:.97,torso:.48,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43},material=new THREE.MeshStandardMaterial();
 const body=createBody({scene:new THREE.Scene(),dimensions,bodyMaterial:material,jointMaterial:material}),pose=yogaPoses.find(p=>p.name===name),meshes=[];
 body.root.traverse(m=>{if(m.isMesh)meshes.push(m);});
 const rig={...body,meshes,dimensions,byId:Object.fromEntries(body.joints.map(j=>[j.id,j]))};
 applyHandOffsets(body.root,pose.handOffsets);body.root.position.fromArray(pose.rootPosition);
 for(const j of body.joints)j.group.rotation.set(...(pose.rotations[j.id]||[0,0,0]).map(THREE.MathUtils.degToRad));
 const floor=createFloorConstraints(rig);floor.settle();return {rig,pose,floor};
}
test('all named variants have an explicit minimum support profile',()=>{
 for(const pose of yogaPoses)assert(supportProfile(pose).requirements.length,pose.name);
});
test('Bound Angle preserves seated sole-to-sole contact after save and restore',()=>{
 const {rig,pose,floor}=fixture('Bound Angle'),self=createSelfConstraints(rig);
 assert.deepEqual(supportProfile(pose).requirements,['sit-bones','sole-pair']);
 const saved=capturePose(rig.root,rig.joints);rig.root.position.y+=.1;restorePose(rig.root,rig.joints,saved);floor.settle();
 const inspection=inspectSupports(rig,pose);
 assert(inspection.surfaces.seat.pass,'the pelvis must not float to accommodate the feet');
 assert(inspection.surfaces['left-sit-bone'].pass&&inspection.surfaces['right-sit-bone'].pass,'both ischial landmarks must support the pelvis');
 assert.deepEqual(inspection.issues,[]);
 assert(inspection.actualContactRegions.includes('sole-pair'));
 assert(inspection.surfaces['sole-pair'].separatingPlaneOverrunMm<1);
 assert.deepEqual(inspectJointRanges(rig.joints).issues,[]);
 assert.deepEqual(self.contacts(),[]);assert.deepEqual(self.jointViolations(),[]);
 assert(pose.draft);assert.match(pose.modification,/No hand grip/);
 rig.byId.leftHip.group.rotation.z+=.08;rig.root.updateWorldMatrix(true,true);
 assert(inspectSupports(rig,pose).issues.some(i=>i.name==='sole-pair'),'a separated pair must still fail');
 for(const step of ashtangaShortPractice.steps.filter(p=>p.source?.endsWith('/BoundAngle'))){
  assert.deepEqual(supportProfile(step).requirements,['seat','any-foot-edge'],'explicit open-foot examples stay distinct');
 }
});
test('bilateral sit-bone support rejects a tilted seated pelvis and stays distinct from supine pelvis contact',()=>{
 const seated=fixture('Bound Angle'),supine=fixture('Corpse');
 assert(supportProfile(seated.pose).requirements.includes('sit-bones'));
 assert(!supportProfile(supine.pose).requirements.includes('sit-bones'));
 seated.rig.root.rotation.z=.12;seated.rig.root.updateWorldMatrix(true,true);
 const result=inspectSupports(seated.rig,seated.pose);
 assert(result.issues.some(issue=>issue.name==='sit-bones'));
 assert.notEqual(result.surfaces['left-sit-bone'].gapMm,result.surfaces['right-sit-bone'].gapMm);
});
test('opposite-leg contracts cannot be satisfied by a single supporting limb',()=>{
 const surfaces=Object.fromEntries(['left','right'].flatMap(side=>['sole','heel','toe','knee','foot-top'].map(part=>[side+'-'+part,{name:side+'-'+part,pass:side==='left'}])));
 for(const requirement of ['opposite-sole-heel','opposite-sole-toe','opposite-sole-knee-foot-top']){
  assert.equal(evaluateSupportRequirements(surfaces,[requirement])[0].pass,false,requirement);
 }
 surfaces['right-heel'].pass=true;assert(evaluateSupportRequirements(surfaces,['opposite-sole-heel'])[0].pass);
 surfaces['right-toe'].pass=true;assert(evaluateSupportRequirements(surfaces,['opposite-sole-toe'])[0].pass);
 surfaces['right-knee'].pass=true;assert.equal(evaluateSupportRequirements(surfaces,['opposite-sole-knee-foot-top'])[0].pass,false);
 surfaces['right-foot-top'].pass=true;assert(evaluateSupportRequirements(surfaces,['opposite-sole-knee-foot-top'])[0].pass);
});
test('Crescent Lunge allows the rear heel to lift while kneeling lunge requires the rear foot top',()=>{
 assert.deepEqual(supportProfile({source:'https://www.pocketyoga.com/pose/LungeCrescent',category:'Standing'}).requirements,['opposite-sole-toe']);
 assert.deepEqual(supportProfile({source:'https://www.pocketyoga.com/pose/WarriorIKneeling',category:'Standing'}).requirements,['opposite-sole-knee-foot-top']);
 assert.deepEqual(supportProfile({source:'https://www.pocketyoga.com/pose/TriangleRevolved',category:'Standing'}).requirements,['soles','any-hand']);
});
test('one penetrated palm patch cannot pass just because the highest patch is close to the floor',()=>{
 const {rig,pose}=fixture('Dolphin');rig.hands.left.palm.rotation.x+=.12;
 const surface=inspectSupports(rig,pose).surfaces['left-palm'];
 assert(surface.gapMm<5);assert(surface.minGapMm<-1);assert.equal(surface.pass,false);
});
test('collision-free Caterpillar still fails seated support while its entire palms pass',()=>{
 const {rig,pose,floor}=fixture('Caterpillar'),s=inspectSupports(rig,pose);
 assert(floor.clearance()>0);assert(s.requirements.find(r=>r.name==='palms').pass);
 assert(!s.requirements.find(r=>r.name==='sit-bones').pass);assert(s.surfaces['left-sit-bone'].gapMm>300);
});
test('Dolphin forearm support detects an endpoint-only contact and preserves OR alternatives',()=>{
 const {rig,pose,floor}=fixture('Dolphin');assert.equal(inspectSupports(rig,pose).issues.length,0);
 rig.byId.leftElbow.group.rotation.x+=.3;floor.settle();
 const s=inspectSupports(rig,pose);assert(!s.surfaces['left-forearm'].pass);assert(s.surfaces['left-forearm'].gapMm>20);
 const fresh=fixture('Dolphin'),wrist=fresh.rig.hands.left.wrist;
 wrist.position.add(new THREE.Vector3(0,.2,0).applyQuaternion(wrist.parent.getWorldQuaternion(new THREE.Quaternion()).invert()));
 const side=inspectSupports(fresh.rig,{source:'https://www.pocketyoga.com/pose/PlankSide'});
 assert(side.requirements.find(r=>r.name==='any-palm').pass,'One supporting palm suffices when the other hand is raised');
 assert(!side.surfaces['left-palm'].pass);assert(side.surfaces['right-palm'].pass);
});
test('joint audit excludes global orientation and forearm roll from elbow hinge violations',()=>{
 const {rig}=fixture('Mountain');rig.root.rotation.set(2.7,1.1,2.1);
 rig.byId.leftElbow.group.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0),-.7).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),1.2));
 let r=inspectJointRanges(rig.joints);assert(!r.issues.some(i=>i.joint==='pelvis'||i.joint==='leftElbow'));
 rig.byId.leftKnee.group.rotation.z=.4;r=inspectJointRanges(rig.joints);
 assert(r.issues.some(i=>i.joint==='leftKnee'&&i.motion==='off-hinge direction'));
 assert(r.excluded.some(i=>i.joint==='leftShoulder'));
});
