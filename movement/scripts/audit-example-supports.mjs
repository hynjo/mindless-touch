import {writeFile} from 'node:fs/promises';
import * as THREE from 'three';
import {createBody} from '../body.js';
import {sunSalutation} from '../examples.js';
import {ashtangaShortPractice} from '../ashtanga-example.js';
import {neckStretching} from '../neck-example.js';
import {applyHandOffsets} from '../hand-offsets.js';
import {applyHandPreset} from '../hands.js';
import {createFloorConstraints} from '../floor-constraints.js';
import {placePalmsOnFloor,palmsAreSupported,placeHandsAndKnees} from '../palm-support.js';
import {inspectSupports} from '../pose-validation.js';
const dimensions={pelvisHeight:.97,torso:.48,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43},material=new THREE.MeshStandardMaterial();
const body=createBody({scene:new THREE.Scene(),dimensions,bodyMaterial:material,jointMaterial:material}),meshes=[];
body.root.traverse(m=>{if(m.isMesh)meshes.push(m);});
const rig={...body,dimensions,meshes,byId:Object.fromEntries(body.joints.map(j=>[j.id,j]))},floor=createFloorConstraints(rig),results=[];
for(const example of [sunSalutation,ashtangaShortPractice,neckStretching])for(const step of example.steps){
 applyHandOffsets(body.root,step.handOffsets);body.root.position.fromArray(step.rootPosition);
 for(const j of body.joints)j.group.rotation.set(...(step.rotations[j.id]||[0,0,0]).map(THREE.MathUtils.degToRad));
 for(const h of Object.values(body.hands))applyHandPreset(h,'open');
 if(step.floorSupport==='palms-knees')placeHandsAndKnees(rig);else if(palmsAreSupported(step))placePalmsOnFloor(rig);floor.settle();
 const supports=inspectSupports(rig,step.supportRequirements?step:{supportRequirements:['soles']});
 results.push({example:example.name,id:step.id,name:step.name,issues:supports.issues,soles:['left','right'].map(side=>supports.surfaces[side+'-sole'])});
}
await writeFile(new URL('../example-support-audit.json',import.meta.url),JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify({total:results.length,issues:results.filter(r=>r.issues.length).map(r=>({example:r.example,name:r.name,missing:r.issues.map(i=>i.name)})),folds:results.filter(r=>r.name==='Forward Fold').map(r=>({id:r.id,soles:r.soles}))},null,2));
