import {applyPose} from './apply-pose.js';
import {capturePose,restorePose} from './pole-constraints.js';
import {blendHandOffsets} from './hand-offsets.js';
import {createFloorConstraints} from './floor-constraints.js';
import {createSelfConstraints} from './self-constraints.js';
import {inspectJointRanges} from './pose-validation.js';
import {changesFootSupport,inspectTransitionSupports} from './transition-supports.js';
import {placeHandsAndKnees,placePalmsOnFloor,preparePalmLanding,palmsAreSupported} from './palm-support.js';
import {supportProfile} from './support-profiles.js';
import {solveFloorEntry} from './floor-entry-solver.js';
import {solveKneelingTransfer} from './kneeling-transfer.js';
import {encodeTransitionMotion,compileTransitionMotion,validateTransitionMotion} from './transition-motion.js';
export function planSupportedRoute(rig,from,to,candidates=[]){
 const saved=capturePose(rig.root,rig.joints),floor=createFloorConstraints(rig),self=createSelfConstraints(rig),attempts=[];
 const frame=step=>{applyPose(rig,step,{floor});return capturePose(rig.root,rig.joints);};
 function inspect(a,b,mix){
  const support=inspectTransitionSupports(rig,a,b,mix);
  if(!support.evaluated||!support.pass)return 'support';
  if(inspectJointRanges(rig.joints).issues.length)return 'joint-range';
  if(self.jointViolations().length)return 'wrist';
  if(self.contacts(0).length||self.externalContacts(1e-9).length)return 'collision';
  if(floor.clearance()<.00068)return 'floor';
  return null;
 }
 function edge(a,b){
  if(a.contactSchedule)return {reason:'authored-schedule',progress:0};
  const start=frame(a),end=frame(b);restorePose(rig.root,rig.joints,start);self.sync();
  for(let i=0;i<=264;i++){
   const progress=i/264,mix=progress*progress*(3-2*progress);
   blendHandOffsets(rig.root,start.handOffsets,end.handOffsets,mix);rig.root.position.lerpVectors(start.position,end.position,mix);
   rig.joints.forEach((j,k)=>j.group.quaternion.slerpQuaternions(start.rotations[k],end.rotations[k],mix));
   if(a.floorSupport==='palms-knees'&&b.floorSupport==='palms-knees')placeHandsAndKnees(rig);
   else if(palmsAreSupported(a)&&palmsAreSupported(b))placePalmsOnFloor(rig,{constrainAnkles:changesFootSupport(a,b)});
   else if(palmsAreSupported(a)||palmsAreSupported(b))preparePalmLanding(rig);
   if((a.floorSupport&&b.floorSupport)||floor.clearance()<.0007)floor.settle();
   const reason=inspect(a,b,mix);if(reason)return {reason,progress};
   if(!self.commit())return {reason:'swept-collision',progress,detail:self.failure()};
  }
  return null;
 }
 function stored(p){
  frame(p);return {id:`route-${p.id}`,name:p.name,kind:'transition',holdSeconds:.5,transitionSeconds:2.2,
   supportRequirements:[...supportProfile(p).requirements],...(p.floorSupport?{floorSupport:p.floorSupport}:{}),
   pose:{rootPosition:rig.root.position.toArray(),rotations:Object.fromEntries(rig.joints.map(j=>[j.id,j.group.rotation.toArray().slice(0,3)])),handOffsets:Object.fromEntries(Object.entries(capturePose(rig.root,rig.joints).handOffsets).map(([k,v])=>[k,v.toArray()])),poleContacts:{}}};
 }
 try{
  // One intermediate pose is a deliberate bounded MVP, not a general graph solver.
  for(const p of candidates.slice(0,6)){
   const middle=stored(p),first=edge(from,middle),failure=first||edge(middle,to);
   attempts.push({poseId:p.id,via:p.name,failedLeg:first?0:failure?1:null,failure});
   if(!failure)return {status:'candidate',steps:[middle],attempts,validation:'sampled-contact-and-collision-v1'};
  }
  let partial;
  const reverse=from.name==='Cow'&&to.name==='Big Toe';
  if(!from.contactSchedule&&!to.contactSchedule&&((from.name==='Big Toe'&&to.name==='Cow')||reverse)){
   const cow=frame(reverse?from:to);frame(reverse?to:from);const r=solveFloorEntry(rig);
   partial={stage:r.stage,success:r.success,attempts:r.attempts.length};
   if(r.success){
    restorePose(rig.root,rig.joints,r.frames.at(-1));const transfer=solveKneelingTransfer(rig,cow);
    if(transfer.success){
     let phases=[{name:'Plant palms',supportRequirements:['soles'],frames:r.frames},...transfer.phases];
     if(reverse){
      const names={'Finish Cow':'Prepare to rise','Lower feet':'Lift feet','Untuck feet':'Tuck feet','Lift feet':'Lower toes','Lower knees':'Lift knees','Plant palms':'Release palms'};
      phases=phases.reverse().map(p=>({...p,name:names[p.name]||p.name.replace(' foot back',' foot forward').replace('Place ','Adjust '),frames:[...p.frames].reverse()}));
     }
     const motion=encodeTransitionMotion(rig.joints,phases),compiled=compileTransitionMotion(motion,rig.joints.map(j=>j.id));
     const failure=validateTransitionMotion(rig,self,compiled);
     if(!failure)return {status:'candidate',steps:[],motion,transitionSeconds:phases.length*1.2,attempts,strategy:'contact-transfer',validation:'sampled-contact-and-collision-v2'};
     partial={...partial,stage:'encoded-motion',failure};
    }else partial={...partial,stage:transfer.failure.stage,failure:transfer.failure};
   }
  }
  return {status:'no-route',attempts,partial};
 }finally{restorePose(rig.root,rig.joints,saved);}
}
