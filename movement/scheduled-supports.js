import {CONTACT_ANCHORS,sampleContactSchedule,validateContactScheduleEndpoints} from './contact-schedule.js';
import {inspectPose,inspectSupports,evaluateSupportRequirements} from './pose-validation.js';
import {capturePose,restorePose} from './pole-constraints.js';

// Validate both authored hold endpoints before playback. This deliberately does
// not synthesize motion or lock contacts in world space.
export function inspectScheduledHolds(rig,steps,frames){
 const saved=capturePose(rig.root,rig.joints),issues=[];
 try{
  for(const [index,step] of steps.entries()){
   if(step.poseContract&&frames[index]){
    restorePose(rig.root,rig.joints,frames[index]);
    const result=inspectPose(rig,step),failures=[...result.supports.issues,...result.form.issues,...result.rom.issues];
    if(failures.length)issues.push({index,reason:`Hold violates ${step.poseContract}: ${failures.map(r=>r.name||r.joint).join(', ')}.`});
   }
   if(!step.contactSchedule)continue;
   if(!frames[index+1]){issues.push({index,reason:'A contact schedule needs a following pose.'});continue;}
   const states=[sampleContactSchedule(step.contactSchedule,0),sampleContactSchedule(step.contactSchedule,1)];
   for(const [endpoint,state] of states.entries()){
    const target=steps[index+endpoint],declared=new Set(state.requiredAnchors);
    const surfaces=Object.fromEntries(CONTACT_ANCHORS.map(name=>[name,{name,pass:declared.has(name)}]));
    // Relation/clearance requirements are checked on the actual hold geometry,
    // not treated as floor anchors to maintain throughout a transition.
    const relationNames=new Set(['both-toe-grips','archer-leg-support','crow-knees-on-arms','legs-airborne']);
    const missingIntent=evaluateSupportRequirements(surfaces,(target.supportRequirements||[]).filter(name=>!relationNames.has(name))).filter(requirement=>!requirement.pass);
    if(missingIntent.length)issues.push({index,reason:`${endpoint?'End':'Start'} schedule omits required hold supports: ${missingIntent.map(r=>r.name).join(', ')}.`});
    restorePose(rig.root,rig.joints,frames[index+endpoint]);
    const missing=inspectSupports(rig,{supportRequirements:state.requiredAnchors}).issues;
    if(missing.length)issues.push({index,reason:`${endpoint?'End':'Start'} contact is not satisfied: ${missing.map(r=>r.name).join(', ')}.`});
   }
   const next=steps[index+1].contactSchedule;
   if(next){
    const nextStart=sampleContactSchedule(next,0).requiredAnchors;
    try{validateContactScheduleEndpoints(step.contactSchedule,{startAnchors:states[0].requiredAnchors,endAnchors:nextStart});}
    catch{issues.push({index,reason:'Adjacent contact schedules disagree on their shared hold.'});}
   }
  }
 }finally{restorePose(rig.root,rig.joints,saved);rig.root.updateWorldMatrix(true,true);}
 return issues;
}
