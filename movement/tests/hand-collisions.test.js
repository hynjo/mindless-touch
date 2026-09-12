import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createHand,applyHandPreset} from '../hands.js';
import {createSelfConstraints} from '../self-constraints.js';
function fixture(side='left'){
 const root=new THREE.Group(),wrist=new THREE.Group();root.add(wrist);
 const hand=createHand(wrist,side,new THREE.MeshStandardMaterial());
 const joints=[{id:side+'Wrist',group:wrist},...hand.joints],physics=createSelfConstraints({root,joints});
 return {root,hand,physics,joints};
}
test('open and wrapping hands clear internal volumes while an authored fist reveals thumb overlap',()=>{
 for(const side of ['left','right']){
  const {hand,physics}=fixture(side);
  assert.deepEqual(physics.contacts(),[]);
  applyHandPreset(hand,'wrap');assert(physics.commit());assert.deepEqual(physics.contacts(),[]);
  applyHandPreset(hand,'fist');assert(physics.contacts().some(c=>c.a.includes('Thumb')));
  assert.equal(physics.commit(),false);assert.deepEqual(physics.contacts(),[]);
 }
});
test('a direct finger sweep stops at the neighbouring finger and can reverse out',()=>{
 const {hand,physics}=fixture();const index=hand.joints.find(j=>j.finger==='Index'&&j.segment===0);
 index.group.rotation.z=.8;assert.equal(physics.commit(),false);
 assert(index.group.rotation.z>0&&index.group.rotation.z<.8);
 assert.deepEqual(physics.contacts(),[]);
 index.group.rotation.z=0;assert(physics.commit());
});
test('thumb/palm collision blocks inward rotation and is independent of whole-hand orientation',()=>{
 const {hand,physics,root}=fixture();
 const thumb=hand.joints.find(j=>j.finger==='Thumb'&&j.segment===0);
 thumb.group.rotation.set(Math.PI/4,-.2,1);
 assert.equal(physics.commit(),false);assert.deepEqual(physics.contacts(),[]);
 root.rotation.set(.8,1.1,-.4);root.position.set(2,3,-1);
 assert.deepEqual(physics.contacts(),[]);
});
test('old intersecting poses stay diagnosable instead of being silently certified clear',()=>{
 const {hand,physics}=fixture();applyHandPreset(hand,'fist');physics.sync();
 assert(physics.contacts().length>0);
 applyHandPreset(hand,'open');physics.commit();
 assert(physics.contacts().reduce((s,c)=>s+c.depth,0)<.011);
});
