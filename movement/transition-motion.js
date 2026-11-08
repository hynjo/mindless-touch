import * as T from 'three';
import {capturePose,restorePose} from './pole-constraints.js';
import {CONTACT_ANCHORS} from './contact-schedule.js';
import {SUPPORT_REQUIREMENTS} from './support-profiles.js';
import {interpolateTransferFrame,inspectTransferFrame} from './kneeling-transfer.js';

const allowedSupports=new Set([...CONTACT_ANCHORS,...SUPPORT_REQUIREMENTS]);
const cache=new WeakMap(),sides=['left','right'];
const fail=message=>{throw new Error(`Invalid transition motion: ${message}`);};
function pack(values){
 const bytes=new Uint8Array(values.length*4),view=new DataView(bytes.buffer);
 values.forEach((v,i)=>view.setFloat32(i*4,v,true));
 let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
 return btoa(binary);
}
function unpack(value,length){
 if(typeof value!=='string'||value.length>2_000_000||!/^[A-Za-z0-9+/]*={0,2}$/.test(value))fail('invalid samples.');
 let binary;try{binary=atob(value);}catch{fail('invalid sample encoding.');}
 if(binary.length!==length*4)fail('sample count does not match data.');
 const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0)),view=new DataView(bytes.buffer);
 return Float64Array.from({length},(_,i)=>view.getFloat32(i*4,true));
}
const offsets=f=>Object.fromEntries(sides.map(side=>[side,(f.handOffsets[side]||new T.Vector3()).toArray()]));
export function encodeTransitionMotion(joints,phases){
 const first=phases[0].frames[0];let base=first;
 const result={version:1,kind:'fold-kneel',start:{position:first.position.toArray(),rotations:Object.fromEntries(joints.map((j,i)=>[j.id,first.rotations[i].toArray()])),handOffsets:offsets(first)},phases:[]};
 for(const phase of phases){
  const indices=joints.map((_,i)=>i).filter(i=>phase.frames.some(f=>1-Math.abs(f.rotations[i].dot(base.rotations[i]))>1e-13));
  const values=phase.frames.flatMap(f=>[...f.position.toArray(),...sides.flatMap(side=>offsets(f)[side]),...indices.flatMap(i=>f.rotations[i].toArray())]);
  result.phases.push({name:phase.name,supportRequirements:[...phase.supportRequirements],joints:indices.map(i=>joints[i].id),samples:phase.frames.length,values:pack(values)});
  base=phase.frames.at(-1);
 }
 return result;
}
function vector(value,size,limit){
 if(!Array.isArray(value)||value.length!==size||value.some(v=>!Number.isFinite(v)||Math.abs(v)>limit))fail('invalid pose value.');
 if(size===4&&Math.abs(value.reduce((sum,v)=>sum+v*v,0)-1)>.0001)fail('rotation must be a unit quaternion.');
 return value;
}
export function compileTransitionMotion(motion,jointIds){
 const existing=cache.get(motion);if(existing&&existing.jointIds.join('|')===jointIds.join('|'))return existing;
 if(!motion||motion.version!==1||motion.kind!=='fold-kneel'||!motion.start||!Array.isArray(motion.phases)||!motion.phases.length||motion.phases.length>20)fail('unsupported format.');
 if(!motion.start.rotations||Object.keys(motion.start.rotations).length!==jointIds.length||jointIds.some(id=>!Object.hasOwn(motion.start.rotations,id)))fail('skeleton does not match.');
 const start={position:new T.Vector3().fromArray(vector(motion.start.position,3,20)),rotations:jointIds.map(id=>new T.Quaternion().fromArray(vector(motion.start.rotations[id],4,1.001)).normalize()),handOffsets:Object.fromEntries(sides.map(side=>[side,new T.Vector3().fromArray(vector(motion.start.handOffsets?.[side],3,.05))]))};
 let base=start,total=0;
 const phases=motion.phases.map(p=>{
  if(typeof p.name!=='string'||!p.name.trim()||p.name.length>120||!Array.isArray(p.supportRequirements)||!p.supportRequirements.length||p.supportRequirements.length>12||p.supportRequirements.some(s=>!allowedSupports.has(s)))fail('invalid phase.');
  if(!Array.isArray(p.joints)||new Set(p.joints).size!==p.joints.length||p.joints.some(id=>!jointIds.includes(id))||!Number.isInteger(p.samples)||p.samples<2||p.samples>241)fail('invalid tracks.');
  const stride=9+4*p.joints.length,values=unpack(p.values,stride*p.samples),indices=p.joints.map(id=>jointIds.indexOf(id));
  total+=p.samples;if(total>4820)fail('too many samples.');
  for(let i=0;i<p.samples;i++){
   const row=values.subarray(i*stride,(i+1)*stride);
   vector([...row.subarray(0,3)],3,20);vector([...row.subarray(3,6)],3,.05);vector([...row.subarray(6,9)],3,.05);
   for(let k=9;k<row.length;k+=4)vector([...row.subarray(k,k+4)],4,1.001);
  }
  const phase={name:p.name,supportRequirements:p.supportRequirements,values,indices,stride,samples:p.samples,base};
  const first=motionFrame(phase,0);if(!sameMotionFrame(first,base))fail('disconnected phases.');
  base=motionFrame(phase,p.samples-1);return phase;
 });
 const compiled={jointIds,start,end:base,phases,totalEdges:phases.reduce((n,p)=>n+p.samples-1,0)};cache.set(motion,compiled);return compiled;
}
export function normalizeTransitionMotion(motion,jointIds){
 if(motion===undefined)return undefined;
 compileTransitionMotion(motion,jointIds);
 return {version:motion.version,kind:motion.kind,start:structuredClone(motion.start),phases:motion.phases.map(p=>({name:p.name,supportRequirements:[...p.supportRequirements],joints:[...p.joints],samples:p.samples,values:p.values}))};
}
export function motionFrame(phase,index){
 const row=phase.values.subarray(index*phase.stride,(index+1)*phase.stride),rotations=phase.base.rotations.map(q=>q.clone());
 phase.indices.forEach((id,i)=>rotations[id].fromArray(row,9+i*4).normalize());
 return {position:new T.Vector3().fromArray(row),rotations,handOffsets:{left:new T.Vector3().fromArray(row,3),right:new T.Vector3().fromArray(row,6)}};
}
export function sameMotionFrame(a,b){
 return a.position.distanceTo(b.position)<1e-5&&a.rotations.length===b.rotations.length&&a.rotations.every((q,i)=>1-Math.abs(q.dot(b.rotations[i]))<1e-10)&&sides.every(side=>(a.handOffsets[side]||new T.Vector3()).distanceTo(b.handOffsets[side]||new T.Vector3())<1e-6);
}
export function sampleTransitionMotion(rig,motion,progress){
 let edge=T.MathUtils.clamp(progress,0,1)*motion.totalEdges;
 for(let i=0;i<motion.phases.length;i++){
  const p=motion.phases[i],last=i===motion.phases.length-1;
  if(edge<p.samples-1||last){const index=Math.min(p.samples-2,Math.floor(edge)),mix=Math.min(1,edge-index);interpolateTransferFrame(rig,motionFrame(p,index),motionFrame(p,index+1),mix);return p.supportRequirements;}
  edge-=p.samples-1;
 }
}
// Walk every skipped sample, including phase boundaries, before displaying a
// later frame. A fast playback tick must not turn a curved path into one chord.
export function replayTransitionMotion(rig,self,motion,fromProgress,toProgress){
 const from=T.MathUtils.clamp(fromProgress,0,1)*motion.totalEdges*4,to=T.MathUtils.clamp(toProgress,0,1)*motion.totalEdges*4;
 if(to<from)return {reason:'motion-clock'};
 for(let tick=Math.floor(from)+1;tick<=Math.ceil(to);tick++){
  const progress=Math.min(tick,to)/(motion.totalEdges*4),requirements=sampleTransitionMotion(rig,motion,progress);
  const failure=inspectTransferFrame(rig,self,requirements);if(failure)return failure;
  if(!self.commit())return {reason:'swept-collision',detail:self.failure()};
 }
 // Includes paused/initial calls where no quarter-sample was advanced.
 const requirements=sampleTransitionMotion(rig,motion,toProgress);
 return inspectTransferFrame(rig,self,requirements);
}
export function validateTransitionMotion(rig,self,motion){
 const saved=capturePose(rig.root,rig.joints),safe=self.snapshot();
 try{
  restorePose(rig.root,rig.joints,motion.start);self.sync();
  const initial=inspectTransferFrame(rig,self,motion.phases[0].supportRequirements);
  return initial||replayTransitionMotion(rig,self,motion,0,1);
 }finally{restorePose(rig.root,rig.joints,saved);self.restore(safe);}
}
