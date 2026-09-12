import * as THREE from 'three';
export function createFoot(ankle,side,material){
 const root=new THREE.Group();ankle.add(root);
 function pad(parent,position,scale){const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),material);mesh.position.set(...position);mesh.scale.set(...scale);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 const sole=pad(ankle,[0,-.033,-.025],[.035,.037,.037]);
 const arch=new THREE.Group();arch.position.set(0,-.012,.025);root.add(arch);
 const archJoint={id:`${side}FootArch`,label:'Foot arch',group:arch,isFootJoint:true,side};
 const bridge=pad(arch,[0,0,0],[.038,.023,.045]);
 const ball=pad(arch,[0,-.025,.058],[.061,.025,.034]);
 const joints=[],meshes=[sole,bridge,ball],sign=side==='left'?1:-1;
 const toes=[['Big',-.041,[.030,.021],.012],['Second',-.018,[.023,.017,.012],.009],['Middle',.003,[.021,.015,.011],.0085],['Fourth',.022,[.018,.013,.010],.008],['Little',.039,[.014,.011,.009],.007]];
 for(const [name,x,lengths,radius] of toes){
  const mount=new THREE.Group();mount.position.set(sign*x,-.024,.071);arch.add(mount);let parent=mount;
  lengths.forEach((length,index)=>{
   const group=new THREE.Group();parent.add(group);if(index)group.position.z=lengths[index-1];
   const joint={id:`${side}Toe${name}${index+1}`,label:`${name} toe / ${index+1}`,group,side,segment:index,isToe:true,minBend:-45,maxBend:75};joints.push(joint);
   const r=Math.min(radius,length/2);
   const mesh=new THREE.Mesh(new THREE.CapsuleGeometry(r,Math.max(0,length-2*r),5,12),material);mesh.rotation.x=Math.PI/2;mesh.position.z=length/2;mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.fingerJoint=joint;group.add(mesh);meshes.push(mesh);
   parent=group;
  });
 }
 return {root,sole,archJoint,joints,meshes,side,wrist:ankle,isFoot:true};
}
export function setToeBend(joint,radians){joint.group.rotation.x=THREE.MathUtils.clamp(radians,THREE.MathUtils.degToRad(joint.minBend),THREE.MathUtils.degToRad(joint.maxBend));}
export function applyToePreset(foot,name){const angle={open:0,relaxed:-20,wrap:35}[name];for(const joint of foot.joints)setToeBend(joint,THREE.MathUtils.degToRad(angle));}

export function setFootShape(foot,amount){
 foot.archJoint.group.rotation.x=THREE.MathUtils.clamp(amount,-.45,.6);
}
export function applyFootShape(foot,name){
 const angles={neutral:[0,0],point:[.65,.30],flex:[-.40,-.16]}[name];
 if(!angles)throw new Error(`Unknown foot shape: ${name}`);
 foot.wrist.rotation.x=angles[0];setFootShape(foot,angles[1]);
 for(const joint of foot.joints)setToeBend(joint,0);
}
