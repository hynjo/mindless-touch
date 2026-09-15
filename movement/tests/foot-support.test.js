import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBody} from '../body.js';
import {yogaPoses} from '../poses.js';
import corrections from '../foot-support-corrections.json' with {type:'json'};
import {applyHandOffsets} from '../hand-offsets.js';
import {applyHandPreset} from '../hands.js';
import {createFloorConstraints} from '../floor-constraints.js';
import {createSelfConstraints} from '../self-constraints.js';
import {placePalmsOnFloor,palmsAreSupported} from '../palm-support.js';
import {inspectSupports} from '../pose-validation.js';
import {sunSalutation} from '../examples.js';
import {ashtangaShortPractice} from '../ashtanga-example.js';
import {neckStretching} from '../neck-example.js';
test('repaired catalog soles and all example support anchors survive the actual placement pipeline',()=>{
 const dimensions={pelvisHeight:.97,torso:.48,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43},material=new THREE.MeshStandardMaterial();
 const body=createBody({scene:new THREE.Scene(),dimensions,bodyMaterial:material,jointMaterial:material}),meshes=[];
 body.root.traverse(m=>{if(m.isMesh)meshes.push(m);});
 const rig={...body,dimensions,meshes,byId:Object.fromEntries(body.joints.map(j=>[j.id,j]))},floor=createFloorConstraints(rig),self=createSelfConstraints(rig);
 const repaired=yogaPoses.filter(p=>corrections[p.source.split('/').at(-1)]);
 const examples=[sunSalutation,ashtangaShortPractice,neckStretching].flatMap(example=>example.steps.map(step=>({...step,supportRequirements:step.supportRequirements||['soles'],example:true})));
 for(const pose of [...repaired,...examples]){
  applyHandOffsets(body.root,pose.handOffsets);body.root.position.fromArray(pose.rootPosition);
  for(const j of body.joints)j.group.rotation.set(...(pose.rotations[j.id]||[0,0,0]).map(THREE.MathUtils.degToRad));
  for(const hand of Object.values(body.hands))applyHandPreset(hand,'open');
  if(palmsAreSupported(pose))placePalmsOnFloor(rig);floor.settle();
  const inspection=inspectSupports(rig,pose);
  if(pose.example)assert.deepEqual(inspection.issues,[],`${pose.name}: required support detached`);
  else if(inspection.profile.requirements.includes('soles'))assert(inspection.requirements.find(r=>r.name==='soles').pass,`${pose.name}: required soles detached`);
  else assert(['left','right'].some(side=>inspection.surfaces[side+'-sole'].pass),`${pose.name}: previously repaired supporting sole detached`);
  assert.deepEqual(self.contacts(),[],`${pose.name}: new body collision`);
  assert(floor.clearance()>=.00069,`${pose.name}: floor penetration`);
 }
});
