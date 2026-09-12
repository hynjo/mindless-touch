import * as THREE from 'three';
import {aim,solve} from './rig.js';
import {applyHandPreset} from './hands.js';
import {floorClearance,FLOOR_SKIN} from './floor-constraints.js';
const position=group=>group.getWorldPosition(new THREE.Vector3());
const flatPalm=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2);
const palmHeight=.015+FLOOR_SKIN;
function worldOrientation(group,quaternion) {
  group.quaternion.copy(group.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(quaternion));
}
function groundTarget(upper,current,height,length) {
  const start=position(upper),target=current.clone().setY(height);
  const horizontal=new THREE.Vector3(target.x-start.x,0,target.z-start.z);
  const reach=Math.sqrt(Math.max(0,(length-.0002)**2-(start.y-height)**2));
  if(horizontal.length()>reach)horizontal.setLength(reach);
  target.x=start.x+horizontal.x;target.z=start.z+horizontal.z;return target;
}
export function placePalmsOnFloor({root,hands,byId,dimensions,meshes}) {
  root.updateWorldMatrix(true,true);
  const feet={};
  for(const side of ['left','right']) {
    const ankle=byId[side+'Ankle'].group;
    const footMeshes=[];ankle.traverse(child=>{if(child.isMesh)footMeshes.push(child);});
    const footClearance=Math.min(...footMeshes.map(floorClearance));
    feet[side]={position:position(ankle),rotation:ankle.getWorldQuaternion(new THREE.Quaternion()),height:position(ankle).y-footClearance+FLOOR_SKIN};
    applyHandPreset(hands[side],'open');
    worldOrientation(hands[side].wrist,flatPalm);
  }
  const maxShoulder=Math.max(...['left','right'].map(side=>position(byId[side+'Shoulder'].group).y));
  root.position.y-=Math.max(0,maxShoulder-(dimensions.upperArm+dimensions.forearm+palmHeight-.002));
  root.updateWorldMatrix(true,true);
  for(let pass=0;pass<5;pass++) {
    for(const side of ['left','right']) {
      const upper=byId[side+'Shoulder'].group,middle=byId[side+'Elbow'].group;
      const target=groundTarget(upper,position(hands[side].wrist),palmHeight,dimensions.upperArm+dimensions.forearm);
      const bend=position(middle).add(new THREE.Vector3(0,.1,-.2));
      solve({upper,middle,a:dimensions.upperArm,b:dimensions.forearm},target,bend);
      worldOrientation(hands[side].wrist,flatPalm);
      const hip=byId[side+'Hip'].group,knee=byId[side+'Knee'].group,ankle=byId[side+'Ankle'].group;
      const footTarget=groundTarget(hip,feet[side].position,feet[side].height,dimensions.thigh+dimensions.shin);
      solve({upper:hip,middle:knee,a:dimensions.thigh,b:dimensions.shin},footTarget,position(knee).add(new THREE.Vector3(0,0,.2)));
      worldOrientation(ankle,feet[side].rotation);
    }
    root.updateWorldMatrix(true,true);
    const min=Math.min(...meshes.map(floorClearance));
    if(min>=FLOOR_SKIN-.00002)return;
    root.position.y+=FLOOR_SKIN-min;
  }
}
export function palmsAreSupported(step) {return ['palms','palms-knees'].includes(step.floorSupport);}

// Keep palms level while touching down or lifting off. Curling begins only after clearance.
export function preparePalmLanding({root,hands}) {
  root.updateWorldMatrix(true,true);
  for(const hand of Object.values(hands)) {
    if(Math.min(...hand.meshes.map(floorClearance))<.025) {
      applyHandPreset(hand,'open');worldOrientation(hand.wrist,flatPalm);
    }
  }
}

// Quadruped support: preserve knee and palm locations while the spine changes shape.
export function placeHandsAndKnees({root,hands,byId,dimensions}) {
 root.updateWorldMatrix(true,true);
 const kneeHeight=.086+FLOOR_SKIN;
 const hip=byId.leftHip.group;
 const hipPosition=position(hip);
 const kneeZ=root.position.z-.04;
 const dz=hipPosition.z-kneeZ;
 root.position.y+=kneeHeight+Math.sqrt(Math.max(.001,dimensions.thigh**2-dz**2))-hipPosition.y;
 root.updateWorldMatrix(true,true);
 for(const side of ['left','right']){
  const upper=byId[side+'Hip'].group,knee=byId[side+'Knee'].group,ankle=byId[side+'Ankle'].group;
  const target=position(upper).setY(kneeHeight);target.z=kneeZ;
  aim(upper,new THREE.Vector3(0,-1,0),target.sub(position(upper)));
  aim(knee,new THREE.Vector3(0,-1,0),new THREE.Vector3(0,0,-1));
  worldOrientation(ankle,new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),Math.PI/2));
  const shoulder=byId[side+'Shoulder'].group,elbow=byId[side+'Elbow'].group;
  const handTarget=new THREE.Vector3(root.position.x+(side==='left'?1:-1)*dimensions.shoulderWidth/2,palmHeight,root.position.z+.46);
  solve({upper:shoulder,middle:elbow,a:dimensions.upperArm,b:dimensions.forearm},handTarget,handTarget.clone().add(new THREE.Vector3(0,.2,-.2)));
  applyHandPreset(hands[side],'open');worldOrientation(hands[side].wrist,flatPalm);
 }
 root.updateWorldMatrix(true,true);
}
