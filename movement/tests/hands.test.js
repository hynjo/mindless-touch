import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createHand,applyHandPreset,setFingerBend,applyFingerSpread,setFingerSpread} from '../hands.js';
test('both hands have five fingers and independently articulated joints',() => {
  for(const side of ['left','right']) {
    const hand=createHand(new THREE.Group(),side,new THREE.MeshStandardMaterial());
    assert.equal(new Set(hand.joints.map(j=>j.finger)).size,5);
    assert.equal(hand.joints.length,14);
    const finger=hand.joints.find(j=>j.finger==='Index');
    setFingerBend(finger,.7);
    assert.equal(finger.group.rotation.x,.7);
    assert(hand.joints.filter(j=>j!==finger).every(j=>j.group.rotation.x===0));
    setFingerBend(finger,-1);assert.equal(finger.group.rotation.x,0);
    setFingerBend(finger,100);assert.equal(finger.group.rotation.x,Math.PI/2);
  }
});
test('hand presets bend the fingers without moving the wrist or changing bone lengths',() => {
  const wrist=new THREE.Group();wrist.position.set(.3,1,.4);wrist.rotation.set(.3,.6,.2);
  const hand=createHand(wrist,'left',new THREE.MeshStandardMaterial());
  const boneOffsets=hand.joints.map(j=>j.group.position.length());
  for(const name of ['wrap','relaxed','open']) {
    applyHandPreset(hand,name);
    hand.joints.forEach((joint,i)=>{assert.equal(joint.group.position.length(),boneOffsets[i]);assert(Number.isFinite(joint.group.rotation.x));});
    assert.deepEqual(wrist.position.toArray(),[.3,1,.4]);
  }
  assert(hand.joints.every(j=>j.group.rotation.x===0));
});

test('finger spread uses mirrored base axes and preserves curl and downstream joints',()=>{
 const hands=['left','right'].map(side=>createHand(new THREE.Group(),side,new THREE.MeshStandardMaterial()));
 for(const hand of hands){
  applyHandPreset(hand,'relaxed');const bends=hand.joints.map(j=>j.group.rotation.x);
  applyFingerSpread(hand,1);
  hand.joints.forEach((j,i)=>{assert.equal(j.group.rotation.x,bends[i]);if(j.segment>0)assert.equal(j.group.rotation.z,0);});
  const index=hand.joints.find(j=>j.finger==='Index'&&j.segment===0);
  setFingerSpread(index,100);assert.equal(Math.abs(index.group.rotation.z),THREE.MathUtils.degToRad(25));
 }
 hands[0].joints.forEach((j,i)=>assert(Math.abs(j.group.rotation.z+hands[1].joints[i].group.rotation.z)<1e-10));
 for(const hand of hands){applyFingerSpread(hand,0);assert(hand.joints.every(j=>j.group.rotation.z===0));}
});

test('fists tuck four fingers and oppose the thumb; Open clears all fist rotations',()=>{
 for(const side of ['left','right']){
  const wrist=new THREE.Group(),hand=createHand(wrist,side,new THREE.MeshStandardMaterial());
  applyHandPreset(hand,'fist');wrist.updateWorldMatrix(true,true);
  const thumb=hand.joints.find(j=>j.finger==='Thumb'&&j.segment===1);
  const tip=thumb.group.localToWorld(new THREE.Vector3(0,-.025,0));
  assert(tip.z<-.035,'Thumb lies outside the palm on the curled-finger side');
  assert(Math.abs(tip.x)<.02,'Thumb moves inward toward the fingers');
  for(const finger of ['Index','Middle','Ring','Little'])assert(hand.joints.find(j=>j.finger===finger&&j.segment===1).group.rotation.x>Math.PI/2);
  applyHandPreset(hand,'open');assert(hand.joints.every(j=>j.group.rotation.x===0&&j.group.rotation.y===0&&j.group.rotation.z===0));
 }
});
