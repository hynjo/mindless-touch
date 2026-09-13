import {blendHandOffsets} from './hand-offsets.js';
import * as THREE from 'three';
import {createHandCollisionPairs} from './hand-collisions.js';
import {wristMargins} from './wrist-constraints.js';
import {capturePose,restorePose} from './pole-constraints.js';
// Closest distance between finite segments (including degenerate segments).
export function segmentDistance(a,b,c,d){
 const u=b.clone().sub(a),v=d.clone().sub(c),w=a.clone().sub(c);
 const A=u.dot(u),B=u.dot(v),C=v.dot(v),D=u.dot(w),E=v.dot(w),den=A*C-B*B;
 let s=A<1e-12?0:THREE.MathUtils.clamp(den>1e-12?(B*E-C*D)/den:0,0,1);
 let t=C<1e-12?0:(B*s+E)/C;
 if(t<0){t=0;s=A?THREE.MathUtils.clamp(-D/A,0,1):0;}else if(t>1){t=1;s=A?THREE.MathUtils.clamp((B-D)/A,0,1):0;}
 return w.addScaledVector(u,s).addScaledVector(v,-t).length();
}
export function createSelfConstraints({root,joints}){
 const bodies=[];
 for(const joint of joints){
  if(!/Shoulder|Elbow|Hip|Knee/.test(joint.id))continue;
  const mesh=joint.group.children.find(m=>m.isMesh&&m.geometry.type==='CapsuleGeometry');
  if(mesh)bodies.push({id:joint.id,mesh,side:joint.id.startsWith('left')?'left':'right',arm:/Shoulder|Elbow/.test(joint.id)});
 }
 const cores=joints.filter(j=>['torso','waist','pelvis'].includes(j.id)).map(j=>({id:j.id,mesh:j.group.children.find(m=>m.isMesh&&m.geometry.type==='SphereGeometry'&&!m.userData.joint),core:true})).filter(b=>b.mesh);
 const pairs=[];
 for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){
  const a=bodies[i],b=bodies[j];
  // Adjacent segments intentionally meet at elbows and knees.
  if(a.side===b.side&&a.arm===b.arm)continue;
  pairs.push([a,b]);
 }
 for(const body of bodies)for(const core of cores){if(/Elbow|Knee/.test(body.id))pairs.push([body,core]);}
 const handPairs=createHandCollisionPairs(joints,segmentDistance);
 const wrists=joints.filter(joint=>joint.id.endsWith('Wrist'));
 const capsule=({mesh})=>{const half=mesh.geometry.parameters.height/2;return {a:mesh.localToWorld(new THREE.Vector3(0,-half,0)),b:mesh.localToWorld(new THREE.Vector3(0,half,0)),r:mesh.geometry.parameters.radius};};
 function coreDistance(cap,body){
  const mesh=body.mesh,center=mesh.getWorldPosition(new THREE.Vector3()),inverse=mesh.getWorldQuaternion(new THREE.Quaternion()).invert(),scale=mesh.getWorldScale(new THREE.Vector3());
  scale.multiplyScalar(mesh.geometry.parameters.radius).addScalar(cap.r);
  const a=cap.a.clone().sub(center).applyQuaternion(inverse).divide(scale),b=cap.b.clone().sub(center).applyQuaternion(inverse).divide(scale),d=b.clone().sub(a);
  const t=d.lengthSq()?THREE.MathUtils.clamp(-a.dot(d)/d.lengthSq(),0,1):0;
  return (a.addScaledVector(d,t).length()-1)*Math.min(scale.x,scale.y,scale.z);
 }
 function distances(){root.updateWorldMatrix(true,true);const caps=new Map(bodies.map(body=>[body,capsule(body)]));return pairs.map(([a,b])=>{const x=caps.get(a);if(b.core)return coreDistance(x,b);const y=caps.get(b);return segmentDistance(x.a,x.b,y.a,y.b)-x.r-y.r;}).concat(handPairs.distances(),wrists.flatMap(joint=>wristMargins(joint).map(margin=>margin*.1)));}
 const pairNames=pairs.map(([a,b])=>({a:a.id,b:b.id})).concat(handPairs.pairs);
 let safe=capturePose(root,joints);
 let baseline=distances();
 let lastFailure=null;
 function sync(){safe=capturePose(root,joints);baseline=distances();}
 function contacts(minDepth=.001){return distances().slice(0,pairNames.length).flatMap((distance,i)=>distance< -minDepth?[{a:pairNames[i].a,b:pairNames[i].b,depth:-distance}]:[]);}
 function jointViolations(){return wrists.flatMap(joint=>wristMargins(joint).some(margin=>margin<-.0002)?[{id:joint.id}]:[]);}
 function commit(){
  lastFailure=null;
  const from=safe,to=capturePose(root,joints),original=baseline;
  const angle=Math.max(...from.rotations.map((q,i)=>q.angleTo(to.rotations[i])));
  const steps=Math.max(1,Math.ceil(angle*2/.008));
  const blend=t=>{blendHandOffsets(root,from.handOffsets,to.handOffsets,t);root.position.lerpVectors(from.position,to.position,t);joints.forEach(({group},i)=>group.quaternion.slerpQuaternions(from.rotations[i],to.rotations[i],t));};
  const valid=()=>distances().every((d,i)=>d>=Math.min(0,original[i])-(i<pairNames.length?.00001:1e-10));
  let accepted=0;
  for(let i=1;i<=steps;i++){
   const t=i/steps;blend(t);
   if(!valid()){
    const values=distances();
    const index=values.findIndex((d,i)=>d<Math.min(0,original[i])-(i<pairNames.length?.00001:1e-10));
    lastFailure=index<pairNames.length?{...pairNames[index],depth:-values[index]}:{joint:wrists[Math.floor((index-pairNames.length)/2)].id,axis:(index-pairNames.length)%2?'side tilt':'bend'};
    let low=accepted,high=t;
    for(let j=0;j<12;j++){const mid=(low+high)/2;blend(mid);if(valid())low=mid;else high=mid;}
    blend(low);sync();return false;
   }
   accepted=t;
  }
  restorePose(root,joints,to);sync();return true;
 }
 return {contacts,jointViolations,commit,sync,failure:()=>lastFailure,snapshot:()=>({safe,baseline:[...baseline]}),restore(state){safe=state.safe;baseline=[...state.baseline];}};
}
