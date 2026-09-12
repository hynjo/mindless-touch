import * as THREE from 'three';
const position = group => group.getWorldPosition(new THREE.Vector3());
export function aim(group, localAxis, direction) {
  const world = group.getWorldQuaternion(new THREE.Quaternion());
  const from = localAxis.clone().applyQuaternion(world).normalize();
  const delta = new THREE.Quaternion().setFromUnitVectors(from,direction.clone().normalize());
  const parent = group.parent.getWorldQuaternion(new THREE.Quaternion());
  group.quaternion.copy(parent.invert().multiply(delta.multiply(world)));
  group.updateWorldMatrix(false,true);
}
const downAxis = new THREE.Vector3(0,-1,0);
// Two-bone IK preserves segment lengths and clamps unreachable targets.
export function solve({upper,middle,a,b},target,pole) {
  const start = position(upper), direction = target.clone().sub(start);
  const distance = THREE.MathUtils.clamp(direction.length(),Math.abs(a-b)+.001,a+b-.0001);
  if (direction.lengthSq() < 1e-10) direction.copy(downAxis);
  direction.normalize();
  const bend = pole.clone().sub(start);bend.addScaledVector(direction,-bend.dot(direction));
  if (bend.lengthSq() < 1e-8) {
    bend.set(0,0,1).addScaledVector(direction,-direction.z);
    if (bend.lengthSq() < 1e-8) bend.set(1,0,0).addScaledVector(direction,-direction.x);
  }
  bend.normalize();
  const along = (a*a-b*b+distance*distance)/(2*distance);
  const elbow = start.clone().addScaledVector(direction,along).addScaledVector(bend,Math.sqrt(Math.max(0,a*a-along*along)));
  const reachable = start.clone().addScaledVector(direction,distance);
  aim(upper,downAxis,elbow.clone().sub(start));aim(middle,downAxis,reachable.sub(elbow));
}
