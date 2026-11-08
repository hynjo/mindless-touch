import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBody} from '../body.js';
import {createExternalHandCollisionPairs} from '../external-hand-collisions.js';
import {createSelfConstraints} from '../self-constraints.js';

function fixture(){
 const material=new THREE.MeshStandardMaterial();
 const body=createBody({scene:new THREE.Scene(),bodyMaterial:material,jointMaterial:material,dimensions:{pelvisHeight:.97,torso:.48,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43}});
 // Move real articulated hands independently to isolate known proxy contacts.
 for(const side of ['left','right']){
  const wrist=body.hands[side].wrist;
  body.root.add(wrist);wrist.position.set(0,0,0);wrist.rotation.set(0,0,0);
 }
 const collision=createExternalHandCollisionPairs(body);
 function distance(a,b){
  body.root.updateWorldMatrix(true,true);
  const index=collision.pairs.findIndex(p=>(p.a===a&&p.b===b)||(p.a===b&&p.b===a));
  assert(index>=0,`missing pair ${a}/${b}`);
  return collision.distances()[index];
 }
 return {...body,collision,distance};
}
const close=(actual,expected,tolerance=1e-8)=>assert(Math.abs(actual-expected)<tolerance,`${actual} != ${expected}`);

test('real opposite index fingers distinguish separation, contact and submillimeter penetration',()=>{
 const {hands,distance}=fixture();
 // Mirrored index mounts are 52 mm apart along x; align them first.
 hands.right.wrist.position.x=-.052;
 for(const [z,expected] of [[.024,.01],[.014,0],[.01318,-.00082]]){
  hands.right.wrist.position.z=z;
  close(distance('leftIndex1','rightIndex1'),expected);
 }
 // The diagnostic values must retain 0.82 mm, below the legacy 1 mm cutoff.
 close(-distance('leftIndex1','rightIndex1')*1000,.82);
});

test('opposite palm proxies distinguish separation, touching and overlap',()=>{
 const {hands,distance}=fixture();
 for(const [z,expected] of [[.04,.01],[.03,0],[.02,-.01]]){
  hands.right.wrist.position.z=z;
  close(distance('leftPalm','rightPalm'),expected);
 }
});

test('externalContacts retains 0.82 mm and proxy metadata without modifying the pose or solver state',()=>{
 const body=fixture();
 body.hands.right.wrist.position.set(-.052,0,.01318);
 const self=createSelfConstraints(body);
 const pose=()=>{
  const values=[];
  body.root.traverse(object=>values.push({id:object.uuid,position:object.position.toArray(),quaternion:object.quaternion.toArray(),scale:object.scale.toArray()}));
  return values;
 };
 const before=pose(),state=structuredClone(self.snapshot());
 const isIndexPair=p=>p.a==='leftIndex1'&&p.b==='rightIndex1';
 const contact=self.externalContacts().find(isIndexPair);
 assert(contact,'default diagnostics must retain the submillimeter contact');
 close(contact.depth,.00082);
 const {depth,...metadata}=contact;
 assert.deepEqual(metadata,body.collision.pairs.find(isIndexPair));
 assert.equal(metadata.kind,'opposite-fingers');
 assert.equal(metadata.geometry,'capsule-capsule');
 assert.equal(metadata.approximate,false);
 const palm=self.externalContacts().find(p=>p.kind==='palm-palm');
 assert(palm);
 assert.equal(palm.approximate,true);
 assert.equal(palm.geometry,'enclosing-palm-box-SAT');
 assert.equal(self.externalContacts(.001).some(isIndexPair),false);
 assert.deepEqual(pose(),before);
 assert.deepEqual(structuredClone(self.snapshot()),state);
 assert.equal(self.failure(),null);
});

test('finger against opposite palm is diagnosed independently of palm-palm contact',()=>{
 const {hands,distance}=fixture();
 hands.right.wrist.position.y=-.06;
 for(const [z,expected] of [[.024,.01],[.014,0],[.009,-.005]]){
  hands.right.wrist.position.z=z;
  close(distance('leftIndex1','rightPalm'),expected);
 }
});

test('real torso core detects palm and finger approach along its principal axis',()=>{
 const {hands,torso,distance}=fixture();
 const core=torso.children.find(m=>m.isMesh&&m.geometry.type==='SphereGeometry'&&!m.userData.joint);
 // Express torso center in root space, the common parent of the test wrists.
 const center=core.position.clone().add(torso.position).add(torso.parent.position);
 hands.left.wrist.position.copy(center).add(new THREE.Vector3(0,.045,.135));
 close(distance('leftPalm','torso'),0);
 hands.left.wrist.position.z+=.01;assert(distance('leftPalm','torso')>0);
 hands.left.wrist.position.z-=.02;assert(distance('leftPalm','torso')<0);
 // Align the index proximal knuckle with the torso center on x/y.
 hands.left.wrist.position.copy(center).add(new THREE.Vector3(.026,.081,.135));
 close(distance('leftIndex1','torso'),0);
 hands.left.wrist.position.z+=.01;assert(distance('leftIndex1','torso')>0);
 hands.left.wrist.position.z-=.02;assert(distance('leftIndex1','torso')<0);
});

test('external diagnostics are finite, categorized, and invariant under a common rigid transform',()=>{
 const {root,hands,collision}=fixture();
 hands.right.wrist.position.set(-.052,0,.01318);
 root.updateWorldMatrix(true,true);
 const before=collision.distances();
 assert.equal(before.length,collision.pairs.length);
 assert(before.every(Number.isFinite));
 assert.deepEqual(new Set(collision.pairs.map(p=>p.kind)),new Set(['opposite-fingers','finger-opposite-palm','palm-palm','finger-core','palm-core']));
 const keys=collision.pairs.map(p=>[p.a,p.b].sort().join('/'));
 assert.equal(new Set(keys).size,keys.length);
 root.rotation.set(.8,1.1,-.4);root.position.set(2,3,-1);
 root.updateWorldMatrix(true,true);
 collision.distances().forEach((value,index)=>close(value,before[index]));
});
