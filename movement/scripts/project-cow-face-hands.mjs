import * as THREE from 'three';
import {readFile,writeFile} from 'node:fs/promises';
import {createBody} from '../body.js';
import {projectHandContact} from '../hand-contact-projection.js';
const material=new THREE.MeshStandardMaterial(),dimensions={pelvisHeight:.97,torso:.48,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43};
const rig=createBody({scene:new THREE.Scene(),dimensions,bodyMaterial:material,jointMaterial:material});
rig.dimensions=dimensions;rig.byId=Object.fromEntries(rig.joints.map(j=>[j.id,j]));rig.meshes=[];rig.root.traverse(m=>{if(m.isMesh)rig.meshes.push(m)});
const saved=JSON.parse(await readFile(new URL('../hand-grip-solver-results.json',import.meta.url),'utf8')),results=[];
for(const s of saved){
 rig.root.position.copy(s.pose.position);rig.joints.forEach((j,i)=>j.group.quaternion.fromArray(s.pose.rotations[i]));
 for(const side of ['left','right'])rig.hands[side].root.position.copy(s.pose.handOffsets[side]);
 const r=projectHandContact(rig);results.push({seed:s.seed,...r});console.log(s.seed,r.success,r.before,r.after,r.retention?.probes);
}
await writeFile(new URL('../hand-contact-projection-results.json',import.meta.url),JSON.stringify(results,null,2)+'\n');
