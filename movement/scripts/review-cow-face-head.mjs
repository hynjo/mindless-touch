import * as T from 'three';
import {writeFile} from 'node:fs/promises';
import {createBody} from '../body.js';
import {cowFaceCorrection as pose} from '../cow-face-correction.js';
import {createSelfConstraints} from '../self-constraints.js';
import {inspectJointRanges} from '../pose-validation.js';
import {inspectPoseForm} from '../pose-contracts.js';
const material=new T.MeshStandardMaterial(),dimensions={pelvisHeight:.97,torso:.48,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43};
const rig=createBody({scene:new T.Scene(),dimensions,bodyMaterial:material,jointMaterial:material});
rig.byId=Object.fromEntries(rig.joints.map(j=>[j.id,j]));rig.root.position.fromArray(pose.rootPosition);
for(const j of rig.joints)j.group.rotation.set(...(pose.rotations[j.id]||[0,0,0]).map(T.MathUtils.degToRad));
const self=createSelfConstraints(rig),ids=['leftShoulder','leftElbow','leftWrist'];
const original=ids.flatMap(id=>pose.rotations[id]);
function measure(v){
 ids.forEach((id,i)=>rig.byId[id].group.rotation.set(...v.slice(i*3,i*3+3).map(T.MathUtils.degToRad)));
 const contacts=self.contacts(0),external=self.externalContacts(1e-9),rom=inspectJointRanges(rig.joints).issues,form=inspectPoseForm(rig,pose).issues;
 const cost=[...contacts,...external].reduce((n,c)=>n+c.depth*1e6,0)+rom.reduce((n,r)=>n+r.excessDegrees*1000,0)+form.length*1000+self.jointViolations().length*1000+v.reduce((n,a,i)=>n+(a-original[i])**2*.001,0);
 return {cost,contacts,external,rom,form};
}
console.log('Before',JSON.stringify(measure(original)));
let state=73;const random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296);
let best={cost:Infinity};
for(let restart=0;restart<12;restart++){
 let v=original.map((a,i)=>a+(restart&&![4,5].includes(i)?(random()-.5)*50:0)),r=measure(v);
 for(let i=0;i<1500;i++){
  const w=[...v],axis=[0,1,2,3,6,7,8][Math.floor(random()*7)];w[axis]+=(random()-.5)*(i>1000?2:12);
  const next=measure(w);if(next.cost<r.cost){v=w;r=next;}
  if(r.cost<best.cost)best={...r,angles:v};
 }
 if(best.cost<20&&!best.contacts.length&&!best.external.length&&!best.rom.length&&!best.form.length)break;
}
await writeFile('/tmp/cow-face-head-candidate.json',JSON.stringify(best,null,2));console.log(JSON.stringify(best));
