import * as THREE from 'three';
import {createBody} from './body.js';
import {yogaPoses} from './poses.js';
import {planSupportedRoute} from './supported-route-planner.js';
import {selectedRoutePoses} from './route-suggestions.js';
self.onmessage=({data})=>{
 try{
  const material=new THREE.MeshStandardMaterial(),rig=createBody({scene:new THREE.Scene(),dimensions:data.dimensions,bodyMaterial:material,jointMaterial:material});
  rig.dimensions=data.dimensions;rig.byId=Object.fromEntries(rig.joints.map(j=>[j.id,j]));rig.meshes=[];rig.root.traverse(m=>{if(m.isMesh)rig.meshes.push(m)});
  const candidates=selectedRoutePoses(yogaPoses,data.candidateIds);
  self.postMessage(planSupportedRoute(rig,data.from,data.to,candidates));
 }catch(error){self.postMessage({status:'error',message:error.message});}
};
