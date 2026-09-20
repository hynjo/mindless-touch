import {SUPPORT_REQUIREMENTS} from './support-profiles.js';
import {POSE_CONTRACTS} from './pose-contracts.js';
import {normalizeContactSchedule} from './contact-schedule.js';
export const SEQUENCE_FORMAT='movement-sequence';
export const SEQUENCE_VERSION=1;
export const MAX_STEPS=200;
const plain=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
function fail(message){throw new Error(message);}
function number(value,min,max,label){if(!Number.isFinite(value)||value<min||value>max)fail(`${label} is invalid.`);return value;}
function vector(value,label){if(!Array.isArray(value)||value.length!==3)fail(`${label} must have three numbers.`);return value.map(v=>number(v,-1000,1000,label));}
function text(value,label,max=120){if(typeof value!=='string'||!value.trim()||value.length>max)fail(`${label} is invalid.`);return value.trim();}
export function validateSequence(input,{studio,dimensions,jointIds}) {
  let data=input;
  if(plain(data)&&!data.format&&[1,2,3,4].includes(data.version)&&plain(data.joints)) {
    if(data.units!=='meters'||data.rotationUnits!=='radians'||data.rotationOrder!=='XYZ')fail('Unsupported pose units.');
    const known=new Set(jointIds);
    if(Object.keys(data.joints).some(id=>!known.has(id)))fail('The pose contains an unknown joint.');
    for(const id of jointIds.filter(id=>id!=='waist'&&!/Thumb|Index|Middle|Ring|Little|Toe|FootArch/.test(id)))if(!data.joints[id])fail(`Missing joint: ${id}.`);
    data={format:SEQUENCE_FORMAT,version:SEQUENCE_VERSION,studio:data.studio||studio,dimensions:data.dimensions,name:'Imported pose',steps:[{id:'imported-pose',name:'Imported pose',holdSeconds:1.4,transitionSeconds:2.2,kind:'pose',pose:{rootPosition:data.rootPosition||[0,dimensions.pelvisHeight,0],rotations:Object.fromEntries(jointIds.map(id=>[id,data.joints[id]?.rotation||[0,0,0]])),poleContacts:data.poleContacts||{}}}]};
  }
  if(!plain(data)||data.format!==SEQUENCE_FORMAT||data.version!==SEQUENCE_VERSION)fail('This is not a supported Movement sequence file.');
  if(data.studio!==studio)fail(`Open ${data.studio==='pole'?'Pole':'Movement'} Studio to load this file.`);
  if(!plain(data.dimensions)||Object.entries(dimensions).some(([key,value])=>data.dimensions[key]!==value))fail('This file uses body dimensions that this editor does not support yet.');
  if(!Array.isArray(data.steps)||data.steps.length>MAX_STEPS)fail(`A sequence can contain up to ${MAX_STEPS} poses.`);
  const ids=new Set(),known=new Set(jointIds);
  const steps=data.steps.map((step,index)=>{
    if(!plain(step)||!plain(step.pose)||!plain(step.pose.rotations))fail(`Pose ${index+1} is invalid.`);
    const id=text(step.id,'Pose ID',100);if(ids.has(id))fail('Duplicate pose IDs.');ids.add(id);
    const supportRequirements=step.supportRequirements;
    if(step.poseContract!==undefined&&!Object.hasOwn(POSE_CONTRACTS,step.poseContract))fail('Unknown pose contract.');
    const contactSchedule=normalizeContactSchedule(step.contactSchedule);
    if(contactSchedule&&studio!=='movement')fail('Floor contact schedules are supported in Movement Studio only.');
    if(supportRequirements!==undefined&&(!Array.isArray(supportRequirements)||supportRequirements.length>12||supportRequirements.some(name=>!SUPPORT_REQUIREMENTS.has(name))))fail('Invalid support requirements.');
    const rotationKeys=Object.keys(step.pose.rotations);
    if(jointIds.some(key=>key!=='waist'&&!key.includes('Toe')&&!key.includes('FootArch')&&!rotationKeys.includes(key))||rotationKeys.some(key=>!known.has(key)))fail(`Pose ${index+1} has an incomplete or unknown skeleton.`);
    const rotations=Object.fromEntries(jointIds.map(key=>[key,vector((key==='waist'||key.includes('Toe')||key.includes('FootArch')) && step.pose.rotations[key]===undefined ? [0,0,0] : step.pose.rotations[key],key)]));
    const handOffsets={};
    if(step.pose.handOffsets!==undefined){
      if(!plain(step.pose.handOffsets))fail('Invalid hand support offsets.');
      for(const [side,value] of Object.entries(step.pose.handOffsets)){
        if(!['left','right'].includes(side))fail('Invalid hand support side.');
        const offset=vector(value,'Hand support offset');if(offset.some(v=>Math.abs(v)>.05))fail('Hand support offset is out of range.');handOffsets[side]=offset;
      }
    }
    const rootPosition=vector(step.pose.rootPosition,'Body position');
    if(rootPosition.some(v=>Math.abs(v)>20))fail('Body position is outside the supported editing area.');
    const contacts=step.pose.poleContacts??{};if(!plain(contacts))fail('Invalid pole contacts.');
    const poleContacts={};
    for(const [side,grip] of Object.entries(contacts)){
      if(!['left','right'].includes(side)||!plain(grip)||studio!=='pole')fail('Invalid pole contact.');
      poleContacts[side]={height:number(grip.height,.18,2.45,'Grip height'),angle:number(grip.angle,-1000,1000,'Grip angle'),radius:number(grip.radius,.03,.2,'Grip radius')};
    }
    if(step.floorSupport!==undefined&&!['palms','palms-knees','ground','forearms','knees-shins'].includes(step.floorSupport))fail('Unknown floor support.');
    let orbit;
    if(studio==='pole') {
      const fallback={angle:Math.atan2(rootPosition[0],rootPosition[2]),radius:Math.hypot(rootPosition[0],rootPosition[2])};
      if(step.orbit!==undefined&&!plain(step.orbit))fail('Invalid orbit.');
      orbit={angle:number((step.orbit||fallback).angle,-1000,1000,'Orbit angle'),radius:number((step.orbit||fallback).radius,0,20,'Orbit radius')};
      if(Math.abs(Math.sin(orbit.angle)*orbit.radius-rootPosition[0])>.001||Math.abs(Math.cos(orbit.angle)*orbit.radius-rootPosition[2])>.001)fail('Orbit does not match the saved body position.');
    }
    return {...(step.poseContract?{poseContract:step.poseContract}:{}),id,name:text(step.name,'Pose name'),kind:step.kind==='transition'?'transition':'pose',cue:typeof step.cue==='string'?step.cue.slice(0,120):'',holdSeconds:number(step.holdSeconds,0,120,'Hold time'),transitionSeconds:number(step.transitionSeconds,.05,120,'Transition time'),...(contactSchedule?{contactSchedule}:{}),...(supportRequirements?{supportRequirements:[...supportRequirements]}:{}),...(step.floorSupport?{floorSupport:step.floorSupport}:{}),...(orbit?{orbit}:{}),pose:{rootPosition,rotations,poleContacts,...(Object.keys(handOffsets).length?{handOffsets}:{})}};
  });
  return {format:SEQUENCE_FORMAT,version:SEQUENCE_VERSION,studio,dimensions:{...dimensions},name:text(data.name,'Sequence name'),steps};
}
export function serializeSequence(sequence,context){return JSON.stringify(validateSequence(sequence,context),null,2);}
export function parseSequence(source,context){let data;try{data=JSON.parse(source);}catch{fail('The file is not valid JSON.');}return validateSequence(data,context);}
