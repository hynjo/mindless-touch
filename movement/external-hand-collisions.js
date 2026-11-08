import * as THREE from 'three';
import {boxDistance} from './hand-collisions.js';

// Offline diagnostics, deliberately independent of the runtime self constraints.
// Units are metres. Negative means overlap of the stated proxy, not necessarily
// rendered triangles. Fingers include their proximal spherical knuckle; palms
// use the enclosing box (rounded/tapered palm corners can yield false positives).
// Body spheres with nonuniform scale are ellipsoids. Core tests are conservative:
// capsule/core uses a lower distance bound; palm/core uses support separation on
// a finite axis set. Their negative depths are proxies, not penetration distances.
// Assumes the rig's positive scales and rotation-only joint hierarchy (no shear).
const axes = [new THREE.Vector3(1,0,0),new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,1)];
const clamp = THREE.MathUtils.clamp;
function segmentDistance(a,b,c,d){
 const u=b.clone().sub(a),v=d.clone().sub(c),w=a.clone().sub(c);
 const A=u.dot(u),B=u.dot(v),C=v.dot(v),D=u.dot(w),E=v.dot(w),den=A*C-B*B;
 let s=A<1e-12?0:clamp(den>1e-12?(B*E-C*D)/den:0,0,1);
 let t=C<1e-12?0:(B*s+E)/C;
 if(t<0){t=0;s=A?clamp(-D/A,0,1):0;}else if(t>1){t=1;s=A?clamp((B-D)/A,0,1):0;}
 return w.addScaledVector(u,s).addScaledVector(v,-t).length();
}
function geometry(body){
 const {mesh}=body,scale=mesh.getWorldScale(new THREE.Vector3()),q=mesh.getWorldQuaternion(new THREE.Quaternion());
 if(body.type==='capsule'){
  const r=mesh.geometry.parameters.radius*Math.max(scale.x,scale.y,scale.z);
  const a=body.joint.group.getWorldPosition(new THREE.Vector3());
  const b=mesh.localToWorld(new THREE.Vector3(0,-mesh.geometry.parameters.height/2,0));
  return {type:body.type,a,b,r,center:a.clone().add(b).multiplyScalar(.5),bound:a.distanceTo(b)/2+r};
 }
 const half=body.type==='box'?new THREE.Vector3(...mesh.userData.boxHalfExtents).multiply(scale):scale.multiplyScalar(mesh.geometry.parameters.radius);
 return {type:body.type,center:mesh.getWorldPosition(new THREE.Vector3()),half,axes:axes.map(a=>a.clone().applyQuaternion(q)),inverse:q.clone().invert(),bound:body.type==='box'?half.length():Math.max(half.x,half.y,half.z)};
}
function capsuleBox(c,b){
 const local=p=>p.clone().sub(b.center).applyQuaternion(b.inverse);
 // Exact overlap sign for the capsule/box proxies; interior depth caps at r.
 return boxDistance(local(c.a),local(c.b),b.half.toArray())-c.r;
}
function capsuleCore(c,b){
 const local=p=>p.clone().sub(b.center).applyQuaternion(b.inverse).divide(b.half);
 const a=local(c.a),d=local(c.b).sub(a);
 const t=d.lengthSq()?clamp(-a.dot(d)/d.lengthSq(),0,1):0;
 // minAxis*(norm-1) is a lower bound on exterior ellipsoid distance.
 // Inside it preserves overlap sign but is only a depth proxy.
 return (a.addScaledVector(d,t).length()-1)*Math.min(b.half.x,b.half.y,b.half.z)-c.r;
}
function support(body,axis){
 const p=body.axes.map((a,i)=>a.dot(axis)*body.half.getComponent(i));
 return body.type==='box'?p.reduce((sum,x)=>sum+Math.abs(x),0):Math.hypot(...p);
}
function supportDistance(a,b){
 const delta=b.center.clone().sub(a.center),directions=[...a.axes,...b.axes,delta];
 for(const x of a.axes)for(const y of b.axes)directions.push(x.clone().cross(y));
 let result=-Infinity;
 for(const direction of directions){
  if(direction.lengthSq()<1e-16)continue;
  const n=direction.clone().normalize();
  result=Math.max(result,Math.abs(delta.dot(n))-support(a,n)-support(b,n));
 }
 // Complete SAT for two boxes; conservative finite-axis test for ellipsoids.
 return result;
}
export function createExternalHandCollisionPairs({root,joints}){
 const fingers=[],palms=[],cores=[],entries=[],pairs=[];
 for(const joint of joints){
  if(joint.isFinger){
   const mesh=joint.group.children.find(m=>m.geometry?.type==='CapsuleGeometry');
   if(mesh)fingers.push({id:joint.id,side:joint.side,joint,mesh,type:'capsule'});
  }
  if(/Wrist$/.test(joint.id)){
   joint.group.traverse(mesh=>{if(mesh.userData.boxHalfExtents)palms.push({id:joint.id.replace('Wrist','Palm'),side:joint.id.startsWith('left')?'left':'right',mesh,type:'box'});});
  }
  if(['pelvis','waist','torso','neck','head'].includes(joint.id)){
   const mesh=joint.group.children.find(m=>m.geometry?.type==='SphereGeometry'&&!m.userData.joint);
   if(mesh)cores.push({id:joint.id==='neck'?'head':joint.id,mesh,type:'ellipsoid'});
  }
 }
 function add(a,b,kind,geometryName){
  entries.push([a,b]);pairs.push({a:a.id,b:b.id,kind,geometry:geometryName,approximate:a.type!=='capsule'||b.type!=='capsule'});
 }
 for(let i=0;i<fingers.length;i++)for(let j=i+1;j<fingers.length;j++)if(fingers[i].side!==fingers[j].side)add(fingers[i],fingers[j],'opposite-fingers','capsule-capsule');
 for(const finger of fingers)for(const palm of palms)if(finger.side!==palm.side)add(finger,palm,'finger-opposite-palm','capsule-enclosing-palm-box');
 for(let i=0;i<palms.length;i++)for(let j=i+1;j<palms.length;j++)if(palms[i].side!==palms[j].side)add(palms[i],palms[j],'palm-palm','enclosing-palm-box-SAT');
 for(const finger of fingers)for(const core of cores)add(finger,core,'finger-core','capsule-ellipsoid-lower-bound');
 for(const palm of palms)for(const core of cores)add(palm,core,'palm-core','palm-box-ellipsoid-support-bound');
 return {pairs,distances(){
  root.updateWorldMatrix(true,true);
  const shapes=new Map([...fingers,...palms,...cores].map(body=>[body,geometry(body)]));
  return entries.map(([a,b])=>{
   const x=shapes.get(a),y=shapes.get(b);
   const gap=x.center.distanceTo(y.center)-x.bound-y.bound;
   // Far pairs need only a positive separation certificate, not exact clearance.
   if(gap>.02)return gap;
   if(x.type==='capsule'&&y.type==='capsule')return segmentDistance(x.a,x.b,y.a,y.b)-x.r-y.r;
   if(x.type==='capsule')return y.type==='box'?capsuleBox(x,y):capsuleCore(x,y);
   return supportDistance(x,y);
  });
 }};
}
