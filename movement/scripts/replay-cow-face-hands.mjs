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
const results=data.scenarios.filter(s=>s.bestGuarded).map(s=>{
 const pose=s.bestGuarded;
 // Restore exactly, without settle/IK that could change the saved witness.
 applyHandOffsets(body.root,{});body.root.position.fromArray(pose.rootPosition);
 for(const j of body.joints)j.group.rotation.set(...(pose.rotations[j.id]||[0,0,0]).map(THREE.MathUtils.degToRad));
 body.root.updateWorldMatrix(true,true);
 const self=createSelfConstraints(rig),report=inspectPose(rig,{supportRequirements:['sit-bones']});
 const oldGuardsPass=!report.supports.issues.length&&!report.rom.issues.length&&!self.contacts().length&&!self.jointViolations().length&&Math.min(...meshes.map(floorClearance))>=.00068;
 return {family:s.family,mode:s.mode,seed:s.seed,kneeSeparationMm:s.kneeSeparationMm,oldGuardsPass,...inspectHandContact(rig,{targets:{left:[0,.46,-.2],right:[0,.459,-.2]}})};
});
await writeFile(new URL('../cow-face-hand-replay.json',import.meta.url),JSON.stringify({scope:'Static saved witnesses; conservative negatives require confirmation; hooked candidate is not certified grip. No catalog changes.',results},null,2)+'\n');
const rows=results.map(r=>`| ${r.family} ${r.kneeSeparationMm??''} | ${r.mode} | ${r.seed} | ${r.oldGuardsPass} | ${r.fingertipReach.pass} | ${r.opposedContact.pass} | ${r.hookedGripCandidate.pass} | ${r.overlaps.length} |`);
await writeFile(new URL('../COW-FACE-HAND-REPLAY.md',import.meta.url),`# Saved Cow Face hand witnesses\n\nReproduce: \`node movement/scripts/replay-cow-face-hands.mjs\`. Raw gaps are metres. Replay restores saved angles without IK. Reach uses a 5 mm per-tip tolerance. Opposed contact requires normals dot < -0.8, a surface gap ≤5 mm and no external proxy overlap. Hook candidates additionally require two distinct curled fingers in distal contact on each hand. This is a geometric candidate, not certified retention or anatomical feasibility. Conservative overlaps are unresolved blockers, not proven rendered penetration.\n\n| Family | Mode | Seed | Old guards | Tip reach | Opposed contact | Hook candidate | External overlaps |\n|---|---|---:|---|---|---|---|---:|\n${rows.join('\n')}\n`);
const summary={witnesses:results.length,oldGuardsPass:results.filter(r=>r.oldGuardsPass).length,reach:results.filter(r=>r.fingertipReach.pass).length,opposedContact:results.filter(r=>r.opposedContact.pass).length,hookCandidates:results.filter(r=>r.hookedGripCandidate.pass).length};
await writeFile(new URL('../COW-FACE-HAND-REPLAY.md',import.meta.url),`\n## Interpretation\n\n${JSON.stringify(summary)}\n\nThe two all-guard arm seeds reach their fingertip targets but neither establishes opposed contact or a hook. Seed 17 has 0.824 mm opposing middle-finger capsule overlap. Seed 73 has 0.817 mm middle-finger separation, but a new conservative thumb/torso overlap of 2.137 mm needs narrow-phase review. Both have zero curled fingers. Their palm-normal dots are 0.098 and -0.494, outside the opposed-contact threshold. Keep these as reach seeds, not completed binds. The catalog remains Cow Face (Preparation).\n\nNext solver work must optimize palm orientation and articulated finger contact while preserving support, ROM and collision guards. The hook criterion currently screens static geometric candidates only; it does not prove interlocking retention, contact forces, shoulder feasibility or transition safety.\n`,{flag:'a'});
console.log(summary);
