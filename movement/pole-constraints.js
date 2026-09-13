import {captureHandOffsets,applyHandOffsets,blendHandOffsets,handOffsetTravel} from './hand-offsets.js';
import * as THREE from 'three';
import {solve} from './rig.js';
import {setFingerBend} from './hands.js';

export const POLE = {radius:.023,height:2.7,skin:.0007};
const point = object => object.getWorldPosition(new THREE.Vector3());
const radial = value => new THREE.Vector3(value.x,0,value.z).normalize();

// Distance to the projected ellipse of an arbitrarily rotated ellipsoid.
// Unlike point tests this also detects a pole completely enclosed by a body part.
function ellipseDistance(cx,cz,qxx,qxz,qzz) {
  const angle=.5*Math.atan2(2*qxz,qxx-qzz),c=Math.cos(angle),s=Math.sin(angle);
  const spread=Math.hypot(qxx-qzz,2*qxz);
  const a=Math.max((qxx+qzz+spread)/2,1e-14),b=Math.max((qxx+qzz-spread)/2,1e-14);
  const x=c*cx+s*cz,z=-s*cx+c*cz;
  if(x*x/a+z*z/b<=1) return 0;
  let low=0,high=Math.sqrt(Math.max(a,b))*Math.hypot(x,z);
  for(let i=0;i<24;i++) {
    const t=(low+high)/2;
    if(a*x*x/(t+a)**2+b*z*z/(t+b)**2>1)low=t;else high=t;
  }
  const t=(low+high)/2;
  return Math.hypot(x*t/(t+a),z*t/(t+b));
}
export function poleClearance(mesh,pole=POLE) {
  const p=mesh.geometry.parameters,m=mesh.matrixWorld.elements;
  if(mesh.userData.boxHalfExtents) {
    const [hx,hy,hz]=mesh.userData.boxHalfExtents;
    const extent=Math.abs(m[1])*hx+Math.abs(m[5])*hy+Math.abs(m[9])*hz;
    if(m[13]-extent>pole.height || m[13]+extent<0)return Infinity;
    const points=[];
    for(const x of [-hx,hx])for(const y of [-hy,hy])for(const z of [-hz,hz])points.push([m[12]+m[0]*x+m[4]*y+m[8]*z,m[14]+m[2]*x+m[6]*y+m[10]*z]);
    points.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
    const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
    const half=list=>{const result=[];for(const p of list){while(result.length>1&&cross(result.at(-2),result.at(-1),p)<=0)result.pop();result.push(p);}return result;};
    const hull=half(points).slice(0,-1).concat(half([...points].reverse()).slice(0,-1));
    let inside=true,distance=Infinity;
    for(let i=0;i<hull.length;i++){
      const a=hull[i],b=hull[(i+1)%hull.length];if(cross(a,b,[0,0])<0)inside=false;
      const dx=b[0]-a[0],dz=b[1]-a[1],d=dx*dx+dz*dz;
      const t=d?THREE.MathUtils.clamp(-(a[0]*dx+a[1]*dz)/d,0,1):0;
      distance=Math.min(distance,Math.hypot(a[0]+t*dx,a[1]+t*dz));
    }
    return (inside?0:distance)-pole.radius;
  }
  if(mesh.geometry.type==='CapsuleGeometry') {
    const half=p.height/2;
    const radius=p.radius*Math.max(Math.hypot(m[0],m[1],m[2]),Math.hypot(m[4],m[5],m[6]),Math.hypot(m[8],m[9],m[10]));
    const ax=m[12]-m[4]*half,az=m[14]-m[6]*half;
    const bx=m[12]+m[4]*half,bz=m[14]+m[6]*half;
    const ymin=m[13]-Math.abs(m[5]*half)-radius,ymax=m[13]+Math.abs(m[5]*half)+radius;
    if(ymin>pole.height || ymax<0)return Infinity;
    const dx=bx-ax,dz=bz-az,den=dx*dx+dz*dz;
    const t=den ? THREE.MathUtils.clamp(-(ax*dx+az*dz)/den,0,1):0;
    return Math.hypot(ax+t*dx,az+t*dz)-radius-pole.radius;
  }
  if(mesh.geometry.type==='SphereGeometry') {
    const r=p.radius;
    const ry=r*Math.hypot(m[1],m[5],m[9]);
    if(m[13]-ry>pole.height || m[13]+ry<0)return Infinity;
    const qxx=r*r*(m[0]**2+m[4]**2+m[8]**2),qzz=r*r*(m[2]**2+m[6]**2+m[10]**2);
    const qxz=r*r*(m[0]*m[2]+m[4]*m[6]+m[8]*m[10]);
    // Broad phase avoids the ellipse solve for body parts far from the pole.
    if(Math.hypot(m[12],m[14])>Math.sqrt(qxx+qzz)+pole.radius+.002)return .002;
    return ellipseDistance(m[12],m[14],qxx,qxz,qzz)-pole.radius;
  }
  return Infinity;
}
export function minPoleClearance(root,meshes,pole=POLE) {
  root.updateWorldMatrix(true,true);
  let min=Infinity;
  for(const mesh of meshes)min=Math.min(min,poleClearance(mesh,pole));
  return min;
}
export function capturePose(root,joints) {
  return {handOffsets:captureHandOffsets(root),position:root.position.clone(),rotations:joints.map(({group})=>group.quaternion.clone())};
}
export function restorePose(root,joints,pose) {
  applyHandOffsets(root,pose.handOffsets);root.position.copy(pose.position);joints.forEach(({group},i)=>group.quaternion.copy(pose.rotations[i]));
  root.updateWorldMatrix(true,true);
}
function blendPose(root,joints,from,to,mix) {
  blendHandOffsets(root,from.handOffsets,to.handOffsets,mix);
  root.position.lerpVectors(from.position,to.position,mix);
  joints.forEach(({group},i)=>group.quaternion.slerpQuaternions(from.rotations[i],to.rotations[i],mix));
}
export function createPoleConstraints({root,joints,hands,chain,meshes}) {
  const grips=new Map();
  let safe=capturePose(root,joints);
  const clearance=()=>minPoleClearance(root,meshes);
  function applyGrip(hand,grip) {
    const limb=chain(`${hand.side}Wrist`);
    const normal=new THREE.Vector3(Math.sin(grip.angle),0,Math.cos(grip.angle));
    const tangent=new THREE.Vector3().crossVectors(normal,new THREE.Vector3(0,1,0));
    if(hand.side==='right')tangent.negate();
    const target=normal.clone().multiplyScalar(grip.radius).addScaledVector(tangent,.045);target.y=grip.height;
    if(point(limb.upper).distanceTo(target)>limb.a+limb.b-.0002)return false;
    solve(limb,target,point(limb.upper).addScaledVector(normal,.15).add(new THREE.Vector3(hand.side==='left'?.3:-.3,-.15,0).applyQuaternion(root.getWorldQuaternion(new THREE.Quaternion()))));
    const basis=new THREE.Matrix4().makeBasis(new THREE.Vector3(0,hand.side==='left'?1:-1,0),tangent,normal);
    const orientation=new THREE.Quaternion().setFromRotationMatrix(basis);
    // Roll the forearm around its length to face the grip, rather than compensating
    // with a sideways wrist bend. This leaves the elbow and wrist positions intact.
    const forearmY=point(limb.middle).sub(point(hand.wrist)).normalize();
    const forearmX=new THREE.Vector3().crossVectors(forearmY,tangent);
    if(forearmX.lengthSq()>1e-8){
      forearmX.normalize();if(forearmX.y*(hand.side==='left'?1:-1)<0)forearmX.negate();
      const forearmZ=new THREE.Vector3().crossVectors(forearmX,forearmY);
      const world=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(forearmX,forearmY,forearmZ));
      limb.middle.quaternion.copy(limb.middle.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(world));
      limb.middle.updateWorldMatrix(false,true);
    }
    hand.wrist.quaternion.copy(hand.wrist.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(orientation));
    return true;
  }
  function closeFingers(hand) {
    for(const joint of hand.joints)joint.group.rotation.set(0,0,0);
    // Close each hinge up to its first surface contact, then let the next hinge wrap.
    for(const joint of hand.joints) {
      let previous=0;
      for(let degree=2;degree<=joint.maxBend;degree+=2) {
        setFingerBend(joint,THREE.MathUtils.degToRad(degree));
        if(minPoleClearance(root,hand.meshes)<POLE.skin) {
          let low=previous,high=degree;
          for(let i=0;i<10;i++) {
            const mid=(low+high)/2;setFingerBend(joint,THREE.MathUtils.degToRad(mid));
            if(minPoleClearance(root,hand.meshes)<POLE.skin)high=mid;else low=mid;
          }
          setFingerBend(joint,THREE.MathUtils.degToRad(low));break;
        }
        previous=degree;
      }
    }
  }
  function attach(side,{height,angle}={}) {
    const before=capturePose(root,joints),hand=hands[side],wrist=point(hand.wrist);
    const n=radial(point(chain(`${side}Wrist`).upper));
    if(n.lengthSq()<.01)n.set(0,0,1);
    const contact={height:THREE.MathUtils.clamp(height ?? wrist.y,.18,2.45),angle:angle ?? Math.atan2(n.x,n.z)};
    for(const radius of [.055,.063,.075,.09]) {
      restorePose(root,joints,before);
      const grip={...contact,radius};
      if(!applyGrip(hand,grip))continue;
      closeFingers(hand);
      if(clearance()>=POLE.skin-.00002) {grips.set(side,grip);safe=capturePose(root,joints);return true;}
    }
    restorePose(root,joints,before);return false;
  }
  function maintainGrips() {
    for(const [side,grip] of grips)if(!applyGrip(hands[side],grip))return false;
    return true;
  }
  function commit() {
    const desired=capturePose(root,joints),from=safe;
    const distance=from.position.distanceTo(desired.position)+handOffsetTravel(from.handOffsets,desired.handOffsets);
    const rotation=Math.max(...from.rotations.map((q,i)=>q.angleTo(desired.rotations[i])));
    const steps=Math.max(1,Math.ceil((distance+rotation*2)/.012));
    let accepted=0;
    // Sweep, rather than only checking the destination, to prevent fast drags tunnelling.
    for(let i=1;i<=Math.min(steps,512);i++) {
      const mix=i/steps;blendPose(root,joints,from,desired,mix);
      if(!maintainGrips() || clearance()<POLE.skin-.00002) {
        let low=accepted,high=mix;
        for(let j=0;j<10;j++) {
          const mid=(low+high)/2;blendPose(root,joints,from,desired,mid);
          if(maintainGrips() && clearance()>=POLE.skin-.00002)low=mid;else high=mid;
        }
        blendPose(root,joints,from,desired,low);maintainGrips();safe=capturePose(root,joints);return false;
      }
      accepted=mix;
    }
    safe=capturePose(root,joints);return accepted===1;
  }
  function settle() {
    // A card selection is a discontinuous placement: move invalid poses outward first.
    grips.clear();
    for(let i=0;i<150 && clearance()<POLE.skin;i++) {
      let n=radial(root.position);if(n.lengthSq()<.01)n.set(0,0,1);
      root.position.addScaledVector(n,.01);
    }
    safe=capturePose(root,joints);
    return clearance()>=POLE.skin-.00002;
  }
  function release(side) {
    if (!grips.has(side)) return true;
    for (const joint of [...hands[side].joints].reverse()) {joint.group.rotation.x=0;commit();}
    grips.delete(side);safe=capturePose(root,joints);return true;
  }
  return {grips,attach,commit,settle,clearance,release,
    save:()=>{safe=capturePose(root,joints);},
    sync:()=>{if(maintainGrips() && clearance()>=POLE.skin-.00002){safe=capturePose(root,joints);return true;}return false;},
    snapshot:()=>({pose:capturePose(root,joints),grips:[...grips].map(([side,g])=>[side,{...g}]),safe}),
    restore(state){restorePose(root,joints,state.pose);grips.clear();for(const [side,g] of state.grips)grips.set(side,g);safe=state.safe;},
  };
}
