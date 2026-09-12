import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createFoot,setToeBend,applyFootShape} from '../feet.js';
import {validateSequence} from '../sequence-file.js';
test('each foot has five independently articulated toes with a mirrored big toe',()=>{
 const material=new THREE.MeshStandardMaterial();
 const feet=['left','right'].map(side=>createFoot(new THREE.Group(),side,material));
 for(const foot of feet){
  assert.equal(foot.joints.length,14);assert.equal(foot.joints.filter(j=>j.segment===0).length,5);
  setToeBend(foot.joints[0],-.3);assert.equal(foot.joints[0].group.rotation.x,-.3);
  assert(foot.joints.slice(1).every(j=>j.group.rotation.x===0));
 }
 assert.equal(feet[0].joints[0].group.parent.position.x,-feet[1].joints[0].group.parent.position.x);
});
test('old sequence files gain neutral toes, and toe bends survive serialization',()=>{
 const context={studio:'movement',dimensions:{pelvisHeight:.97},jointIds:['pelvis','leftToeBig1','leftFootArch']};
 const doc={format:'movement-sequence',version:1,studio:'movement',dimensions:context.dimensions,name:'Old flow',steps:[{id:'one',name:'Pose',holdSeconds:1,transitionSeconds:1,pose:{rootPosition:[0,.97,0],rotations:{pelvis:[0,0,0]}}}]};
 const restored=validateSequence(doc,context);assert.deepEqual(restored.steps[0].pose.rotations.leftFootArch,[0,0,0]);assert.deepEqual(restored.steps[0].pose.rotations.leftToeBig1,[0,0,0]);
 restored.steps[0].pose.rotations.leftToeBig1=[-.3,0,0];
 assert.deepEqual(validateSequence(JSON.parse(JSON.stringify(restored)),context),restored);
});

test('point and flex articulate the arch and carry the toes without curling them',()=>{
 const ankle=new THREE.Group(),foot=createFoot(ankle,'left',new THREE.MeshStandardMaterial());
 const position=()=>foot.joints[0].group.getWorldPosition(new THREE.Vector3());
 applyFootShape(foot,'neutral');const neutral=position();
 applyFootShape(foot,'point');assert(foot.archJoint.group.rotation.x>0);assert(position().y<neutral.y);
 assert(foot.joints.every(j=>j.group.rotation.x===0));
 applyFootShape(foot,'flex');assert(foot.archJoint.group.rotation.x<0);assert(position().y>neutral.y);
 applyFootShape(foot,'neutral');assert(position().distanceTo(neutral)<1e-9);
});
