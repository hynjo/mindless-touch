import * as THREE from 'three';
import {readFile,writeFile} from 'node:fs/promises';
import {createBody} from '../body.js';
import {inspectGripRetention} from '../hand-grip-retention.js';
const candidates=JSON.parse(await readFile(new URL('../hand-grip-solver-results.json',import.meta.url),'utf8'));
const material=new THREE.MeshStandardMaterial();
const rig=createBody({scene:new THREE.Scene(),bodyMaterial:material,jointMaterial:material,dimensions:{pelvisHeight:.97,torso:.48,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43}});
const results=candidates.map(c=>{
 rig.root.position.copy(c.pose.position);
 rig.joints.forEach((j,i)=>j.group.quaternion.fromArray(c.pose.rotations[i]));
 for(const side of ['left','right'])rig.hands[side].root.position.copy(c.pose.handOffsets[side]);
 return {seed:c.seed,...inspectGripRetention(rig)};
});
await writeFile(new URL('../grip-retention-audit.json',import.meta.url),JSON.stringify(results,null,2)+'\n');
console.log(results.map(r=>({seed:r.seed,pass:r.pass,reason:r.reason,contacts:r.contact.hookedGripCandidate.contacts.length})));
