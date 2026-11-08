// Reproducible catalog audit; does not modify poses or runtime acceptance.
import * as THREE from 'three';
import {writeFile} from 'node:fs/promises';
import {createBody} from '../body.js';
import {yogaPoses} from '../poses.js';
import {applyPose} from '../apply-pose.js';
import {createFloorConstraints} from '../floor-constraints.js';
import {createSelfConstraints} from '../self-constraints.js';

const dimensions={pelvisHeight:.97,torso:.48,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43};
const material=new THREE.MeshStandardMaterial();
const body=createBody({scene:new THREE.Scene(),dimensions,bodyMaterial:material,jointMaterial:material});
const meshes=[];body.root.traverse(m=>{if(m.isMesh)meshes.push(m);});
const rig={...body,dimensions,meshes,byId:Object.fromEntries(body.joints.map(j=>[j.id,j]))};
const floor=createFloorConstraints(rig),self=createSelfConstraints(rig);
const results=yogaPoses.map(pose=>{
 applyPose(rig,pose,{floor});
 const findings=self.externalContacts().map(({depth,...pair})=>({...pair,depthMm:depth*1000}));
 return {name:pose.name,source:pose.source,legacyContacts:self.contacts(),findings};
});
const count=test=>results.filter(r=>r.findings.some(test)).length;
const summary={poses:results.length,withFindings:count(()=>true),withFingerCapsuleOverlap:count(p=>!p.approximate),withConservativeFindings:count(p=>p.approximate),withSubmillimeterFindings:count(p=>p.depthMm<1)};
const note='Static catalog poses after shared applyPose. Negative margins are proxy overlaps; conservative palm/core findings require narrow-phase or visual confirmation. No transition, limb/hand, nose, grip or anatomical certification. Runtime acceptance is unchanged. Raw submillimetre depths retained.';
await writeFile(new URL('../external-hand-audit.json',import.meta.url),JSON.stringify({summary,note,results},null,2)+'\n');
const rows=results.map(r=>{
 const exact=r.findings.filter(p=>!p.approximate),proxy=r.findings.filter(p=>p.approximate);
 const max=list=>list.length?Math.max(...list.map(p=>p.depthMm)).toFixed(3):'—';
 return `| ${r.name} | ${r.legacyContacts.length} | ${exact.length} | ${max(exact)} | ${proxy.length} | ${max(proxy)} |`;
});
await writeFile(new URL('../EXTERNAL-HAND-AUDIT.md',import.meta.url),`# External hand collision audit\n\n${note}\n\nReproduce: \`node movement/scripts/audit-external-hands.mjs\`. Full pair measurements: [external-hand-audit.json](external-hand-audit.json).\n\n${JSON.stringify(summary)}\n\n| Pose | Legacy contacts ≥1 mm | Finger pairs | Max finger depth mm | Conservative pairs | Max proxy depth mm |\n|---|---:|---:|---:|---:|---:|\n${rows.join('\n')}\n`);
console.log(summary);
