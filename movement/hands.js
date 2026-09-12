import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

export const fingerNames = ['Thumb','Index','Middle','Ring','Little'];
const lengths = {Thumb:[.031,.025],Index:[.035,.023,.018],Middle:[.039,.026,.019],Ring:[.036,.024,.018],Little:[.028,.019,.016]};
const spreads = {Index:-.026,Middle:-.008,Ring:.011,Little:.028};
export const handPresets = {
  open:[0,0,0], relaxed:[18,25,15], wrap:[55,80,55], fist:[80,100,65],
};
export function setFingerBend(joint, radians) {
  joint.group.rotation.x = THREE.MathUtils.clamp(radians,0,THREE.MathUtils.degToRad(joint.maxBend));
}
export function setFingerSpread(joint,radians) {
  if(joint.segment!==0)return;
  joint.group.rotation.z=joint.spreadDirection*THREE.MathUtils.clamp(radians,0,THREE.MathUtils.degToRad(joint.finger==='Thumb'?35:25));
}
export function applyFingerSpread(hand,amount) {
  const angles={Thumb:25,Index:12,Middle:3,Ring:7,Little:17};
  for(const joint of hand.joints)if(joint.segment===0)setFingerSpread(joint,THREE.MathUtils.degToRad(angles[joint.finger])*THREE.MathUtils.clamp(amount,0,1));
}
export function createHand(wrist, side, material) {
  const sign = side === 'left' ? 1:-1;
  const root = new THREE.Group();wrist.add(root);
  const joints = [], meshes = [];
  const palmGeometry=new RoundedBoxGeometry(.074,.094,.03,5,.009);
  const vertices=palmGeometry.attributes.position;
  for(let i=0;i<vertices.count;i++){
    const y=vertices.getY(i),towardFingers=THREE.MathUtils.smoothstep(-y,-.025,.035);
    // A narrow wrist opens into the knuckle row; keep the palm face flat for support.
    vertices.setX(i,vertices.getX(i)*THREE.MathUtils.lerp(.60,1,towardFingers));
  }
  palmGeometry.computeVertexNormals();
  const palm = new THREE.Mesh(palmGeometry,material);
  palm.userData.boxHalfExtents = [.037,.047,.015];
  palm.position.y = -.045;
  palm.castShadow = true;palm.receiveShadow = true;root.add(palm);meshes.push(palm);
  for (const finger of fingerNames) {
    const mount = new THREE.Group();root.add(mount);
    mount.position.set(finger === 'Thumb' ? -sign*.032:sign*spreads[finger],finger === 'Thumb' ? -.028:-.081,finger === 'Thumb' ? -.006:-.008);
    if (finger === 'Thumb') {mount.rotation.z = -sign*.9;mount.rotation.y = sign*.55;}
    let parent = mount;
    lengths[finger].forEach((length,index) => {
      const group = new THREE.Group();parent.add(group);
      if (index) group.position.y = -lengths[finger][index-1];
      const joint = {id:`${side}${finger}${index+1}`,label:`${finger} / ${index+1}`,group,finger,side,segment:index,maxBend:index === 1 ? 105:90,isFinger:true,spreadDirection:sign*(['Thumb','Index','Middle'].includes(finger)?-1:1)};
      joints.push(joint);
      const radius = finger === 'Thumb' ? .009:index === 2 ? .0055:.007;
      const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius,length-2*radius,5,12),material);
      const knuckle = new THREE.Mesh(new THREE.SphereGeometry(radius,12,8),material);
      knuckle.userData.fingerJoint = joint;knuckle.castShadow = true;knuckle.receiveShadow = true;group.add(knuckle);meshes.push(knuckle);
      mesh.position.y = -length/2;mesh.castShadow = true;mesh.receiveShadow = true;mesh.userData.fingerJoint = joint;group.add(mesh);meshes.push(mesh);
      if(index===lengths[finger].length-1){
        // A small dorsal nail is an orientation cue, inset within the finger volume.
        const nail=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),material);
        nail.scale.set(radius*.67,Math.min(.007,length*.28),.001);
        nail.position.set(0,-length/2,radius-.0008);
        nail.userData.fingerJoint=joint;nail.userData.handNail=true;
        group.add(nail);meshes.push(nail);
      }
      parent = group;
    });
  }
  return {root,palm,joints,meshes,side,wrist};
}
export function applyHandPreset(hand,name,amount=1) {
  const angles = handPresets[name];
  if (!angles) throw new Error(`Unknown hand preset: ${name}`);
  for (const joint of hand.joints) {
    if(joint.segment===0){setFingerSpread(joint,0);joint.group.rotation.y=0;}
    const angle = joint.finger === 'Thumb' ? (name==='fist'?[90,50][joint.segment]:angles[joint.segment]*.65):angles[joint.segment];
    setFingerBend(joint,THREE.MathUtils.degToRad(angle)*amount);
    if(name==='fist'&&joint.finger==='Thumb'&&joint.segment===0){
      const side=hand.side==='left'?1:-1;
      joint.group.rotation.y=THREE.MathUtils.degToRad(-10)*side*amount;
      joint.group.rotation.z=THREE.MathUtils.degToRad(60)*side*amount;
    }
  }
}
