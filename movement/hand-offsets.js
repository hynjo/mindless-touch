import * as THREE from 'three';
const zero=new THREE.Vector3();
export function handMounts(root){
 const mounts=[];root.traverse(g=>{if(g.userData.handMount)mounts.push(g);});return mounts;
}
export function captureHandOffsets(root){return Object.fromEntries(handMounts(root).map(g=>[g.userData.handMount,g.position.clone()]));}
export function applyHandOffsets(root,offsets={}){
 for(const mount of handMounts(root)){const value=offsets[mount.userData.handMount];if(Array.isArray(value))mount.position.fromArray(value);else mount.position.copy(value||zero);}
}
export function blendHandOffsets(root,from={},to={},mix){
 for(const mount of handMounts(root))mount.position.lerpVectors(from[mount.userData.handMount]||zero,to[mount.userData.handMount]||zero,mix);
}

export function handOffsetTravel(from={},to={}){
 return Math.max(0,...['left','right'].map(side=>(from[side]||zero).distanceTo(to[side]||zero)));
}
