import * as THREE from 'three';
// Exact segment/box distance: split at face crossings, then minimize each quadratic.
export function boxDistance(a,b,half){
 const p=a.toArray(),d=b.clone().sub(a).toArray(),cuts=[0,1];
 for(let i=0;i<3;i++)if(Math.abs(d[i])>1e-12)for(const face of [-half[i],half[i]]){const t=(face-p[i])/d[i];if(t>0&&t<1)cuts.push(t);}
 cuts.sort((x,y)=>x-y);
 const square=t=>p.reduce((sum,v,i)=>sum+Math.max(0,Math.abs(v+t*d[i])-half[i])**2,0);
 let best=Infinity;
 for(let k=0;k<cuts.length-1;k++){
  const lo=cuts[k],hi=cuts[k+1],mid=(lo+hi)/2;let numerator=0,denominator=0;
  for(let i=0;i<3;i++){const x=p[i]+mid*d[i];if(Math.abs(x)>half[i]){numerator+=d[i]*(p[i]-Math.sign(x)*half[i]);denominator+=d[i]**2;}}
  best=Math.min(best,square(lo),square(hi),square(denominator?THREE.MathUtils.clamp(-numerator/denominator,lo,hi):mid));
 }
 return Math.sqrt(best);
}
export function createHandCollisionPairs(joints,segmentDistance){
 const pairs=[],groups=[];
 for(const side of ['left','right']){
  const first=pairs.length;
  const wrist=joints.find(j=>j.id===side+'Wrist');if(!wrist)continue;
  let palm;wrist.group.traverse(m=>{if(m.userData.boxHalfExtents)palm=m;});
  const fingers=joints.filter(j=>j.isFinger&&j.side===side).map(j=>{
   const mesh=j.group.children.find(m=>m.geometry?.type==='CapsuleGeometry');
   return {joint:j,mesh,r:mesh.geometry.parameters.radius,length:-mesh.position.y*2};
  });
  const capsule=(f,trim=0)=>({a:f.joint.group.localToWorld(new THREE.Vector3(0,-trim,0)),b:f.joint.group.localToWorld(new THREE.Vector3(0,-f.length+f.r,0)),r:f.r});
  for(let i=0;i<fingers.length;i++){
   const f=fingers[i];
   for(let k=i+1;k<fingers.length;k++){
    const g=fingers[k];
    // Connected hinges share their knuckles; other segments must not intersect.
    if(f.joint.finger===g.joint.finger&&Math.abs(f.joint.segment-g.joint.segment)<=1)continue;
    pairs.push({a:f.joint.id,b:g.joint.id,distance(){const x=capsule(f),y=capsule(g);return segmentDistance(x.a,x.b,y.a,y.b)-x.r-y.r;}});
   }
   if(palm && !(f.joint.finger==='Thumb'&&f.joint.segment===0)){
    // Leave only the metacarpal attachment outside the test, not the whole finger.
    const trim=f.joint.segment===0?Math.min(.026,f.length-f.r):0;
    pairs.push({a:f.joint.id,b:side+'Palm',distance(){
     const c=capsule(f,trim);return boxDistance(palm.worldToLocal(c.a),palm.worldToLocal(c.b),palm.userData.boxHalfExtents)-c.r;
    }});
   }
  }
  groups.push({pairs:pairs.slice(first),joints:fingers.map(f=>f.joint),palm,key:[],values:[]});
 }
 return {pairs,distances(){
  // Whole-hand translation/rotation cannot change internal contact. Reuse the
  // result while only the body or wrist moves; invalidate on any finger rotation.
  return groups.flatMap(group=>{
   const offset=group.palm?.parent.position.toArray()||[];
   const key=offset.concat(group.joints.flatMap(j=>j.group.quaternion.toArray()));
   if(key.length!==group.key.length||key.some((v,i)=>v!==group.key[i])){
    group.values=group.pairs.map(p=>p.distance());group.key=key;
   }
   return group.values;
  });
 }};
}
