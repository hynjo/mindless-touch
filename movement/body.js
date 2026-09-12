import * as THREE from 'three';
import {createFoot} from './feet.js';
import {createHand} from './hands.js';
export function createBody({scene,dimensions,bodyMaterial,jointMaterial}) {
const joints = [];
const markers = [];
const hands = {},feet = {};
function ellipsoid(parent, position, scale, material = bodyMaterial) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), material);
  mesh.position.set(...position);mesh.scale.set(...scale);mesh.castShadow = true;mesh.receiveShadow = true;parent.add(mesh);return mesh;
}
function joint(id, label, parent, position, limits = [[-100,100],[-90,90],[-100,100]]) {
  const group = new THREE.Group();group.position.set(...position);parent.add(group);
  const item = { id, label, group, limits };joints.push(item);
  const marker = ellipsoid(group, [0,0,0], [.047,.047,.047], jointMaterial);
  if (id.endsWith('Wrist')) marker.scale.set(.024,.024,.014);
  marker.userData.joint = item;markers.push(marker);return group;
}
function limb(parent, length, radius) {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length - radius * 2, 6, 16), bodyMaterial);
  mesh.position.y = -length / 2;mesh.castShadow = true;parent.add(mesh);
}
const root = joint('pelvis', 'Hips / whole body', scene, [0, dimensions.pelvisHeight, 0], [[-90,90],[-180,180],[-90,90]]);
ellipsoid(root, [0,.01,0], [.17,.13,.115]);
const waist = joint('waist','Waist / lower back',root,[0,.04,0], [[-45,45],[-40,40],[-35,35]]);
ellipsoid(waist,[0,.10,0],[.16,.12,.10]);
const torso = joint('torso','Chest / upper back',waist,[0,.21,0], [[-70,70],[-90,90],[-60,60]]);
ellipsoid(torso,[0,.12,0],[.215,.185,.12]);
const neck = joint('neck','Head',torso,[0,.32,0], [[-60,60],[-90,90],[-45,45]]);
const headMesh = ellipsoid(neck,[0,.135,0],[.105,.145,.105]);
// A subtle nose makes the body's front direction visible.
ellipsoid(neck,[0,.13,.102],[.022,.03,.026]);
for (const [side, sign, label] of [['left',1,'Left'],['right',-1,'Right']]) {
  const shoulder = joint(`${side}Shoulder`,`${label} shoulder`,torso,[sign * dimensions.shoulderWidth / 2,.21,0], [[-180,180],[-120,120],[-180,180]]);
  limb(shoulder, dimensions.upperArm, .064);
  const elbow = joint(`${side}Elbow`,`${label} elbow`,shoulder,[0,-dimensions.upperArm,0], [[-150,0],[0,0],[0,0]]);
  limb(elbow,dimensions.forearm,.05);
  const wrist = joint(`${side}Wrist`,`${label} hand`,elbow,[0,-dimensions.forearm,0], [[-80,80],[-90,90],[-35,35]]);
  hands[side] = createHand(wrist,side,bodyMaterial);
  joints.push(...hands[side].joints);
  const hip = joint(`${side}Hip`,`${label} hip`,root,[sign * dimensions.hipWidth / 2,-.04,0], [[-130,45],[-60,60],[-70,70]]);
  limb(hip,dimensions.thigh,.086);
  const knee = joint(`${side}Knee`,`${label} knee`,hip,[0,-dimensions.thigh,0], [[0,150],[0,0],[0,0]]);
  limb(knee,dimensions.shin,.063);
  const ankle = joint(`${side}Ankle`,`${label} foot`,knee,[0,-dimensions.shin,0], [[-40,50],[0,0],[-25,25]]);
  feet[side]=createFoot(ankle,side,bodyMaterial);joints.push(feet[side].archJoint,...feet[side].joints);
}
return {root,waist,torso,neck,headMesh,joints,markers,hands,feet};
}
