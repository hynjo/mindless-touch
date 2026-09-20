export const bodyParts={
 head:{label:'Head',color:'#e4d5ae'},
 chest:{label:'Chest',color:'#7cbdd0'},
 waist:{label:'Waist',color:'#b49bd8'},
 pelvis:{label:'Pelvis',color:'#df9eac'},
 arms:{label:'Arms',color:'#e4b88c',rightColor:'#c78f70'},
 hands:{label:'Wrists',color:'#ead597',rightColor:'#c9b275'},
 legs:{label:'Legs',color:'#9bcaae',rightColor:'#6eaa96'},
 feet:{label:'Ankles',color:'#a8bce3',rightColor:'#7f91bc'},
};
// Mesh-local shading follows each joint as it bends or rotates.
// Fingers curl toward local -Z, so the back of a hand is +Z.
function dorsalSeam(material,{hand=false,palm=false}={}){
 material.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec3 vBodyOrientation;\nvarying vec3 vBodyPosition;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nvBodyOrientation = normal;');
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvBodyPosition = position;');
  shader.fragmentShader='varying vec3 vBodyOrientation;\nvarying vec3 vBodyPosition;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   vec3 bodyNormal = normalize(vBodyOrientation);
   float seam = ${palm?'(1.0-smoothstep(0.004,0.007,abs(vBodyPosition.x))) * (1.0-smoothstep(0.032,0.043,abs(vBodyPosition.y)))':'(1.0-smoothstep(0.065,0.10,abs(bodyNormal.x))) * (1.0-smoothstep(0.65,0.75,abs(bodyNormal.y)))'}
     * smoothstep(0.70,0.82,${hand?'':'-'}bodyNormal.z);
   diffuseColor.rgb *= mix(1.0,0.62,seam);`);
 };
 material.customProgramCacheKey=()=>`body-dorsal-seam-v2-${hand}-${palm}`;
 return material;
}
export function colorBody({root,joints,bodyMaterial}){
 const materials={};
 for(const [part,{color,rightColor}] of Object.entries(bodyParts)){
  for(const side of ['left','right']){
   const material=bodyMaterial.clone();material.color.set(side==='right'?(rightColor||color):color);
   if(part!=='feet')dorsalSeam(material,{hand:part==='hands'});
   if(part==='hands'){
    materials['palm'+side]=dorsalSeam(material.clone(),{hand:true,palm:true});
    const nail=bodyMaterial.clone();nail.color.set(side==='left'?'#f6eacb':'#e4d4ab');nail.roughness=.55;materials['nail'+side]=nail;
   }
   materials[part+side]=material;
  }
 }
 const groups=new Map(joints.map(joint=>[joint.group,joint]));
 root.traverse(mesh=>{
  if(!mesh.isMesh)return;
  let parent=mesh.parent,joint;
  while(parent&&!joint){joint=groups.get(parent);parent=parent.parent;}
  if(!joint)return;
  const id=joint.id;
  const part=(joint.isToe||joint.isFootJoint)?'feet':joint.isFinger||id.endsWith('Wrist')?'hands':id==='neck'?'head':id==='torso'?'chest':id==='waist'?'waist':id==='pelvis'?'pelvis':/Shoulder|Elbow/.test(id)?'arms':id.endsWith('Ankle')?'feet':'legs';
  const side=id.startsWith('right')?'right':'left';
  mesh.userData.bodyPart=part;mesh.userData.bodySide=id.startsWith('right')?'right':id.startsWith('left')?'left':null;mesh.userData.bodyMaterial=materials[(mesh.userData.handNail?'nail':part==='hands'&&mesh.userData.boxHalfExtents?'palm':part)+side];
  if(!mesh.userData.joint)mesh.material=mesh.userData.bodyMaterial;
 });
}
