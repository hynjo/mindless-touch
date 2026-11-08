import * as THREE from 'three';
import {readFile,writeFile} from 'node:fs/promises';
import {createBody} from '../body.js';
import {applyHandOffsets} from '../hand-offsets.js';
import {createSelfConstraints} from '../self-constraints.js';
import {floorClearance} from '../floor-constraints.js';
import {inspectPose} from '../pose-validation.js';
import {inspectHandContact} from '../hand-contact-diagnostics.js';
const data=JSON.parse(await readFile(new URL('../cow-face-diagnostics.json',import.meta.url),'utf8'));
const dimensions={pelvisHeight:.97,torso:.48,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43};
const material=new THREE.MeshStandardMaterial(),body=createBody({scene:new THREE.Scene(),dimensions,bodyMaterial:material,jointMaterial:material}),meshes=[];
body.root.traverse(m=>{if(m.isMesh)meshes.push(m)});
const rig={...body,dimensions,meshes,byId:Object.fromEntries(body.joints.map(j=>[j.id,j]))};

const {solveHandGrip}=await import('../hand-grip-solver.js');
const results=[];
for(const seed of [17,73]){
 const p=data.scenarios.find(s=>s.family==='arms'&&s.mode==='all'&&s.seed===seed).bestGuarded;
 applyHandOffsets(body.root,{});body.root.position.fromArray(p.rootPosition);
 for(const j of body.joints)j.group.rotation.set(...(p.rotations[j.id]||[0,0,0]).map(THREE.MathUtils.degToRad));
 const result=solveHandGrip(rig,{seed,iterations:20000,apply:false});
 results.push({seed,...result});console.log(seed,result.success,result.cost);
}
await writeFile(new URL('../hand-grip-retention-results.json',import.meta.url),JSON.stringify(results,null,2)+'\n');
