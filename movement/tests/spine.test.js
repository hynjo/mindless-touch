import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBody} from '../body.js';
import {validateSequence} from '../sequence-file.js';
test('waist bends upper body independently of hips, and chest bends independently of waist',()=>{
 const dimensions={pelvisHeight:.97,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43};
 const material=new THREE.MeshStandardMaterial();
 const body=createBody({scene:new THREE.Scene(),dimensions,bodyMaterial:material,jointMaterial:material});
 const hip=body.joints.find(j=>j.id==='leftHip').group;
 const before=hip.getWorldPosition(new THREE.Vector3());
 body.waist.rotation.x=.3;body.torso.rotation.x=-.4;
 assert.deepEqual(hip.getWorldPosition(new THREE.Vector3()).toArray(),before.toArray());
 assert.equal(body.waist.rotation.x,.3);assert.equal(body.torso.rotation.x,-.4);
 const rotations=Object.fromEntries(body.joints.filter(j=>j.id!=='waist').map(j=>[j.id,[0,0,0]]));
 const doc={format:'movement-sequence',version:1,studio:'movement',dimensions,name:'Old file',steps:[{id:'one',name:'Pose',holdSeconds:1,transitionSeconds:1,pose:{rootPosition:[0,.97,0],rotations}}]};
 const restored=validateSequence(doc,{studio:'movement',dimensions,jointIds:body.joints.map(j=>j.id)});
 assert.deepEqual(restored.steps[0].pose.rotations.waist,[0,0,0]);
});
