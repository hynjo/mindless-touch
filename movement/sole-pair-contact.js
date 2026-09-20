import * as THREE from 'three';

const NORMAL_ALIGNMENT=.95,CONTACT_MM=5,PENETRATION_MM=1;
// Support point of an affine-transformed sphere: c + r M Mᵀ n / |Mᵀ n|.
// This uses the ellipsoid itself, including inherited scale, rather than its AABB.
function supportPoint(mesh,direction){
 const linear=new THREE.Matrix3().setFromMatrix4(mesh.matrixWorld);
 const local=direction.clone().applyMatrix3(linear.clone().transpose());
 const offset=local.normalize().multiplyScalar(mesh.geometry.parameters.radius).applyMatrix3(linear);
 return new THREE.Vector3().setFromMatrixPosition(mesh.matrixWorld).add(offset);
}
function outerPoint(mesh,direction){
 const point=supportPoint(mesh,direction);
 if(mesh.geometry.type==='CapsuleGeometry'){
  const axis=new THREE.Vector3().setFromMatrixColumn(mesh.matrixWorld,1);
  point.addScaledVector(axis,Math.sign(axis.dot(direction))*mesh.geometry.parameters.height/2);
 }
 return point;
}

export function inspectSolePair(feet){
 for(const foot of [feet.left,feet.right])foot.wrist.updateWorldMatrix(true,true);
 const normal=foot=>new THREE.Vector3(0,-1,0).applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(foot.wrist.matrixWorld));
 const leftNormal=normal(feet.left),rightNormal=normal(feet.right);
 const center=mesh=>new THREE.Vector3().setFromMatrixPosition(mesh.matrixWorld);
 const centerDelta=center(feet.right.sole).add(center(feet.right.meshes[2])).sub(center(feet.left.sole)).sub(center(feet.left.meshes[2]));
 // Measure separation toward the other foot, even when soles face outward.
 // Orientation is a separate acceptance gate, never the sign of penetration.
 const axis=centerDelta.normalize();
 const contactNormal=leftNormal.clone().sub(rightNormal).normalize();
 const alignment=Math.min(leftNormal.dot(axis),rightNormal.dot(axis.clone().negate()),-leftNormal.dot(rightNormal));
 const patches=[['heel',feet.left.sole,feet.right.sole],['forefoot',feet.left.meshes[2],feet.right.meshes[2]]].map(([name,left,right])=>{
  const a=supportPoint(left,axis),b=supportPoint(right,axis.clone().negate()),delta=b.clone().sub(a);
  const gapMm=delta.dot(axis)*1000;
  const padDelta=center(right).sub(center(left));
  const tangentMm=padDelta.clone().addScaledVector(contactNormal,-padDelta.dot(contactNormal)).length()*1000;
  const pass=gapMm<=CONTACT_MM&&gapMm> -PENETRATION_MM&&tangentMm<=CONTACT_MM;
  return {name,gapMm,tangentMm,leftPoint:a.toArray(),rightPoint:b.toArray(),pass};
 });
 const gapMm=Math.max(...patches.map(p=>p.gapMm)),minGapMm=Math.min(...patches.map(p=>p.gapMm));
 // For this closed variant, a separating plane must exist between the complete
 // feet, including toes. Pad contact alone must not hide a curled toe crossing
 // into the opposite foot. This is conservative, not a general mesh solver.
 const plane=patches.reduce((sum,p)=>sum+new THREE.Vector3().fromArray(p.leftPoint).add(new THREE.Vector3().fromArray(p.rightPoint)).multiplyScalar(.5).dot(axis),0)/patches.length;
 const overrun=(foot,direction,sign)=>Math.max(0,...foot.meshes.filter(Boolean).map(mesh=>sign*(outerPoint(mesh,direction).dot(axis)-plane)));
 const padsMatch=alignment>=NORMAL_ALIGNMENT&&patches.every(p=>p.pass);
 const separatingPlaneOverrunMm=padsMatch?Math.max(overrun(feet.left,axis,1),overrun(feet.right,axis.clone().negate(),-1))*1000:null;
 return {name:'sole-pair',gapMm,minGapMm,alignment,minimumAlignment:NORMAL_ALIGNMENT,
  pass:padsMatch&&separatingPlaneOverrunMm<PENETRATION_MM,patches,separatingPlaneOverrunMm,
  note:'Closed sole-to-sole relation, not floor contact: opposing normals, aligned heel/forefoot pads and a conservative separating plane for both complete feet, including toes. Does not certify hand contact or arbitrary foot geometry.'};
}
