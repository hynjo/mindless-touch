import * as THREE from 'three';
import {createBody} from './body.js';
import {createFloorConstraints,floorClearance,FLOOR_SKIN} from './floor-constraints.js';
import {createSelfConstraints,segmentDistance} from './self-constraints.js';
import {boxDistance} from './hand-collisions.js';
import {applyPose} from './apply-pose.js';
import {inspectPose} from './pose-validation.js';
import {supportProfile} from './support-profiles.js';
import {referenceTasks} from './pose-audit-reference.js';
import {handFootContacts} from './toe-grip.js';
import {mirrorRotations} from './ashtanga-shapes.js';
import {capturePose} from './pole-constraints.js';
import {serializeSequence,parseSequence,SEQUENCE_FORMAT} from './sequence-file.js';
import {posePath} from './pose-routes.js';

export const auditDimensions=Object.freeze({pelvisHeight:.97,torso:.48,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43});
export function createAuditRig(){
 const material=new THREE.MeshStandardMaterial(),body=createBody({scene:new THREE.Scene(),dimensions:auditDimensions,bodyMaterial:material,jointMaterial:material}),meshes=[];
 body.root.traverse(mesh=>{if(mesh.isMesh)meshes.push(mesh);});
 const rig={...body,dimensions:auditDimensions,meshes,byId:Object.fromEntries(body.joints.map(j=>[j.id,j]))};
 rig.floor=createFloorConstraints(rig);rig.self=createSelfConstraints(rig);return rig;
}
const round=n=>Number.isFinite(n)?Math.round(n*1000)/1000:null;
const capsule=mesh=>{const half=(mesh.geometry.parameters.height||0)/2;return {a:mesh.localToWorld(new THREE.Vector3(0,-half,0)),b:mesh.localToWorld(new THREE.Vector3(0,half,0)),r:mesh.geometry.parameters.radius};};
function handLegContacts(rig){
 const limbs=rig.joints.filter(j=>/Hip$|Knee$|Shoulder$|Elbow$/.test(j.id)).map(j=>({id:j.id,side:j.id.startsWith('left')?'left':'right',mesh:j.group.children.find(m=>m.geometry?.type==='CapsuleGeometry')}));
 const findings=[];
 for(const [side,hand] of Object.entries(rig.hands))for(const limb of limbs){
  // The hand attaches to its own forearm. Other arms/legs remain observable.
  if(limb.id===side+'Elbow')continue;
  const c=capsule(limb.mesh),bound=new THREE.Box3().setFromObject(limb.mesh,true);
  for(const mesh of hand.meshes.filter(m=>!m.userData.handNail)){
   if(!new THREE.Box3().setFromObject(mesh,true).intersectsBox(bound))continue;
   let gap;
   if(mesh.userData.boxHalfExtents)gap=boxDistance(mesh.worldToLocal(c.a.clone()),mesh.worldToLocal(c.b.clone()),mesh.userData.boxHalfExtents)-c.r;
   else {const finger=capsule(mesh);gap=segmentDistance(finger.a,finger.b,c.a,c.b)-finger.r-c.r;}
   if(gap<-.0005)findings.push({hand:side,part:mesh.userData.fingerJoint?.id||'palm',limb:limb.id,depthMm:round(-gap*1000)});
  }
 }
 return findings;
}
function boundGap(a,b){
 const x=Math.max(a.min.x-b.max.x,b.min.x-a.max.x,0),y=Math.max(a.min.y-b.max.y,b.min.y-a.max.y,0),z=Math.max(a.min.z-b.max.z,b.min.z-a.max.z,0);
 return Math.hypot(x,y,z);
}
export function screenReferenceRelations(rig,pose,supports){
 const key=pose.source.split('/').at(-1),cache=new Map();
 const bounds=meshes=>meshes.map(mesh=>{if(!cache.has(mesh))cache.set(mesh,new THREE.Box3().setFromObject(mesh,true));return cache.get(mesh);});
 const gap=(a,b)=>Math.min(...bounds(a).flatMap(x=>bounds(b).map(y=>boundGap(x,y))))*1000;
 const hand=side=>rig.hands[side].meshes,foot=side=>rig.feet[side].meshes;
 // Reference ankle holds can meet the ankle region without meeting a foot pad.
 // Include its regional sphere for a conservative separation screen only.
 const footTarget=side=>foot(side).concat(rig.byId[side+'Ankle'].group.children.filter(m=>m.geometry?.type==='SphereGeometry'));
 const limb=(side,part)=>rig.byId[side+part].group.children.filter(m=>m.geometry?.type==='CapsuleGeometry');
 const core=id=>rig.byId[id].group.children.filter(m=>m.isMesh&&!m.userData.joint&&m.geometry?.type==='SphereGeometry');
 const sides=['left','right'],allHands=sides.flatMap(hand),allFeet=sides.flatMap(foot),legs=sides.flatMap(s=>[...limb(s,'Hip'),...limb(s,'Knee')]);
 const h2f=sides.map(h=>sides.map(f=>gap(hand(h),footTarget(f))));
 return referenceTasks(key).map(task=>{
  if(task.exempt)return {...task,status:'explicit-modification',gapLowerBoundMm:null};
  if(task.validator){const sample=supports.surfaces[task.validator];return {...task,status:sample?.pass?'validated':'failed-validator',gapLowerBoundMm:null,measurementMm:sample?.gapMm??null};}
  let distance,threshold=25;
  switch(task.kind){
   case 'knees-ears':{
    const distances=sides.map(side=>{
     const ear=rig.byId.neck.group.localToWorld(new THREE.Vector3(side==='left'?.11:-.11,.13,0));
     const knee=rig.byId[side+'Knee'].group.getWorldPosition(new THREE.Vector3());
     return Math.max(0,knee.distanceTo(ear)-.106)*1000;
    });
    distance=Math.max(...distances);break;
   }
   case 'feet-floor':distance=Math.max(...sides.map(s=>supports.surfaces[s+'-foot-edge'].gapMm));break;
   case 'arms-floor':distance=Math.max(...sides.map(s=>supports.surfaces[s+'-forearm'].minGapMm));break;
   case 'both-hands-feet':distance=Math.min(Math.max(h2f[0][0],h2f[1][1]),Math.max(h2f[0][1],h2f[1][0]));break;
   case 'hand-foot':case 'hands-feet':distance=Math.min(...h2f.flat());break;
   case 'both-hands-one-foot':distance=Math.min(Math.max(h2f[0][0],h2f[1][0]),Math.max(h2f[0][1],h2f[1][1]));break;
   case 'hands-together':distance=gap(hand('left'),hand('right'));break;
   case 'hands-pelvis':distance=Math.max(...sides.map(s=>gap(hand(s),core('pelvis'))));break;
   case 'hands-lower-legs':distance=gap(allHands,legs.concat(allFeet));break;
   case 'hands-knees':distance=gap(allHands,sides.flatMap(s=>limb(s,'Knee')));break;
   case 'soles-together':distance=gap(foot('left'),foot('right'));break;
   case 'leg-behind-head':case 'legs-behind-head':{
    const gaps=sides.map(s=>gap(limb(s,'Knee').concat(foot(s)),[rig.headMesh]));
    distance=task.kind==='legs-behind-head'?Math.max(...gaps):Math.min(...gaps);threshold=40;break;
   }
   case 'foot-thigh':distance=Math.min(gap(foot('left'),limb('right','Hip')),gap(foot('right'),limb('left','Hip')));break;
   case 'lotus':distance=Math.max(gap(foot('left'),limb('right','Hip')),gap(foot('right'),limb('left','Hip')));break;
   case 'stacked-knees':{
    const left=rig.byId.leftKnee.group.getWorldPosition(new THREE.Vector3()),right=rig.byId.rightKnee.group.getWorldPosition(new THREE.Vector3());
    distance=Math.max(0,Math.hypot(left.x-right.x,left.z-right.z)-.10)*1000;threshold=30;break;
   }
   case 'stacked-shins':distance=gap(limb('left','Knee'),limb('right','Knee'));break;
   case 'cradle':distance=Math.min(...sides.map(s=>Math.max(gap(foot(s),limb('left','Elbow')),gap(limb(s,'Knee'),limb('right','Elbow')))),...sides.map(s=>Math.max(gap(foot(s),limb('right','Elbow')),gap(limb(s,'Knee'),limb('left','Elbow')))));break;
   case 'arm-leg-support':distance=gap(legs,sides.flatMap(s=>[...limb(s,'Shoulder'),...limb(s,'Elbow')]));break;
  }
  return {...task,gapLowerBoundMm:round(distance),separationThresholdMm:threshold,status:!Number.isFinite(distance)?'unmeasured':distance>threshold?(task.required?'separated':'optional-separated'):'near-unverified'};
 });
}
function measure(rig,pose){
 const inspection=inspectPose(rig,pose),body=rig.self.contacts(0).filter(c=>c.depth>.0005).map(({depth,...p})=>({...p,depthMm:round(depth*1000)}));
 const head=rig.self.headContacts(0).filter(c=>c.depth>.0005).map(({depth,...p})=>({...p,depthMm:round(depth*1000)}));
 const external=rig.self.externalContacts(0).filter(c=>c.depth>.0005).map(({depth,...p})=>({...p,depthMm:round(depth*1000)}));
 const feet=handFootContacts(rig).map(({depth,...p})=>({...p,depthMm:round(depth*1000)})),handLimbs=handLegContacts(rig);
 const floorMm=Math.min(...rig.meshes.map(floorClearance))*1000;
 const relations=screenReferenceRelations(rig,pose,inspection.supports);
 return {support:inspection.supports,rom:inspection.rom,form:inspection.form,floorClearanceMm:round(floorMm),floorPass:floorMm>=FLOOR_SKIN*1000-.02,bodyContacts:body,armHeadContacts:head,externalHandContacts:external,handFootContacts:feet,handLimbContacts:handLimbs,relations};
}
function signature(m){return JSON.stringify({supports:m.support.issues.map(i=>i.name),rom:m.rom.issues.map(i=>[i.joint,i.motion,i.degrees]),form:m.form.issues.map(i=>i.name),floor:m.floorPass,body:m.bodyContacts,head:m.armHeadContacts,external:m.externalHandContacts,feet:m.handFootContacts,limbs:m.handLimbContacts,relations:m.relations.map(r=>[r.kind,r.status])});}
function compact(m){return {supportIssues:m.support.issues.map(i=>i.name),romIssues:m.rom.issues,formIssues:m.form.issues,floorPass:m.floorPass,bodyContacts:m.bodyContacts,armHeadContacts:m.armHeadContacts,externalHandContacts:m.externalHandContacts,handFootContacts:m.handFootContacts,handLimbContacts:m.handLimbContacts,relations:m.relations.map(r=>({kind:r.kind,status:r.status,gapLowerBoundMm:r.gapLowerBoundMm})),uncoveredForm:m.form.checks.length===0};}
export function auditLibraryPose(rig,pose,reference){
 const placement=applyPose(rig,pose,{floor:rig.floor}),measurement=measure(rig,pose),snapshot=capturePose(rig.root,rig.joints);
 const context={studio:'movement',dimensions:rig.dimensions,jointIds:rig.joints.map(j=>j.id)};
 let roundTrip;
 try{
  const input={format:SEQUENCE_FORMAT,version:1,studio:'movement',dimensions:rig.dimensions,name:pose.name,steps:[{
   id:'audit',name:pose.name,holdSeconds:3,transitionSeconds:2.2,poseContract:pose.poseContract,supportRequirements:supportProfile(pose).requirements,floorSupport:pose.floorSupport,
   pose:{rootPosition:rig.root.position.toArray(),rotations:Object.fromEntries(rig.joints.map(j=>[j.id,j.group.rotation.toArray().slice(0,3)])),handOffsets:Object.fromEntries(Object.entries(snapshot.handOffsets).map(([s,v])=>[s,v.toArray()])),poleContacts:{}},
  }]};
  const step=parseSequence(serializeSequence(input,context),context).steps[0];
  rig.root.position.y+=.2;rig.joints.forEach(j=>j.group.rotation.set(0,0,0));applyPose(rig,step,{floor:rig.floor});
  const restored=capturePose(rig.root,rig.joints),after=measure(rig,pose),angle=Math.max(...snapshot.rotations.map((q,i)=>2*Math.acos(Math.min(1,Math.abs(q.dot(restored.rotations[i]))))));
  const offsetsMatch=['left','right'].every(side=>snapshot.handOffsets[side].distanceTo(restored.handOffsets[side])<1e-8);
  roundTrip={pass:snapshot.position.distanceTo(restored.position)<1e-8&&angle<1e-6&&offsetsMatch&&signature(measurement)===signature(after),positionDeltaMm:round(snapshot.position.distanceTo(restored.position)*1000),rotationDeltaDegrees:round(angle*180/Math.PI),sameFindings:signature(measurement)===signature(after)};
 }catch(error){roundTrip={pass:false,error:error.message};}
 let mirror;
 try{const mirrored={...pose,rotations:mirrorRotations(pose.rotations),handOffsets:pose.handOffsets?Object.fromEntries(Object.entries(pose.handOffsets).map(([side,[x,y,z]])=>[side==='left'?'right':'left',[-x,y,z]])):undefined};applyPose(rig,mirrored,{floor:rig.floor});mirror=compact(measure(rig,mirrored));}catch(error){mirror={error:error.message};}
 const coverage=[];
 if(!pose.poseContract||!measurement.form.checks.length)coverage.push('No versioned pose-form checks');
 if(measurement.relations.some(r=>r.required&&['near-unverified','unmeasured'].includes(r.status)))coverage.push('Required bind/contact has no precise validator');
 if(supportProfile(pose).requirements.filter(r=>r.startsWith('any-')).length>1)coverage.push('Independent any-side supports do not establish limb roles');
 if(measurement.externalHandContacts.some(c=>c.approximate))coverage.push('Conservative external hand/core overlap needs review');
 if(measurement.handLimbContacts.length)coverage.push('Hand/limb proxy overlap needs contact-intent review');
 const detected=[];
 if(measurement.support.issues.length)detected.push('support');
 if(measurement.rom.issues.length)detected.push('joint-range');
 if(measurement.form.issues.length)detected.push('form');
 if(!measurement.floorPass)detected.push('floor');
 if(measurement.bodyContacts.length)detected.push('body-overlap');
 if(measurement.armHeadContacts.length)detected.push('arm/head-proxy-overlap');
 if(measurement.handFootContacts.length)detected.push('hand/foot-overlap');
 if(measurement.externalHandContacts.some(c=>!c.approximate))detected.push('between-hand-overlap');
 if(measurement.relations.some(r=>r.required&&['separated','failed-validator'].includes(r.status)))detected.push('reference-relationship');
 if(!roundTrip.pass)detected.push('save/load');
 if(placement?.accepted===false)detected.push('placement-rejected');
 const mirrorFindings=mirror.error||mirror.supportIssues?.length||mirror.romIssues?.length||mirror.formIssues?.length||mirror.floorPass===false||mirror.bodyContacts?.length||mirror.armHeadContacts?.length||mirror.handFootContacts?.length;
 if(mirrorFindings)coverage.push('Mirrored pose or side-specific contract has findings');
 if(pose.draft)coverage.push('Catalog entry remains a draft');
 if(!reference)coverage.push('Source key absent from the current reference dictionary');
 const status=detected.length?'measured-findings':coverage.length||mirrorFindings||pose.draft?'review-required':'scoped-pass';
 const priority=detected.some(d=>['floor','save/load','placement-rejected'].includes(d))?'P0':detected.length?'P1':coverage.length||mirrorFindings||pose.draft?'P2':'P3';
 return {key:pose.source.split('/').at(-1),id:pose.id,name:pose.name,category:pose.category,difficulty:pose.difficulty,source:pose.source,path:posePath(pose),draft:pose.draft,modification:pose.modification||null,contract:pose.poseContract||null,reference:{matched:!!reference,name:reference?.display_name||null,twoSided:reference?.two_sided??null,variationKeys:reference?.variations||[],illustration:reference?`https://pocketyoga.com/assets/images/full/${reference.name}.png`:null},status,priority,detected,coverage,placementAccepted:placement?.accepted??null,...measurement,mirror,roundTrip};
}
export function summarizeAudit(results){
 const count=test=>results.filter(test).length;
 const originalCrooked=results.find(r=>r.key==='CrookedMonkey');
 return {total:results.length,otherPoses:count(r=>r.key!=='CrookedMonkey'),crookedMonkeyControl:originalCrooked?.status||'missing',statuses:Object.fromEntries(['measured-findings','review-required','scoped-pass'].map(s=>[s,count(r=>r.status===s)])),priorities:Object.fromEntries(['P0','P1','P2','P3'].map(p=>[p,count(r=>r.priority===p)])),supports:count(r=>r.support.issues.length),jointRanges:count(r=>r.rom.issues.length),forms:count(r=>r.form.issues.length),floor:count(r=>!r.floorPass),bodyOverlaps:count(r=>r.bodyContacts.length),armHeadProxyOverlaps:count(r=>r.armHeadContacts.length),betweenHandOverlaps:count(r=>r.externalHandContacts.some(c=>!c.approximate)),conservativeHandCoreOverlaps:count(r=>r.externalHandContacts.some(c=>c.approximate)),handFootOverlaps:count(r=>r.handFootContacts.length),handLimbProxyOverlaps:count(r=>r.handLimbContacts.length),separatedRequiredRelationships:count(r=>r.relations.some(t=>t.required&&t.status==='separated')),missingFormContracts:count(r=>!r.form.checks.length),unverifiedRequiredRelationships:count(r=>r.relations.some(t=>t.required&&['near-unverified','unmeasured'].includes(t.status))),roundTripFailures:count(r=>!r.roundTrip.pass),mirrorFindingPoses:count(r=>r.mirror.error||r.mirror.supportIssues?.length||r.mirror.romIssues?.length||r.mirror.formIssues?.length||r.mirror.floorPass===false||r.mirror.bodyContacts?.length||r.mirror.armHeadContacts?.length||r.mirror.handFootContacts?.length),missingReferences:count(r=>!r.reference.matched),byCategory:Object.fromEntries([...new Set(results.map(r=>r.category))].map(category=>{const group=results.filter(r=>r.category===category);return [category,{total:group.length,measuredFindings:group.filter(r=>r.status==='measured-findings').length,reviewRequired:group.filter(r=>r.status==='review-required').length,scopedPass:group.filter(r=>r.status==='scoped-pass').length}];}))};
}
