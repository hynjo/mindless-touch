import * as THREE from 'three';

const q=angles=>new THREE.Quaternion().setFromEuler(new THREE.Euler(...angles.map(THREE.MathUtils.degToRad)));
const degrees=quaternion=>new THREE.Euler().setFromQuaternion(quaternion).toArray().slice(0,3).map(THREE.MathUtils.radToDeg);
const both=(joint,angles)=>({['left'+joint]:angles,['right'+joint]:[angles[0],-angles[1],-angles[2]]});
function standing(rotations,footYaw=[0,0]){
 const result={...rotations,...both('FootArch',[8,0,0])};
 for(const [index,side] of ['left','right'].entries()){
  const leg=q(result.pelvis||[0,0,0]).multiply(q(result[side+'Hip']||[0,0,0])).multiply(q(result[side+'Knee']||[0,0,0]));
  result[side+'Ankle']=degrees(leg.invert().multiply(q([0,footYaw[index],0])));
 }
 return result;
}
const triangle=standing({waist:[0,0,-35],torso:[0,0,-55],neck:[0,-80,0],
 leftHip:degrees(q([0,0,25]).multiply(q([0,60,0]))),rightHip:[0,0,-25],
 leftShoulder:[0,0,98],rightShoulder:[0,0,-90]},[90,20]);
const seated={...both('Hip',[-94.95,0,0]),...both('Knee',[11.79,0,0]),...both('Shoulder',[-55,0,15]),...both('Elbow',[-20,0,0])};
const triangleUpper=q(triangle.waist).multiply(q(triangle.torso));
triangle.leftShoulder=degrees(triangleUpper.invert().multiply(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,-1,0),new THREE.Vector3(.14,-1,.38).normalize())));
const rearAngle=THREE.MathUtils.radToDeg(Math.acos((1+Math.cos(THREE.MathUtils.degToRad(57)))/2));
const warriorLegs={leftHip:[-57,0,0],leftKnee:[57,0,0],rightHip:[rearAngle,0,0]};
const revolved=standing({pelvis:[30,0,0],waist:[25,0,0],torso:[10,70,0],neck:[0,-35,0],leftHip:[-55,0,0],rightHip:[-5,0,0]},[0,30]);
const upper=q(revolved.pelvis).multiply(q(revolved.waist)).multiply(q(revolved.torso));
for(const [side,y] of [['left',1],['right',-1]])revolved[side+'Shoulder']=degrees(upper.clone().invert().multiply(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,-1,0),new THREE.Vector3(0,y,0))));
export const ashtangaShapes={
 Mountain:standing({}),
 // Bent-knee preparation: hands descend beside the feet without claiming a toe
 // grip. These angles preserve sole support and leave wrist extension margin.
 'Big Toe':standing({pelvis:[106.889,0,0],waist:[9.154,0,0],torso:[5.846,0,0],neck:[-10,0,0],
  ...both('Hip',[-129.847,0,0]),...both('Knee',[24.919,0,0]),
  ...both('Shoulder',[-84.775,0,0]),...both('Elbow',[-20.225,0,0]),...both('Wrist',[-26.889,0,0])}),
 Triangle:triangle,
 'Revolved Triangle':revolved,
 'Warrior I':standing({...warriorLegs,...both('Shoulder',[-175,0,0]),neck:[-10,0,0]},[0,35]),
 'Warrior II':standing({...warriorLegs,waist:[0,-30,0],torso:[0,-60,0],neck:[0,90,0],...both('Shoulder',[0,0,90])},[0,35]),
 Staff:seated,
 'Seated Forward Bend I':{pelvis:[17.416,0,0],waist:[20,0,0],torso:[15,0,0],...both('Hip',[-113.342,0,0]),...both('Knee',[13.826,0,0]),...both('Shoulder',[-125.847,0,12]),...both('Elbow',[-10,0,0])},
 // Open-foot preparation: seat and outer foot edges remain grounded while
 // the composed hip rotation stays inside the femoral axial envelope.
 'Bound Angle':{...both('Hip',[-98.0223,-54.41,33.1082]),...both('Knee',[93.54,0,0]),...both('Shoulder',[-65,0,0]),...both('Elbow',[-60,0,0]),...both('Ankle',[13.7164,0,25.72])},
 Bridge:{pelvis:[-90,0,0],waist:[-1.85,0,0],torso:[-11.35,0,0],neck:[24.65,0,0],...both('Hip',[-30,0,0]),...both('Knee',[75.15,0,0]),...both('Shoulder',[-3.7,0,0]),...both('Ankle',[44.85,0,0]),...both('FootArch',[8,0,0])},
 Fish:{pelvis:[-73.67,0,0],waist:[-11.38,0,0],torso:[-6.89,0,0],neck:[-10,0,0],...both('Shoulder',[14.46,0,0]),...both('Elbow',[-49.26,0,0]),...both('Hip',[-19.75,0,0]),...both('Knee',[12,0,0])},
 Corpse:{pelvis:[-90.93,0,0],waist:[.977,0,0],torso:[3.173,0,0],neck:[-14.25,0,0],...both('Hip',[.839,0,6]),...both('Knee',[6.838,0,0]),...both('Shoulder',[0,0,12])},
};

// Reflection preserves the authored local rotations and swaps model-side labels.
export function mirrorRotations(rotations){
 return Object.fromEntries(Object.entries(rotations).map(([id,[x,y,z]])=>[id.startsWith('left')?id.replace(/^left/,'right'):id.startsWith('right')?id.replace(/^right/,'left'):id,[x,-y,-z]]));
}
