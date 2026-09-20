import {applyHandOffsets} from './hand-offsets.js';
import {capturePose,restorePose} from './pole-constraints.js';
import {placeHandsAndKnees,placePalmsOnFloor,palmsAreSupported} from './palm-support.js';
import {inspectPose} from './pose-validation.js';
import {floorClearance,FLOOR_SKIN} from './floor-constraints.js';
import {createSelfConstraints} from './self-constraints.js';

// UI, audit and regression fixtures use the same authored/serialized application.
export function applyPose(rig,step,{floor,pole,attachPole=()=>{}}={}) {
 const data=step.pose||step;
 applyHandOffsets(rig.root,data.handOffsets);
 rig.root.position.fromArray(data.rootPosition);
 for(const {id,group} of rig.joints)group.rotation.set(...(data.rotations[id]||[0,0,0]).map(n=>step.pose?n:n*Math.PI/180));
 rig.root.updateWorldMatrix(true,true);
 const authored=capturePose(rig.root,rig.joints);
 if(step.pose){
  if(pole)pole.restore({pose:authored,safe:authored,grips:Object.entries(data.poleContacts||{})});
  else floor?.restore({pose:authored,safe:authored});
  return step.poseContract?inspectPose(rig,step):null;
 }
 if(pole){pole.settle();attachPole(step);return null;}
 const before=step.poseContract?inspectPose(rig,step):null;
 const preserved=[];
 const collect=r=>{if(r.alternatives)r.alternatives.filter(a=>a.pass).forEach(collect);else r.samples.filter(s=>s.pass).forEach(s=>preserved.push(s.name));};
 before?.supports.requirements.forEach(collect);
 try {
  if(step.floorSupport==='palms-knees')placeHandsAndKnees(rig);
  else if(palmsAreSupported(step))placePalmsOnFloor(rig);
  floor?.settle();rig.root.updateWorldMatrix(true,true);
  if(!before)return null;
  const after=inspectPose(rig,step),self=rig.self||createSelfConstraints(rig);
  const accepted=!after.supports.issues.length&&!after.rom.issues.length&&!after.form.issues.length&&!self.contacts().length&&!self.jointViolations().length&&rig.meshes.every(m=>floorClearance(m)>=FLOOR_SKIN-.00002)&&preserved.every(n=>after.supports.surfaces[n]?.pass);
  if(!accepted){restorePose(rig.root,rig.joints,authored);floor?.restore({pose:authored,safe:authored});}
  return {accepted,before,after:accepted?after:inspectPose(rig,step),attempted:after};
 } catch(error){restorePose(rig.root,rig.joints,authored);floor?.restore({pose:authored,safe:authored});throw error;}
}
