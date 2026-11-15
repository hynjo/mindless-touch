import * as THREE from 'three';
import {createAuditRig} from '../pose-audit.js';
import {applyPose} from '../apply-pose.js';
import {yogaPoses} from '../poses.js';
import {colorBody} from '../body-colors.js';

// Read-only diagnostic renderer. It uses a separate rig and never touches the
// editor, user storage, or the report's measured data.
const rig=createAuditRig(),scene=new THREE.Scene();scene.add(rig.root);
scene.background=new THREE.Color('#2d2c24');
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setSize(288,230,false);renderer.setPixelRatio(1);
scene.add(new THREE.HemisphereLight(0xffffff,0x55533b,1.8));
const light=new THREE.DirectionalLight(0xfff7e5,3.5);light.position.set(3,6,4);scene.add(light);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(30,30),new THREE.MeshStandardMaterial({color:'#27281f',roughness:1}));floor.rotation.x=-Math.PI/2;scene.add(floor);
const grid=new THREE.GridHelper(6,30,'#454631','#303126');grid.position.y=.002;scene.add(grid);
colorBody({root:rig.root,joints:rig.joints,bodyMaterial:rig.meshes[0].material});
rig.markers.forEach(marker=>{marker.visible=false;});
const camera=new THREE.PerspectiveCamera(35,288/230,.01,50),cache=new Map(),byKey=new Map(yogaPoses.map(p=>[p.source.split('/').at(-1),p]));
const directions={Front:new THREE.Vector3(0,.12,1),Side:new THREE.Vector3(1,.12,0),Perspective:new THREE.Vector3(1,.35,1.1)};
function render(key){
 if(cache.has(key))return cache.get(key);
 const pose=byKey.get(key);if(!pose)return [];
 applyPose(rig,pose,{floor:rig.floor});
 const bounds=new THREE.Box3();rig.meshes.forEach(mesh=>bounds.union(new THREE.Box3().setFromObject(mesh,true)));
 const center=bounds.getCenter(new THREE.Vector3()),radius=bounds.getSize(new THREE.Vector3()).length()/2;
 const distance=radius/Math.sin(THREE.MathUtils.degToRad(17.5))*1.08;
 const images=Object.entries(directions).map(([label,direction])=>{camera.position.copy(center).addScaledVector(direction.clone().normalize(),distance);camera.lookAt(center);renderer.render(scene,camera);return {label,src:renderer.domElement.toDataURL('image/png')};});
 cache.set(key,images);return images;
}
function show(card){
 if(card.dataset.previewReady)return;
 const target=card.querySelector('.previews');
 for(const {label,src} of render(card.dataset.key)){const figure=document.createElement('figure'),image=document.createElement('img'),caption=document.createElement('figcaption');image.src=src;image.alt=`${card.querySelector('h2').textContent} — ${label}`;image.width=288;image.height=230;caption.textContent=label;figure.append(image,caption);target.append(figure);}
 card.dataset.previewReady='true';
}
const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){show(entry.target);observer.unobserve(entry.target);}},{rootMargin:'400px'});
document.querySelectorAll('article[data-key]').forEach(card=>observer.observe(card));
window.auditPreviews={
 count:()=>cache.size,
 async renderAll(){for(const card of document.querySelectorAll('article[data-key]')){show(card);await new Promise(resolve=>setTimeout(resolve,0));}return {poses:cache.size,views:cache.size*3};},
 async sheet(start=0,count=18,view='Perspective'){
  const poses=yogaPoses.slice(start,start+count),columns=3,width=320,height=270,canvas=document.createElement('canvas');canvas.width=columns*width;canvas.height=Math.ceil(poses.length/columns)*height;const context=canvas.getContext('2d');context.fillStyle='#10110d';context.fillRect(0,0,canvas.width,canvas.height);
  for(const [i,pose] of poses.entries()){const key=pose.source.split('/').at(-1),item=render(key).find(p=>p.label===view),image=new Image();image.src=item.src;await image.decode();const x=i%columns*width,y=Math.floor(i/columns)*height;context.drawImage(image,x,y+28,width,240);context.fillStyle='#eeeddb';context.font='13px system-ui';context.fillText(`${start+i+1}. ${pose.name}`,x+8,y+19,width-16);}
  return canvas.toDataURL('image/png');
 },
};
