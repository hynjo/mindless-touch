import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBody} from '../body.js';
import {yogaPoses} from '../poses.js';
import {applyHandOffsets} from '../hand-offsets.js';
import {applyHandPreset} from '../hands.js';
import {createFloorConstraints} from '../floor-constraints.js';
import {capturePose} from '../pole-constraints.js';
import {projectSupportPose} from '../support-solver.js';

function fixture(name='Mountain'){
 const dimensions={pelvisHeight:.97,torso:.48,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43},material=new THREE.MeshStandardMaterial();
 const body=createBody({scene:new THREE.Scene(),dimensions,bodyMaterial:material,jointMaterial:material}),meshes=[];
 body.root.traverse(m=>{if(m.isMesh)meshes.push(m);});
 const rig={...body,dimensions,meshes,byId:Object.fromEntries(body.joints.map(j=>[j.id,j]))};
 const pose=yogaPoses.find(p=>p.name===name);assert(pose,`Missing fixture ${name}`);
 applyHandOffsets(body.root,pose.handOffsets);body.root.position.fromArray(pose.rootPosition);
 for(const j of body.joints)j.group.rotation.set(...(pose.rotations[j.id]||[0,0,0]).map(THREE.MathUtils.degToRad));
 for(const hand of Object.values(body.hands))applyHandPreset(hand,'open');
 createFloorConstraints(rig).settle();return {rig,pose};
}
test('elevated standing pose restores both soles without changing joints or proportions',()=>{
 const {rig,pose}=fixture();rig.root.position.y+=.075;
 const rotations=rig.joints.map(j=>j.group.quaternion.toArray());
 const result=projectSupportPose(rig,pose);
 assert(result.accepted,JSON.stringify(result.after.rom.issues));assert(result.changed);
 assert.equal(result.after.supports.issues.length,0);assert.equal(result.after.contacts.length,0);
 assert.deepEqual(rig.joints.map(j=>j.group.quaternion.toArray()),rotations);
});
test('impossible mixed supports restore root, every joint, and hand offsets',()=>{
 const {rig,pose}=fixture();rig.hands.left.root.position.z+=.009;
 const before=capturePose(rig.root,rig.joints);
 const result=projectSupportPose(rig,{...pose,supportRequirements:['soles','palms','knees']},{maxPasses:2});
 assert.equal(result.accepted,false);assert.equal(result.changed,false);
 assert.deepEqual(capturePose(rig.root,rig.joints),before);
});
test('a floor-supported pose with an invalid wrist is never accepted',()=>{
 const {rig,pose}=fixture();rig.byId.leftWrist.group.rotation.x=2;
 const before=capturePose(rig.root,rig.joints);
 const result=projectSupportPose(rig,pose,{maxPasses:1});
 assert.equal(result.accepted,false);assert.deepEqual(capturePose(rig.root,rig.joints),before);
});
test('unknown support data throws only after restoring the complete pose',()=>{
 const {rig,pose}=fixture(),before=capturePose(rig.root,rig.joints);
 assert.throws(()=>projectSupportPose(rig,{...pose,supportRequirements:['unknown']}));
 assert.deepEqual(capturePose(rig.root,rig.joints),before);
});
test('representative standing and lunge candidates either satisfy every guard or fully roll back',t=>{
 for(const name of ['Chair','Triangle','Warrior I','Warrior II','Tree','Crescent Lunge','Crescent Lunge on the Knee','Lunge']){
  const {rig,pose}=fixture(name);rig.root.position.y+=.02;
  const saved=capturePose(rig.root,rig.joints),result=projectSupportPose(rig,pose);
  t.diagnostic(`${name}: ${result.reason}; support failures ${result.before.supports.issues.length} -> ${result.after.supports.issues.length}; ROM ${result.after.rom.issues.length}`);
  if(result.accepted){assert.equal(result.after.supports.issues.length,0);assert.equal(result.after.rom.issues.length,0);assert.equal(result.after.contacts.length,0);}
  else assert.deepEqual(capturePose(rig.root,rig.joints),saved);
 }
});
test('any-sole projection preserves the intentionally lifted leg rotations',()=>{
 const {rig,pose}=fixture();
 rig.byId.rightHip.group.rotation.x=-.65;rig.byId.rightKnee.group.rotation.x=1.1;
 rig.byId.rightAnkle.group.rotation.x=-.45;
 createFloorConstraints(rig).settle();rig.root.position.y+=.03;
 const rotations=['Hip','Knee','Ankle'].map(j=>rig.byId['right'+j].group.quaternion.toArray());
 const result=projectSupportPose(rig,{...pose,supportRequirements:['any-sole']});
 assert(result.accepted,JSON.stringify(result.after.rom.issues));
 assert.deepEqual(['Hip','Knee','Ankle'].map(j=>rig.byId['right'+j].group.quaternion.toArray()),rotations);
 assert(result.after.supports.surfaces['left-sole'].pass);assert(!result.after.supports.surfaces['right-sole'].pass);
});
test('a tilted supporting ankle requires joint correction rather than just dropping the pelvis',()=>{
 const {rig,pose}=fixture();rig.byId.leftAnkle.group.rotation.x+=.06;
 createFloorConstraints(rig).settle();
 const angle=rig.byId.leftAnkle.group.rotation.x;
 const result=projectSupportPose(rig,pose,{maxPasses:32});
 assert(result.accepted,JSON.stringify(result.attempted?.supports.issues));
 assert(result.before.supports.surfaces['right-sole'].pass,'the opposite sole starts supported');
 assert(result.after.supports.surfaces['right-sole'].pass,'repair must preserve the existing support');
 assert(Math.abs(rig.byId.leftAnkle.group.rotation.x-angle)>.001);
 assert.equal(result.after.supports.issues.length,0);
});
test('alternative contact projection preserves the original passing support sides',()=>{
 const {rig,pose}=fixture();rig.byId.leftAnkle.group.rotation.x+=.06;
 createFloorConstraints(rig).settle();
 const saved=capturePose(rig.root,rig.joints);
 const result=projectSupportPose(rig,{...pose,supportRequirements:['soles','any-heel']},{maxPasses:32});
 const original=result.before.supports.requirements.find(r=>r.name==='any-heel').samples.filter(s=>s.pass);
 assert(original.length>0);
 if(result.accepted)for(const sample of original)assert(result.after.supports.surfaces[sample.name].pass,`${sample.name} changed support side`);
 else assert.deepEqual(capturePose(rig.root,rig.joints),saved);
});
