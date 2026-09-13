import * as THREE from 'three';
import {floorClearance,FLOOR_SKIN} from './floor-constraints.js';
import {wristAngles} from './wrist-constraints.js';
import {supportProfile} from './support-profiles.js';
const deg=THREE.MathUtils.radToDeg;
const down=new THREE.Vector3(0,-1,0);
export const CONTACT_TOLERANCE_MM=5;
const round=n=>Number.isFinite(n)?Math.round(n*100)/100:null;
function bodyMesh(group){return group.children.find(m=>m.isMesh&&!m.userData.joint);}
function lowest(mesh){return floorClearance(mesh)-FLOOR_SKIN;}
function capEnd(mesh,end){const half=mesh.geometry.parameters.height/2;return mesh.localToWorld(new THREE.Vector3(0,end*half,0)).y-mesh.geometry.parameters.radius-FLOOR_SKIN;}
function direction(quaternion){const d=down.clone().applyQuaternion(quaternion);return {bend:deg(Math.atan2(-d.z,-d.y)),tilt:deg(Math.asin(THREE.MathUtils.clamp(d.x,-1,1))),swing:deg(Math.acos(THREE.MathUtils.clamp(-d.y,-1,1)))};}
const wrap=angle=>((angle+180)%360+360)%360-180;
export function inspectJointRanges(joints){
 const measurements=[],issues=[],excluded=[];
 const check=(joint,motion,value,min,max,tolerance=1)=>{const excess=Math.max(min-value,value-max,0);const m={joint:joint.id,motion,degrees:round(value),range:[min,max],excessDegrees:round(excess),status:excess>tolerance?'review':'within-editor-envelope'};measurements.push(m);if(excess>tolerance)issues.push(m);};
 for(const joint of joints){
  const {id,group}=joint,r=group.rotation,d=direction(group.quaternion);
  if(id==='pelvis'){excluded.push({joint:id,reason:'Global body orientation, not a hip joint angle'});continue;}
  if(id.endsWith('Wrist')){const a=wristAngles(group.quaternion);check(joint,'bend',deg(a.bend),-80,80);check(joint,'side tilt',deg(a.tilt),-35,35);continue;}
  if(id.endsWith('Elbow')||id.endsWith('Knee')){
   const knee=id.endsWith('Knee');check(joint,'hinge flexion',knee?d.bend:-d.bend,0,150,2);
   check(joint,'off-hinge direction',d.tilt,-5,5,0);
   // Longitudinal forearm roll does not move the forearm centerline. Do not call
   // Euler Y/Z a broken elbow: IK and pole pronation both use that representation.
   continue;
  }
  if(id.endsWith('Hip')){check(joint,'projected flexion',-d.bend,-45,130);check(joint,'projected abduction/adduction',d.tilt,-70,70);const q=group.quaternion;check(joint,'axial twist proxy',wrap(deg(2*Math.atan2(q.y,q.w))),-60,60);continue;}
  if(id.endsWith('Shoulder')){measurements.push({joint:id,motion:'arm elevation',degrees:round(d.swing),range:[0,180],status:'reference-only'});excluded.push({joint:id,reason:'Scapular motion and coupled shoulder rotation are not represented; elevation alone cannot validate shoulder ROM'});continue;}
  if(id.endsWith('Ankle')){check(joint,'point/flex',d.bend,-40,50);check(joint,'side tilt',d.tilt,-25,25);continue;}
  if(joint.isFootJoint){check(joint,'arch bend',deg(r.x),deg(-.45),deg(.6));check(joint,'unmodeled arch Y',deg(r.y),0,0);check(joint,'unmodeled arch Z',deg(r.z),0,0);continue;}
  if(joint.isToe||joint.isFinger){
   check(joint,'curl',deg(r.x),joint.minBend??0,joint.maxBend);
   if(joint.isToe||joint.segment>0){check(joint,'off-hinge Y',deg(r.y),0,0);check(joint,'off-hinge Z',deg(r.z),0,0);}
   else {check(joint,'base spread/opposition',deg(r.z),joint.finger==='Thumb'?-90:-25,joint.finger==='Thumb'?90:25);check(joint,'base twist',deg(r.y),joint.finger==='Thumb'?-90:0,joint.finger==='Thumb'?90:0);}
   continue;
  }
  for(const [i,axis] of ['x','y','z'].entries())check(joint,`local ${axis}`,deg(r[axis]),...joint.limits[i]);
 }
 return {measurements,issues,excluded,coverage:{totalJoints:joints.length,measuredJoints:new Set(measurements.map(m=>m.joint)).size,wholeBodyRotationExcluded:1}};
}
export function inspectSupports(rig,pose){
 const {root,byId,hands,feet}=rig;root.updateWorldMatrix(true,true);
 const surfaces={};
 const add=(name,gaps,note='',alignment=null,minimumAlignment=.95)=>{const gap=Math.max(...gaps)*1000;surfaces[name]={name,gapMm:round(gap),minGapMm:round(Math.min(...gaps)*1000),alignment:alignment===null?null:round(alignment),minimumAlignment:alignment===null?null:minimumAlignment,pass:gap<=CONTACT_TOLERANCE_MM+1e-7&&gap>=-1&&(alignment===null||alignment>=minimumAlignment),note};};
 const meshContact=(name,mesh)=>add(name,[lowest(mesh)]);
 meshContact('seat',bodyMesh(root));
 const core=[bodyMesh(root),bodyMesh(byId.waist.group)];
 const chest=bodyMesh(byId.torso.group),head=rig.headMesh;
 const facing=(mesh,axis)=>axis.applyQuaternion(mesh.getWorldQuaternion(new THREE.Quaternion())).dot(down);
 const lowerCore=core.sort((a,b)=>lowest(a)-lowest(b))[0];
 add('front-core',[lowest(lowerCore)],'Lower torso/pelvis surface proxy; no soft tissue or sit-bone landmark.',facing(lowerCore,new THREE.Vector3(0,0,1)),.5);
 add('back',[lowest(chest)],'Chest ellipsoid is an upper-back proxy.',facing(chest,new THREE.Vector3(0,0,-1)),.5);
 add('front-chest',[lowest(chest)],'',facing(chest,new THREE.Vector3(0,0,1)),.5);
 meshContact('head',head);add('back-head',[lowest(head)],'',facing(head,new THREE.Vector3(0,0,-1)),.5);
 for(const side of ['left','right']){
  const hand=hands[side],foot=feet[side];
  const palmGaps=[];for(const x of [-.018,.018])for(const y of [-.025,.025])palmGaps.push(hand.palm.localToWorld(new THREE.Vector3(x,y,-.015)).y-FLOOR_SKIN);
  add(side+'-palm',palmGaps,'Heel and finger-side palm patches; rounded corners and arch are not required to flatten.',facing(hand.wrist,new THREE.Vector3(0,0,-1)));
  const tips=hand.joints.filter(j=>!hand.joints.some(k=>k.finger===j.finger&&k.segment>j.segment));
  add(side+'-fingertip',[Math.min(...tips.map(j=>lowest(bodyMesh(j.group))))]);
  add(side+'-hand',[Math.min(...hand.meshes.map(lowest))]);
  const forearm=bodyMesh(byId[side+'Elbow'].group),shin=bodyMesh(byId[side+'Knee'].group),thigh=bodyMesh(byId[side+'Hip'].group);
  add(side+'-forearm',[-1,0,1].map(i=>capEnd(forearm,i)),'Full cylindrical contact, not only the elbow.');
  add(side+'-elbow',[capEnd(forearm,1)]);
  add(side+'-shin',[-1,0,1].map(i=>capEnd(shin,i)));
  add(side+'-knee',[Math.min(capEnd(shin,1),capEnd(thigh,-1))],'Regional capsule contact; the rig has no patella/soft-tissue landmark.');
  add(side+'-back-leg',[Math.min(lowest(thigh),lowest(shin))],'Leg-volume contact proxy.');
  const heel=foot.sole,ball=foot.meshes[2],toeMeshes=foot.meshes.slice(3);
  meshContact(side+'-heel',heel);meshContact(side+'-forefoot',ball);
  add(side+'-toe',[Math.min(...toeMeshes.map(lowest))]);
  add(side+'-sole',[lowest(heel),lowest(ball)],'Heel and metatarsal pads; the arch is deliberately excluded.',facing(foot.wrist,new THREE.Vector3(0,-1,0)));
  add(side+'-foot-top',[Math.min(...foot.meshes.map(lowest))],'Top-of-foot orientation plus contact; articulated dorsal surface is approximate.',facing(foot.wrist,new THREE.Vector3(0,1,0)),.5);
  add(side+'-foot-edge',[Math.min(...foot.meshes.map(lowest))],'Side-edge contact proxy.');
 }
 const bilateral={palms:'palm',forearms:'forearm',elbows:'elbow',shins:'shin',knees:'knee',soles:'sole',heels:'heel',forefeet:'forefoot',toes:'toe','foot-tops':'foot-top',fingertips:'fingertip'};
 const assess=name=>{
  if(name==='palms-or-forearms'||name==='head-or-chest'){
   const alternatives=(name==='palms-or-forearms'?['palms','forearms']:['head','front-chest']).map(assess);
   return {name,pass:alternatives.some(a=>a.pass),alternatives};
  }
  const names=bilateral[name]?['left-','right-'].map(side=>side+bilateral[name]):name.startsWith('any-')?['left-','right-'].map(side=>side+name.slice(4)):[name];
  const samples=names.map(n=>{if(!surfaces[n])throw new Error(`Unknown support ${n}`);return surfaces[n];});
  return {name,pass:name.startsWith('any-')?samples.some(s=>s.pass):samples.every(s=>s.pass),samples};
 };
 const profile=supportProfile(pose),requirements=profile.requirements.map(assess);
 return {profile,requirements,issues:requirements.filter(r=>!r.pass),surfaces,actualContactRegions:Object.values(surfaces).filter(s=>s.minGapMm<=CONTACT_TOLERANCE_MM).map(s=>s.name)};
}
export function inspectPose(rig,pose){return {supports:inspectSupports(rig,pose),rom:inspectJointRanges(rig.joints)};}
