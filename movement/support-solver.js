import {inspectPoseForm} from './pose-contracts.js';
import {capturePose,restorePose} from './pole-constraints.js';
import {floorClearance,FLOOR_SKIN} from './floor-constraints.js';
import {inspectSupports,inspectJointRanges} from './pose-validation.js';
import {createSelfConstraints} from './self-constraints.js';

// Conservative local projection, not a general anatomy/force solver. Every
// required contact is checked together; unsupported families fail transactionally.
export function projectSupportPose(rig,pose,{maxPasses=16}={}) {
 const saved=capturePose(rig.root,rig.joints),self=rig.self||createSelfConstraints(rig);
 const preservedContacts=new Set();
 const inspect=()=>{
  rig.root.updateWorldMatrix(true,true);
  return {form:inspectPoseForm(rig,pose),supports:inspectSupports(rig,pose),rom:inspectJointRanges(rig.joints),
   clearance:Math.min(...rig.meshes.map(floorClearance)),contacts:self.contacts(),wristIssues:self.jointViolations()};
 };
 const valid=r=>!r.form.issues.length&&!r.supports.issues.length&&!r.rom.issues.length&&!r.contacts.length&&!r.wristIssues.length&&r.clearance>=FLOOR_SKIN-.00002&&[...preservedContacts].every(name=>r.supports.surfaces[name]?.pass);
 let before;
 try {
  before=inspect();
  // Preserve the actual contact side and every already-passing OR branch, not
  // just the aggregate requirement. A left-hand support may not silently become
  // right-hand support, and palms may not turn into forearms during projection.
  const preserve=r=>{
   if(r.alternatives)r.alternatives.filter(a=>a.pass).forEach(preserve);
   else for(const sample of r.samples)if(sample.pass)preservedContacts.add(sample.name);
  };
  before.supports.requirements.forEach(preserve);
  if(valid(before))return {accepted:true,changed:false,reason:'already-supported',before,after:before};
  const required=before.supports.requirements.find(r=>r.name==='soles'||r.name==='any-sole');
  if(!required)return {accepted:false,changed:false,reason:'unsupported-support-family',before,after:before};
  const sides=required.name==='soles'?['left','right']:[['left','right'].sort((a,b)=>before.supports.surfaces[a+'-sole'].gapMm-before.supports.surfaces[b+'-sole'].gapMm)[0]];
  const variables=[{object:rig.root.position,key:'y',step:.025,bound:.15}];
  for(const side of sides)for(const [joint,axes] of [['Hip',['x','z']],['Knee',['x']],['Ankle',['x','z']]])for(const key of axes)variables.push({object:rig.byId[side+joint].group.rotation,key,step:.06,bound:.35});
  const origins=variables.map(v=>v.object[v.key]);
  // The lifted leg's local rotations are never variables. Penalize displacement
  // from the authored pose, but never trade a required contact for that penalty.
  const requirementCost=r=>r.alternatives?Math.min(...r.alternatives.map(requirementCost)):(r.name.startsWith('any-')?Math.min(...r.samples.map(sampleCost)):r.samples.reduce((n,s)=>n+sampleCost(s),0));
  const sampleCost=s=>Math.max(0,s.gapMm-2,-s.minGapMm)**2+Math.max(0,(s.minimumAlignment??0)-(s.alignment??1))**2*1e5;
  const cost=()=>{
   rig.root.updateWorldMatrix(true,true);
   const supports=inspectSupports(rig,pose),rom=inspectJointRanges(rig.joints);
   const penetration=Math.max(0,FLOOR_SKIN-Math.min(...rig.meshes.map(floorClearance)))*1000;
   return supports.requirements.reduce((n,r)=>n+requirementCost(r),0)+[...preservedContacts].reduce((n,name)=>n+sampleCost(supports.surfaces[name]),0)+sides.reduce((n,s)=>n+sampleCost(supports.surfaces[s+'-sole']),0)+penetration**2*20+
    rom.issues.reduce((n,r)=>n+r.excessDegrees**2*100,0)+variables.reduce((n,v,i)=>n+(v.object[v.key]-origins[i])**2,0);
  };
  // First try the smallest rigid vertical translation. It preserves every joint
  // and all relative contact geometry, and repairs merely elevated poses exactly.
  rig.root.position.y+=Math.max(-.15,Math.min(.15,FLOOR_SKIN-before.clearance));
  let after=inspect();
  if(valid(after))return {accepted:true,changed:true,reason:'projected',before,after};
  restorePose(rig.root,rig.joints,saved);
  let best=cost();
  for(let pass=0;pass<Math.max(0,Math.min(64,maxPasses));pass++){
   let improved=false;
   for(const [index,v] of variables.entries()){
    const initial=v.object[v.key];let value=initial;
    for(const sign of [-1,1]){v.object[v.key]=Math.max(origins[index]-v.bound,Math.min(origins[index]+v.bound,initial+sign*v.step));const candidate=cost();if(candidate<best-1e-8){best=candidate;value=v.object[v.key];improved=true;}}
    v.object[v.key]=value;
   }
   after=inspect();
   if(valid(after)&&sides.every(s=>after.supports.surfaces[s+'-sole'].pass))return {accepted:true,changed:true,reason:'projected',before,after};
   if(!improved)for(const v of variables)v.step*=.5;
  }
  const attempted=inspect();restorePose(rig.root,rig.joints,saved);rig.root.updateWorldMatrix(true,true);
  return {accepted:false,changed:false,reason:'constraints-unsatisfied',before,after:inspect(),attempted};
 } catch(error) {
  restorePose(rig.root,rig.joints,saved);rig.root.updateWorldMatrix(true,true);
  throw error;
 }
}
