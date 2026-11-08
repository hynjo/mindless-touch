// Offline deterministic diagnostics. Does not edit catalog poses or editor limits.
import * as T from 'three';
import {writeFile} from 'node:fs/promises';
import {createBody} from '../body.js';
import {yogaPoses,uncorrectedYogaPoses} from '../poses.js';
import {applyPose} from '../apply-pose.js';
import {inspectPose} from '../pose-validation.js';
import {createFloorConstraints,floorClearance} from '../floor-constraints.js';
import {createSelfConstraints,segmentDistance} from '../self-constraints.js';
import {boxDistance} from '../hand-collisions.js';

const dimensions={pelvisHeight:.97,torso:.48,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43};
const material=new T.MeshStandardMaterial();
const body=createBody({scene:new T.Scene(),dimensions,bodyMaterial:material,jointMaterial:material}),meshes=[];
body.root.traverse(m=>{if(m.isMesh)meshes.push(m);});
const rig={...body,dimensions,meshes,byId:Object.fromEntries(body.joints.map(j=>[j.id,j]))};
const floor=createFloorConstraints(rig),self=createSelfConstraints(rig);
const pose=yogaPoses.find(p=>p.source.endsWith('/KneePileBind'));
const pos=id=>rig.byId[id].group.getWorldPosition(new T.Vector3());
const mm=n=>Math.round(n*1e5)/100;
const fingers=side=>body.hands[side].joints.map(j=>{
 const mesh=j.group.children.find(m=>m.geometry?.type==='CapsuleGeometry');
 const h=mesh.geometry.parameters.height/2;
 return {id:j.id,a:mesh.localToWorld(new T.Vector3(0,-h,0)),b:mesh.localToWorld(new T.Vector3(0,h,0)),r:mesh.geometry.parameters.radius};
});
function crossHand(){
 const left=fingers('left'),right=fingers('right'),pairs=[];
 for(const a of left)for(const b of right)pairs.push({a:a.id,b:b.id,gapMm:mm(segmentDistance(a.a,a.b,b.a,b.b)-a.r-b.r)});
 for(const [caps,side] of [[left,'right'],[right,'left']])for(const c of caps){const p=body.hands[side].palm;pairs.push({a:c.id,b:side+'Palm',gapMm:mm(boxDistance(p.worldToLocal(c.a.clone()),p.worldToLocal(c.b.clone()),p.userData.boxHalfExtents)-c.r)});}
 return {minimumGapMm:Math.min(...pairs.map(p=>p.gapMm)),penetrations:pairs.filter(p=>p.gapMm< -1),nearContacts:pairs.filter(p=>Math.abs(p.gapMm)<=5).slice(0,12),scope:'Finger capsules against opposite fingers and palm box; palm/palm and hand/core not certified.'};
}
function measure(extra=false){
 body.root.updateWorldMatrix(true,true);
 const report=inspectPose(rig,{supportRequirements:['sit-bones']}),l=pos('leftKnee'),r=pos('rightKnee');
 const supports=report.supports.requirements[0].samples;
 const depths=self.contacts(0),clearance=Math.min(...meshes.map(floorClearance));
 const result={sitBones:supports,kneeHorizontalMm:mm(Math.hypot(l.x-r.x,l.z-r.z)),kneeVerticalMm:mm(Math.abs(l.y-r.y)),
  wristDistanceMm:mm(pos('leftWrist').distanceTo(pos('rightWrist'))),rom:report.rom.issues,
  wristGuard:self.jointViolations(),contacts:depths,floorClearanceMm:mm(clearance),
  positions:Object.fromEntries(['pelvis','leftHip','rightHip','leftKnee','rightKnee','leftAnkle','rightAnkle','leftShoulder','rightShoulder','leftElbow','rightElbow','leftWrist','rightWrist'].map(id=>[id,pos(id).toArray()])),
  supported:supports.every(s=>s.pass),guardPass:supports.every(s=>s.pass)&&!report.rom.issues.length&&!self.jointViolations().length&&!self.contacts().length&&clearance>=.00068};
 if(extra){
  result.crossHand=crossHand();
  result.lowestMeshes=meshes.map(m=>{let g=m,j;while(g&&!j){j=rig.joints.find(j=>j.group===g);g=g.parent;}return {joint:j?.id,geometry:m.geometry.type,clearanceMm:mm(floorClearance(m))};}).sort((a,b)=>a.clearanceMm-b.clearanceMm).slice(0,8);
  let vertexMin=Infinity;const point=new T.Vector3();
  for(const mesh of meshes){const attr=mesh.geometry.attributes.position;for(let i=0;i<attr.count;i++)vertexMin=Math.min(vertexMin,point.fromBufferAttribute(attr,i).applyMatrix4(mesh.matrixWorld).y);}
  result.renderedVertexFloorMm=mm(vertexMin);
  const normal=side=>new T.Vector3(0,0,-1).applyQuaternion(body.hands[side].wrist.getWorldQuaternion(new T.Quaternion()));
  result.palmNormalDot=normal('left').dot(normal('right'));
  result.curledFingerJoints=rig.joints.filter(j=>j.isFinger&&Math.abs(j.group.rotation.x)>.15).length;
 }
 return result;
}
applyPose(rig,pose,{floor});const baseline=measure(true);
applyPose(rig,uncorrectedYogaPoses.find(p=>p.source===pose.source),{floor});const legacy=measure(true);
const iterations=Number(process.env.COW_DIAGNOSTIC_ITERATIONS||1600),seeds=[17,73];
const modes=['all','omit-rom','omit-collision','omit-floor','omit-seat'];
const scenarios=[];
function optimize(family,mode,seed,kneeSeparation=.16){
 applyPose(rig,pose,{floor});
 const jointNames=family==='legs'?['leftHip','rightHip','leftKnee','rightKnee','leftAnkle','rightAnkle']:['leftShoulder','rightShoulder','leftElbow','rightElbow','leftWrist','rightWrist'];
 const vars=[{obj:body.root.position,key:'y',step:.01}];
 for(const id of jointNames)for(const axis of /Knee|Elbow/.test(id)?['x']:['x','y','z'])vars.push({obj:rig.byId[id].group.rotation,key:axis,step:.13});
 const initial=vars.map(v=>v.obj[v.key]);
 const tip=side=>rig.byId[side+'Middle3'].group.localToWorld(new T.Vector3(0,-.019,0));
 function inspect(){
  const m=measure();let task;
  if(family==='legs'){
   // A nominal surface stack, not coincident joint centers. Right knee is upper.
   const l=pos('leftKnee'),r=pos('rightKnee');
   task=(l.x-r.x)**2+(l.z-r.z)**2+(r.y-l.y-kneeSeparation)**2;
   for(const side of ['left','right'])task+=Math.max(0,110-T.MathUtils.radToDeg(rig.byId[side+'Knee'].group.rotation.x))**2/1e4;
  }else{
   // Necessary reach test only: two fingertips near a shared point behind back.
   const a=tip('left'),b=tip('right');task=a.distanceToSquared(new T.Vector3(0,.46,-.20))+b.distanceToSquared(new T.Vector3(0,.459,-.20));
  }
  let cost=task*1e6;
  if(mode!=='omit-rom')cost+=m.rom.reduce((n,i)=>n+i.excessDegrees**2*1000,0)+m.wristGuard.length*1000;
  if(mode!=='omit-collision')cost+=m.contacts.reduce((n,c)=>n+c.depth**2*1e8,0);
  if(mode!=='omit-floor')cost+=Math.max(0,.7-m.floorClearanceMm)**2*100;
  if(mode!=='omit-seat')cost+=m.sitBones.reduce((n,s)=>n+Math.max(0,s.gapMm-3,-s.minGapMm)**2*100,0);
  return {cost,taskErrorMm:mm(Math.sqrt(task)),measurement:m};
 }
 let state=seed>>>0;const random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296);
 const guardedSnapshot=attempt=>({taskErrorMm:attempt.taskErrorMm,rootPosition:body.root.position.toArray(),rotations:Object.fromEntries(rig.joints.map(j=>[j.id,j.group.rotation.toArray().slice(0,3).map(T.MathUtils.radToDeg)]))});
 let best=inspect(),accepted=0,bestGuarded=best.measurement.guardPass?guardedSnapshot(best):null;
 for(let n=0;n<iterations;n++){
  const saved=vars.map(v=>v.obj[v.key]);
  for(let k=0;k<(n%3===0?2:1);k++){const v=vars[Math.floor(random()*vars.length)];v.obj[v.key]+=(random()-.5)*2*v.step;}
  const attempt=inspect();
  if(attempt.measurement.guardPass&&(!bestGuarded||attempt.taskErrorMm<bestGuarded.taskErrorMm))bestGuarded=guardedSnapshot(attempt);
  if(attempt.cost<best.cost){best=attempt;accepted++;}else vars.forEach((v,i)=>{v.obj[v.key]=saved[i];});
 }
 const final=measure(true);
 const angles=Object.fromEntries(jointNames.map(id=>[id,rig.byId[id].group.rotation.toArray().slice(0,3).map(T.MathUtils.radToDeg)]));
 return {family,mode,seed,kneeSeparationMm:family==='legs'?mm(kneeSeparation):null,iterations,accepted,taskErrorMm:best.taskErrorMm,bestGuarded,measurement:final,angles,rootY:body.root.position.y,initialRootY:initial[0]};
}
for(const family of ['legs','arms'])for(const mode of modes)for(const seed of seeds){scenarios.push(optimize(family,mode,seed));process.stderr.write(`${family} ${mode} ${seed} done\n`);}
for(const separation of [.10,.22,-.16])for(const seed of seeds){scenarios.push(optimize('legs','all',seed,separation));process.stderr.write(`legs sensitivity ${separation} ${seed} done\n`);}
const targetReach={};
for(const [side,target] of [['left',[.008,.62,-.19]],['right',[.008,.289,-.19]]]){
 const d=new T.Vector3(...baseline.positions[side+'Shoulder']).distanceTo(new T.Vector3(...target));targetReach[side]={distanceMm:mm(d),maximumMm:550,minimumMm:30,withinUnconstrainedTwoBoneReach:d<=.55&&d>=.03};
}
// Equal-length femurs, equal-height hips, vertically stacked knee centers:
// 4*h*x + (yR-yL)*(yR+yL-2*yHip) = 0. Centerline stacking is not a neutral target.
const hipY=baseline.positions.leftHip[1],midKneeY=.25,kneeSeparation=.16;
const kneeGeometry={femurMm:430,hipHalfWidthMm:110,exampleMidKneeHeightMm:mm(midKneeY),exampleSeparationMm:160,
 requiredLateralStackOffsetMm:mm(-kneeSeparation*(midKneeY-hipY)/(.22)),
 note:'Analytic fixed-pelvis example, not an anatomical prescription. With both knees above equal-height hips, exact vertical stacking cannot also be on the centerline. Pelvis tilt or lateral placement changes this relation.'};
