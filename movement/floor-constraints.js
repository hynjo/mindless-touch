import * as THREE from 'three';
import {capturePose,restorePose} from './pole-constraints.js';
export const FLOOR_SKIN=.0007;
export function floorClearance(mesh) {
  const m=mesh.matrixWorld.elements,p=mesh.geometry.parameters;
  if(mesh.userData.boxHalfExtents){const [x,y,z]=mesh.userData.boxHalfExtents;return m[13]-Math.abs(m[1])*x-Math.abs(m[5])*y-Math.abs(m[9])*z;}
  if(mesh.geometry.type==='SphereGeometry')return m[13]-p.radius*Math.hypot(m[1],m[5],m[9]);
  if(mesh.geometry.type==='CapsuleGeometry') {
    const radius=p.radius*Math.max(Math.hypot(m[0],m[1],m[2]),Math.hypot(m[4],m[5],m[6]),Math.hypot(m[8],m[9],m[10]));
    return m[13]-Math.abs(m[5]*p.height/2)-radius;
  }
  return Infinity;
}
export function floorContactPoint(mesh) {
  const m=mesh.matrixWorld.elements,p=mesh.geometry.parameters;
  const result=new THREE.Vector3(m[12],.002,m[14]);
  if(mesh.userData.boxHalfExtents) {
    const half=mesh.userData.boxHalfExtents;
    for(let i=0;i<3;i++){const offset=-Math.sign(m[i*4+1])*half[i];result.x+=m[i*4]*offset;result.z+=m[i*4+2]*offset;}
  } else if(mesh.geometry.type==='SphereGeometry') {
    const denominator=Math.hypot(m[1],m[5],m[9]);
    if(denominator>1e-12) {
      result.x-=p.radius*(m[0]*m[1]+m[4]*m[5]+m[8]*m[9])/denominator;
      result.z-=p.radius*(m[2]*m[1]+m[6]*m[5]+m[10]*m[9])/denominator;
    }
  } else if(mesh.geometry.type==='CapsuleGeometry') {
    const offset=-Math.sign(m[5])*p.height/2;result.x+=m[4]*offset;result.z+=m[6]*offset;
  }
  return result;
}
export function createFloorConstraints({root,joints,meshes}) {
  const clearance=()=>{root.updateWorldMatrix(true,true);return Math.min(...meshes.map(floorClearance));};
  let safe=capturePose(root,joints);
  function settle() {
    root.position.y+=FLOOR_SKIN-clearance();root.updateWorldMatrix(true,true);safe=capturePose(root,joints);
  }
  function commit() {
    const from=safe,to=capturePose(root,joints);
    const angle=Math.max(...from.rotations.map((q,i)=>q.angleTo(to.rotations[i])));
    const steps=Math.max(1,Math.ceil((from.position.distanceTo(to.position)+angle*2)/.012));
    const blend=mix=>{root.position.lerpVectors(from.position,to.position,mix);joints.forEach(({group},i)=>group.quaternion.slerpQuaternions(from.rotations[i],to.rotations[i],mix));};
    let accepted=0;
    for(let i=1;i<=Math.min(steps,512);i++) {
      const mix=i/steps;blend(mix);
      if(clearance()<FLOOR_SKIN-.00002) {
        let low=accepted,high=mix;
        for(let j=0;j<10;j++){const mid=(low+high)/2;blend(mid);if(clearance()<FLOOR_SKIN-.00002)high=mid;else low=mid;}
        blend(low);safe=capturePose(root,joints);return false;
      }
      accepted=mix;
    }
    safe=capturePose(root,joints);return accepted===1;
  }
  function contacts() {
    root.updateWorldMatrix(true,true);
    return meshes.filter(mesh=>floorClearance(mesh)<.006).map(mesh=>({mesh,position:floorContactPoint(mesh)}));
  }
  return {clearance,settle,commit,contacts,snapshot:()=>({pose:capturePose(root,joints),safe}),restore(state){restorePose(root,joints,state.pose);safe=state.safe;}};
}
