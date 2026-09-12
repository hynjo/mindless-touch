import {writeFile} from 'node:fs/promises';
import * as THREE from 'three';
import {createBody} from '../body.js';
import {yogaPoses} from '../poses.js';
import {sunSalutation} from '../examples.js';
import {poleFlow} from '../pole-example.js';
import {applyHandPreset} from '../hands.js';
import {createFloorConstraints,floorClearance} from '../floor-constraints.js';
import {createPoleConstraints,capturePose} from '../pole-constraints.js';
import {createSelfConstraints} from '../self-constraints.js';
import {placeHandsAndKnees,placePalmsOnFloor,palmsAreSupported,preparePalmLanding} from '../palm-support.js';
import {samplePoleMotion} from '../pole-motion.js';
import {createTimeline} from '../playback.js';
const dimensions={pelvisHeight:.97,torso:.48,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43};
function rig(pole=false){
 const material=new THREE.MeshStandardMaterial(),body=createBody({scene:new THREE.Scene(),dimensions,bodyMaterial:material,jointMaterial:material});
 const meshes=[];body.root.traverse(m=>{if(m.isMesh)meshes.push(m);});
 const byId=Object.fromEntries(body.joints.map(j=>[j.id,j]));
 const chain=id=>{const side=id.startsWith('left')?'left':'right';return {upper:byId[side+'Shoulder'].group,middle:byId[side+'Elbow'].group,end:byId[side+'Wrist'].group,a:dimensions.upperArm,b:dimensions.forearm};};
 const r={...body,meshes,byId,dimensions};r.floor=createFloorConstraints(r);r.self=createSelfConstraints(r);if(pole)r.pole=createPoleConstraints({...r,chain});return r;
}
function apply(r,step){
 r.root.position.fromArray(step.rootPosition);
 for(const j of r.joints)j.group.rotation.set(...(step.rotations[j.id]||[0,0,0]).map(THREE.MathUtils.degToRad));
 for(const hand of Object.values(r.hands))applyHandPreset(hand,'open');
 if(r.pole){r.pole.settle();for(const side of ['left','right'])if(step.contacts?.[side+'Wrist'])r.pole.attach(side,{height:step.contacts[side+'Wrist'][1],angle:step.orbit.angle});}
 else {if(step.floorSupport==='palms-knees')placeHandsAndKnees(r);else if(palmsAreSupported(step))placePalmsOnFloor(r);r.floor.settle();}
 r.root.updateWorldMatrix(true,true);
}
function inspect(r,name){
 const contacts=r.self.contacts().map(c=>({...c,depthMm:Math.round(c.depth*10000)/10}));
 const clearance=r.pole?r.pole.clearance():Math.min(...r.meshes.map(floorClearance));
 return {name,contacts:contacts.map(({a,b,depthMm})=>({a,b,depthMm})),surfaceClearanceMm:Math.round(clearance*1e6)/1000};
}
const yoga=rig(),pole=rig(true);
const library=yogaPoses.map(p=>{apply(yoga,p);return inspect(yoga,p.name);});
const examples={};
for(const [name,steps,r] of [['Sun Salutation',sunSalutation.steps,yoga],['Pole Flow',poleFlow.steps,pole]]){
 const frames=steps.map(step=>{apply(r,step);return {...capturePose(r.root,r.joints),grips:r.pole?[...r.pole.grips]:[]};});
 const cards=steps.map(step=>{apply(r,step);return inspect(r,step.name);});
 apply(r,steps[0]);
 const timeline=createTimeline(steps),collisions=new Map();let samples=0,surfaceFailures=0;
 const indices=r.joints.map((j,i)=>j.isFinger?i:-1).filter(i=>i>=0);
 for(let t=0;t<=timeline.duration;t+=.05){
  const s=timeline.sample(t),a=frames[s.index],b=frames[s.next];
  if(r.pole){const motion=samplePoleMotion(steps,frames,s.index,s.next,s.mix,indices);r.root.position.copy(motion.position);r.joints.forEach((j,i)=>j.group.quaternion.copy(motion.rotations[i]));r.pole.grips.clear();for(const [side,grip] of motion.grips)r.pole.grips.set(side,{...grip});r.pole.commit();}
  else{r.root.position.lerpVectors(a.position,b.position,s.mix);r.joints.forEach((j,i)=>j.group.quaternion.slerpQuaternions(a.rotations[i],b.rotations[i],s.mix));if(palmsAreSupported(steps[s.index])&&palmsAreSupported(steps[s.next]))placePalmsOnFloor(r);else if(palmsAreSupported(steps[s.index])||palmsAreSupported(steps[s.next]))preparePalmLanding(r);r.floor.settle();}
  const result=inspect(r,`${steps[s.index].name} → ${steps[s.next].name}`);samples++;
  if(result.surfaceClearanceMm<-.1)surfaceFailures++;
  for(const contact of result.contacts){const key=`${s.index}:${s.next}:${contact.a}:${contact.b}`,previous=collisions.get(key);collisions.set(key,{transition:result.name,a:contact.a,b:contact.b,firstSeconds:previous?.firstSeconds??Math.round(t*100)/100,lastSeconds:Math.round(t*100)/100,maxDepthMm:Math.max(previous?.maxDepthMm||0,contact.depthMm)});}
 }
 examples[name]={cards,samples,surfaceFailures,collisions:[...collisions.values()]};
}
const summary={total:library.length,flagged:library.filter(p=>p.contacts.length).length,clear:library.filter(p=>!p.contacts.length).length,surfaceFailures:library.filter(p=>p.surfaceClearanceMm<-.1).length};
const report={generatedAt:new Date().toISOString(),scope:'Limb capsules versus nonadjacent limbs; forearms/shins versus expanded torso, waist and pelvis ellipsoids. Within each hand: nonadjacent finger capsules and finger/palm volumes; shared hinges and palm attachment zones are excluded. Between-hand contact, toes, feet and head self-contact are not covered. Surface clearance includes all physical parts. Body contact below 1 mm is omitted from this audit.',summary,library,examples};
await writeFile(new URL('../collision-audit.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
let md=`# Pose collision audit\n\nGenerated: ${report.generatedAt}\n\n## Scope\n\n${report.scope}\n\nStatic poses use the editor's floor/pole correction. Transition samples are taken every 50 ms **before** the new body-collision playback guard; these are potential contacts that the guard should stop. This does not enumerate every possible transition between the 167 poses. Ellipsoid checks are conservative approximations, so flags require visual review.\n\n## Library\n\n${summary.total} poses: **${summary.flagged} flagged**, ${summary.clear} without detected overlaps; ${summary.surfaceFailures} surface-clearance failures. “Without detected overlaps” is not a full anatomical certification.\n\n| Pose | Overlapping parts | Maximum depth (mm) |\n| --- | --- | ---: |\n`;
for(const p of library.filter(p=>p.contacts.length))md+=`| ${p.name} | ${p.contacts.map(c=>`${c.a} / ${c.b}`).join('; ')} | ${Math.max(...p.contacts.map(c=>c.depthMm))} |\n`;
md+='\n## Clear in the checked scope\n\n'+library.filter(p=>!p.contacts.length).map(p=>p.name).join(', ')+'.\n';
for(const [name,e] of Object.entries(examples)){
 md+=`\n## ${name}\n\n${e.cards.length} cards, ${e.cards.filter(c=>c.contacts.length).length} flagged cards. ${e.samples} transition/hold samples; ${e.surfaceFailures} surface failures.\n\n| Transition | Parts | Time interval (s) | Maximum depth (mm) |\n| --- | --- | --- | ---: |\n`;
 for(const c of e.collisions)md+=`| ${c.transition} | ${c.a} / ${c.b} | ${c.firstSeconds}–${c.lastSeconds} | ${c.maxDepthMm} |\n`;
}
md+='\n## Reproduce\n\nRun `node movement/scripts/audit-collisions.mjs`. This regenerates this report and `collision-audit.json`. The report is diagnostic and does not silently rewrite saved sequences.\n';
await writeFile(new URL('../POSE-COLLISION-AUDIT.md',import.meta.url),md);
console.log(JSON.stringify({summary,examples:Object.fromEntries(Object.entries(examples).map(([name,e])=>[name,{cards:e.cards.length,flaggedCards:e.cards.filter(c=>c.contacts.length).length,collisions:e.collisions.length,surfaceFailures:e.surfaceFailures}]))},null,2));
