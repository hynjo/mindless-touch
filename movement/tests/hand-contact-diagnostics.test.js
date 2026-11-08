import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {createBody} from '../body.js';
import {inspectHandContact} from '../hand-contact-diagnostics.js';
import {applyHandPreset} from '../hands.js';
const saved=JSON.parse(readFileSync(new URL('../cow-face-diagnostics.json',import.meta.url),'utf8'));
function witness(seed){
 const material=new THREE.MeshStandardMaterial();
 const rig=createBody({scene:new THREE.Scene(),bodyMaterial:material,jointMaterial:material,dimensions:{pelvisHeight:.97,torso:.48,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43}});
 const pose=saved.scenarios.find(s=>s.family==='arms'&&s.mode==='all'&&s.seed===seed).bestGuarded;
 rig.root.position.fromArray(pose.rootPosition);
 for(const j of rig.joints)j.group.rotation.set(...(pose.rotations[j.id]||[0,0,0]).map(THREE.MathUtils.degToRad));
 return rig;
}
const targets={left:[0,.46,-.2],right:[0,.459,-.2]};
test('reaching saved targets never certifies straight fingers as a grip',()=>{
 for(const seed of [17,73]){
  const rig=witness(seed),before=rig.joints.map(j=>j.group.quaternion.toArray());
  const r=inspectHandContact(rig,{targets});
  assert.equal(r.fingertipReach.pass,true);
  assert.equal(r.opposedContact.pass,false);assert.equal(r.hookedGripCandidate.pass,false);
  assert.equal(r.hookedGripCandidate.certified,false);
  assert.deepEqual(r.hookedGripCandidate.curled,{left:[],right:[]});
  assert.deepEqual(rig.joints.map(j=>j.group.quaternion.toArray()),before);
 }
});
test('saved witnesses expose exact submillimetre finger overlap and conservative core overlap separately',()=>{
 const first=inspectHandContact(witness(17),{targets});
 const pair=first.overlaps.find(p=>p.a==='leftMiddle3'&&p.b==='rightMiddle3');
 assert(pair&&!pair.approximate);assert(Math.abs(pair.gap+.0008235697)<1e-9);
 const second=inspectHandContact(witness(73),{targets});
 assert(second.overlaps.some(p=>p.a==='leftThumb2'&&p.b==='torso'&&p.approximate));
 assert(second.opposedContact.contacts.some(p=>p.a==='leftMiddle3'&&p.b==='rightMiddle3'&&p.gap>0));
});
test('curl alone and missing targets cannot pass grip or reach',()=>{
 const rig=witness(73);
 for(const side of ['left','right'])applyHandPreset(rig.hands[side],'wrap');
 const r=inspectHandContact(rig);
 assert.equal(r.fingertipReach.pass,false);assert.equal(r.fingertipReach.residuals,null);
 assert.equal(r.hookedGripCandidate.pass,false);
 assert(r.hookedGripCandidate.curled.left.length>=2);
});
test('hand task classification is invariant under a common rigid transform',()=>{
 const rig=witness(73),before=inspectHandContact(rig,{targets});
 const scene=rig.root.parent,q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),.7),offset=new THREE.Vector3(1,2,-3);
 scene.quaternion.copy(q);scene.position.copy(offset);
 const transformed=Object.fromEntries(Object.entries(targets).map(([side,p])=>[side,new THREE.Vector3(...p).applyQuaternion(q).add(offset).toArray()]));
 const after=inspectHandContact(rig,{targets:transformed});
 assert.equal(after.fingertipReach.pass,before.fingertipReach.pass);
 assert.equal(after.opposedContact.pass,before.opposedContact.pass);
 assert.equal(after.hookedGripCandidate.pass,before.hookedGripCandidate.pass);
 assert(Math.abs(after.opposedContact.normalDot-before.opposedContact.normalDot)<1e-10);
 assert.equal(after.overlaps.length,before.overlaps.length);
 after.overlaps.forEach((p,i)=>assert(Math.abs(p.gap-before.overlaps[i].gap)<1e-10));
});
test('opposed open palms can establish contact without being labeled hooked',()=>{
 const rig=witness(73);
 for(const side of ['left','right']){
  const wrist=rig.hands[side].wrist;
  rig.root.add(wrist);wrist.position.set(0,2,side==='left'?0:-.03);
  wrist.rotation.set(0,side==='left'?0:Math.PI,0);
 }
 const r=inspectHandContact(rig);
 assert.equal(r.externalClear,true,JSON.stringify(r.overlaps));
 assert.equal(r.opposedContact.pass,true);
 assert.equal(r.hookedGripCandidate.pass,false);
 rig.hands.right.wrist.position.z=-.1;
 assert.equal(inspectHandContact(rig).opposedContact.pass,false);
});
