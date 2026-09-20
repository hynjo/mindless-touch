import * as THREE from 'three';
import {segmentDistance} from './self-constraints.js';
import {boxDistance} from './hand-collisions.js';

function capsule(mesh){
 const half=(mesh.geometry.parameters.height||0)/2,r=mesh.geometry.parameters.radius;
 return {a:mesh.localToWorld(new THREE.Vector3(0,-half,0)),b:mesh.localToWorld(new THREE.Vector3(0,half,0)),r:r*mesh.getWorldScale(new THREE.Vector3()).x};
}
const capsuleMesh=joint=>joint.group.children.find(m=>m.geometry?.type==='CapsuleGeometry');
const gap=(a,b)=>segmentDistance(a.a,a.b,b.a,b.b)-a.r-b.r;
function pointEllipsoid(point,mesh){
 const scale=mesh.getWorldScale(new THREE.Vector3()).multiplyScalar(mesh.geometry.parameters.radius);
 const p=point.clone().sub(mesh.getWorldPosition(new THREE.Vector3())).applyQuaternion(mesh.getWorldQuaternion(new THREE.Quaternion()).invert()).toArray();
 const axes=scale.toArray(),squared=axes.map(a=>a*a),norm=p.reduce((s,x,i)=>s+x*x/squared[i],0);
 if(norm<=1)return (Math.sqrt(norm)-1)*Math.min(...axes);
 let lo=0,hi=Math.max(...axes)*Math.hypot(...p);
 for(let i=0;i<30;i++){const t=(lo+hi)/2;if(p.reduce((s,x,i)=>s+squared[i]*x*x/(t+squared[i])**2,0)>1)lo=t;else hi=t;}
 const t=(lo+hi)/2;return Math.hypot(...p.map((x,i)=>x*t/(t+squared[i])));
}
function capEllipsoid(cap,mesh){
 const at=t=>pointEllipsoid(cap.a.clone().lerp(cap.b,t),mesh);
 let lo=0,hi=1;for(let i=0;i<24;i++){const a=lo+(hi-lo)/3,b=hi-(hi-lo)/3;if(at(a)<at(b))hi=b;else lo=a;}
 return Math.min(at(0),at(1),at((lo+hi)/2))-cap.r;
}
function boxEllipsoid(box,ellipsoid){
 const transform=ellipsoid.matrixWorld.clone().invert().multiply(box.matrixWorld);
 const radius=ellipsoid.geometry.parameters.radius;
 const columns=[0,1,2].map(i=>new THREE.Vector3().setFromMatrixColumn(transform,i).divideScalar(radius));
 const residual=new THREE.Vector3().setFromMatrixPosition(transform).divideScalar(radius),x=[0,0,0],bounds=box.userData.boxHalfExtents;
 // Minimize the ellipsoid quadratic over the palm's enclosing oriented box.
 for(let pass=0;pass<64;pass++)for(let i=0;i<3;i++){
  const next=THREE.MathUtils.clamp(x[i]-columns[i].dot(residual)/columns[i].lengthSq(),-bounds[i],bounds[i]);
  residual.addScaledVector(columns[i],next-x[i]);x[i]=next;
 }
 return (residual.length()-1)*radius*Math.min(...ellipsoid.getWorldScale(new THREE.Vector3()).toArray());
}

// Scoped to hand/foot geometry at authored binds. Palms use their enclosing
// boxes; finger capsules/knuckles and toe capsules use their actual primitives.
export function handFootContacts({root,hands,feet},tolerance=.0005){
 root.updateWorldMatrix(true,true);const contacts=[];
 for(const [handSide,hand] of Object.entries(hands))for(const [footSide,foot] of Object.entries(feet)){
  for(const h of hand.meshes.filter(m=>!m.userData.handNail))for(const f of foot.meshes){
   const hb=new THREE.Box3().setFromObject(h),fb=new THREE.Box3().setFromObject(f);if(!hb.intersectsBox(fb))continue;
   let distance;
   if(h.userData.boxHalfExtents){
    if(f.geometry.type==='SphereGeometry')distance=boxEllipsoid(h,f);
    else {const c=capsule(f);distance=boxDistance(h.worldToLocal(c.a),h.worldToLocal(c.b),h.userData.boxHalfExtents)-c.r;}
   }else{const a=capsule(h);distance=f.geometry.type==='CapsuleGeometry'?gap(a,capsule(f)):capEllipsoid(a,f);}
   if(distance< -tolerance)contacts.push({hand:handSide,foot:footSide,part:h.userData.fingerJoint?.id||'palm',depth:-distance});
  }
 }
 return contacts;
}

export function inspectToeGrips(rig){
 const {root,hands,feet}=rig;root.updateWorldMatrix(true,true);
 const samples=['left','right'].map(side=>{
  const toe=feet[side].joints.filter(j=>j.id.includes('ToeBig')).map(j=>capsule(capsuleMesh(j)));
  const fingers=['Index','Middle'].map(finger=>{
   const joints=hands[side].joints.filter(j=>j.finger===finger);
   const gaps=joints.map(j=>Math.min(...toe.map(t=>gap(capsule(capsuleMesh(j)),t))));
   // An extended fingertip near a toe is a reach, not a wrapped grip.
   const bends=joints.map(j=>THREE.MathUtils.radToDeg(j.group.rotation.x));
   const pass=gaps.every(g=>g>=-.0005)&&gaps.filter(g=>g<=.005).length>=2&&gaps[2]<=.005&&bends[1]>=45&&bends[2]>=35;
   return {finger,gapsMm:gaps.map(g=>g*1000),bends,pass};
  });
  return {side,fingers,pass:fingers.every(f=>f.pass)};
 });
 const contacts=handFootContacts(rig);
 return {name:'both-toe-grips',kind:'relation',gapMm:Math.max(...samples.flatMap(s=>s.fingers.map(f=>Math.min(...f.gapsMm)))),minGapMm:Math.min(...samples.flatMap(s=>s.fingers.flatMap(f=>f.gapsMm))),samples,contacts,pass:samples.every(s=>s.pass)&&contacts.length===0,note:'Both index/middle finger hooks contact their own big toe. Hand/foot primitive clearance is checked; this does not solve grip forces or arbitrary transitions.'};
}
