import * as THREE from 'three';

// Measure hand direction in its parent forearm frame, independent of Euler wraps.
// Axial palm/back rotation is a forearm-roll proxy in this rig; it is not wrist bend.
// These are conservative editor limits, not a clinical range-of-motion model.
export function wristAngles(quaternion) {
 const direction=new THREE.Vector3(0,-1,0).applyQuaternion(quaternion).normalize();
 return {bend:Math.atan2(-direction.z,-direction.y),tilt:Math.asin(THREE.MathUtils.clamp(direction.x,-1,1))};
}
export function wristMargins(joint) {
 const {bend,tilt}=wristAngles(joint.group.quaternion);
 const limits=joint.limits||[[-80,80],[-90,90],[-35,35]];
 return [[bend,limits[0]],[tilt,limits[2]]].map(([angle,[min,max]])=>Math.min(angle-THREE.MathUtils.degToRad(min),THREE.MathUtils.degToRad(max)-angle));
}