const result={generatedAt:new Date().toISOString(),iterations,seeds,legacy,baseline,targetReach,kneeGeometry,scenarios,
 limitations:['Deterministic local search, not proof of feasibility or impossibility. Two seeds share the authored initialization.','Targets are diagnostic choices: 160 mm vertical knee separation and one fixed behind-back fingertip target.','Ablations omit one penalty, never change editor rules. All candidates are measured again with original guards.','Task score is a residual, not certification of a stacked knee support or interlocked grip.','Shoulder elevation is reference-only in the current ROM audit; coupled shoulder/scapula limits are missing.','Cross-hand audit is supplemental and not included in the search penalty. Hand/core and palm/palm collision gaps remain.','No transitions, force balance, pressure, soft tissue or visual browser verification.']};
const root=new URL('../',import.meta.url);await writeFile(new URL('cow-face-diagnostics.json',root),JSON.stringify(result,null,2)+'\n');
const rows=scenarios.map(s=>`| ${s.family} ${s.kneeSeparationMm??''} | ${s.mode} | ${s.seed} | ${s.taskErrorMm} | ${s.bestGuarded?.taskErrorMm??'none'} | ${s.measurement.guardPass} | ${s.measurement.rom.length} | ${s.measurement.contacts.length} | ${s.measurement.floorClearanceMm} |`).join('\n');
await writeFile(new URL('COW-FACE-DIAGNOSTICS.md',root),`# Cow Face diagnostic measurements\n\nGenerated ${result.generatedAt}. Run \`node movement/scripts/diagnose-cow-face.mjs\`. Optional \`COW_DIAGNOSTIC_ITERATIONS\` controls trials per search. No runtime data or constraints are changed.\n\n## Controlled ablations\n\nSame starting pose, budgets and random seeds for each mode. Task error is the combined target residual in mm; compare only within a family. Guarded error is the best candidate passing current floor/support/ROM/self guards, not a full pose pass.\n\n| Family | Omitted penalty | Seed | Task error mm | Best guarded mm | Final guards pass | ROM issues | Contacts | Floor clearance mm |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n${rows}\n\n## Limits\n\n${result.limitations.map(x=>'- '+x).join('\n')}\n\nThe JSON includes baseline/legacy measurements, per-side reach, exact candidate angles, failing joints, collision pairs, lowest meshes, and supplemental inter-hand checks.\n`);
console.log(JSON.stringify({targetReach,summary:scenarios.map(({family,mode,seed,taskErrorMm,bestGuarded,measurement:m})=>({family,mode,seed,taskErrorMm,bestGuarded,pass:m.guardPass}))},null,2));
