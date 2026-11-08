import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBody} from '../body.js';
import {yogaPoses} from '../poses.js';
import {planSupportedRoute} from '../supported-route-planner.js';
import {capturePose,restorePose} from '../pole-constraints.js';
import {applyPose} from '../apply-pose.js';
import {createFloorConstraints} from '../floor-constraints.js';
import {createSelfConstraints} from '../self-constraints.js';
import {compileTransitionMotion,replayTransitionMotion,sameMotionFrame,motionFrame} from '../transition-motion.js';
import {serializeSequence,parseSequence} from '../sequence-file.js';
import {ashtangaShortPractice} from '../ashtanga-example.js';
function fixture(){
 const dimensions={pelvisHeight:.97,torso:.48,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43},material=new THREE.MeshStandardMaterial();
 const rig=createBody({scene:new THREE.Scene(),dimensions,bodyMaterial:material,jointMaterial:material});rig.dimensions=dimensions;rig.byId=Object.fromEntries(rig.joints.map(j=>[j.id,j]));rig.meshes=[];rig.root.traverse(m=>{if(m.isMesh)rig.meshes.push(m)});return rig;
}
test('complete route passes both edges and restores the caller pose',()=>{
 const rig=fixture(),before=capturePose(rig.root,rig.joints),cow=yogaPoses.find(p=>p.name==='Cow');
 const result=planSupportedRoute(rig,cow,cow,[cow]);
 assert.equal(result.status,'candidate',JSON.stringify(result.attempts));assert.equal(result.steps.length,1);
 assert.deepEqual(capturePose(rig.root,rig.joints),before);
});
test('Upward-Facing Dog reaches Downward-Facing Dog through the selected Plank without range or support blocks',()=>{
 const rig=fixture(),before=capturePose(rig.root,rig.joints);
 const from=ashtangaShortPractice.steps.find(step=>step.name==='Upward-Facing Dog');
 const to=ashtangaShortPractice.steps.find(step=>step.name==='Downward-Facing Dog');
 const plank=yogaPoses.find(pose=>pose.name==='Plank');
 const result=planSupportedRoute(rig,from,to,[plank]);
 assert.equal(result.status,'candidate',JSON.stringify(result.attempts));
 assert.deepEqual(result.steps.map(step=>step.name),['Plank']);
 assert.equal(result.attempts[0].failure,null);
 assert.deepEqual(capturePose(rig.root,rig.joints),before);
});
test('Big Toe to Cow supplies a complete supported motion, without adding hundreds of cards',()=>{
 const rig=fixture(),before=capturePose(rig.root,rig.joints);
 const result=planSupportedRoute(rig,yogaPoses.find(p=>p.name==='Big Toe'),yogaPoses.find(p=>p.name==='Cow'));
 assert.equal(result.status,'candidate',JSON.stringify(result.partial));assert.deepEqual(result.steps,[]);
 assert.equal(result.motion.phases.length,13);
 assert(result.motion.phases.some(p=>p.supportRequirements.includes('right-sole')));
 assert(result.motion.phases.some(p=>p.supportRequirements.includes('left-forefoot')));
 assert.deepEqual(capturePose(rig.root,rig.joints),before);
 const motion=compileTransitionMotion(result.motion,rig.joints.map(j=>j.id));
 // Support is a surface, not merely a low fingertip. Planted palms also retain
 // their world positions during every leg-moving phase.
 for(const p of motion.phases.filter(p=>/Step .* foot|Lower knees|Lift feet|Untuck feet|Lower feet|Shift body|Place .* knee/.test(p.name))){
  restorePose(rig.root,rig.joints,motionFrame(p,0));
  const palms=['left','right'].map(side=>rig.hands[side].wrist.getWorldPosition(new THREE.Vector3()));
  for(const sample of [60,120,180,240]){
   restorePose(rig.root,rig.joints,motionFrame(p,sample));
   for(const [i,side] of ['left','right'].entries())assert(rig.hands[side].wrist.getWorldPosition(new THREE.Vector3()).distanceTo(palms[i])<.0005,`${p.name}: ${side} palm drift`);
  }
 }
});
test('reverse route survives save/load and large playback jumps while preserving the actual target',()=>{
 const rig=fixture(),cow=yogaPoses.find(p=>p.name==='Cow'),bigToe=yogaPoses.find(p=>p.name==='Big Toe');
 const floor=createFloorConstraints(rig),frames=[];
 const stored=(p,id)=>{
  applyPose(rig,p,{floor});frames.push(capturePose(rig.root,rig.joints));
  return {id,name:p.name,holdSeconds:1.4,transitionSeconds:2.2,supportRequirements:p.name==='Cow'?['palms','knees']:['soles'],floorSupport:p.floorSupport,pose:{rootPosition:rig.root.position.toArray(),rotations:Object.fromEntries(rig.joints.map(j=>[j.id,j.group.rotation.toArray().slice(0,3)])),poleContacts:{}}};
 };
 const steps=[stored(cow,'cow'),stored(bigToe,'big-toe')];
 const result=planSupportedRoute(rig,steps[0],steps[1]);
 assert.equal(result.status,'candidate',JSON.stringify(result.partial));
 steps[0].transitionMotion=result.motion;steps[0].transitionSeconds=result.transitionSeconds;
 const context={studio:'movement',dimensions:rig.dimensions,jointIds:rig.joints.map(j=>j.id)};
 const json=serializeSequence({format:'movement-sequence',version:1,studio:'movement',dimensions:rig.dimensions,name:'Supported transfer',steps},context);
 assert(json.length<2*1024*1024,'A single supported route should fit the original file budget');
 const loaded=parseSequence(json,context),compiled=compileTransitionMotion(loaded.steps[0].transitionMotion,context.jointIds);
 assert(sameMotionFrame(compiled.start,frames[0]));assert(sameMotionFrame(compiled.end,frames[1]));
 const self=createSelfConstraints(rig);restorePose(rig.root,rig.joints,compiled.start);self.sync();
 // Deliberately skip whole phases in a frame; replay must visit the skipped path.
 let previous=0;
 for(const time of [.001,.18,.59,.92,1]){assert.equal(replayTransitionMotion(rig,self,compiled,previous,time),null);previous=time;}
 assert(sameMotionFrame(capturePose(rig.root,rig.joints),frames[1]));
 const edited=capturePose(rig.root,rig.joints);edited.position.y+=.01;
 assert(!sameMotionFrame(compiled.end,edited),'Editing either endpoint invalidates the cached route');
 assert.equal(loaded.steps[0].transitionSeconds,result.transitionSeconds);
 // Loaded numeric data is not treated as an assertion of safety.
 const unsafe=structuredClone(result.motion);unsafe.start.position[1]+=.1;
 assert.throws(()=>compileTransitionMotion(unsafe,context.jointIds),/disconnected/);
});
test('a failed or edited endpoint cannot produce a partial applicable motion',()=>{
 const rig=fixture(),before=capturePose(rig.root,rig.joints),cow=yogaPoses.find(p=>p.name==='Cow'),bigToe=yogaPoses.find(p=>p.name==='Big Toe');
 const floor=createFloorConstraints(rig);applyPose(rig,bigToe,{floor});
 const floating={name:'Big Toe',supportRequirements:['soles'],pose:{rootPosition:rig.root.position.clone().add(new THREE.Vector3(0,.1,0)).toArray(),rotations:Object.fromEntries(rig.joints.map(j=>[j.id,j.group.rotation.toArray().slice(0,3)]))}};
 restorePose(rig.root,rig.joints,before);const result=planSupportedRoute(rig,floating,cow);
 assert.equal(result.status,'no-route');assert.equal(result.motion,undefined);assert.equal(result.steps,undefined);
 assert.deepEqual(capturePose(rig.root,rig.joints),before);
});
test('unsupported scheduled paths fail without silently replacing intent',()=>{
 const rig=fixture(),cow=yogaPoses.find(p=>p.name==='Cow');
 const result=planSupportedRoute(rig,{...cow,contactSchedule:{version:1,anchors:[]}},cow,[cow]);
 assert.equal(result.status,'no-route');assert.equal(result.attempts[0].failure.reason,'authored-schedule');
});
