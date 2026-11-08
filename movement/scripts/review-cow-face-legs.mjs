// Offline, deterministic geometry search. Writes a candidate, never the catalog.
import * as T from 'three';
import {writeFile} from 'node:fs/promises';
import {createBody} from '../body.js';
import {cowFaceCorrection} from '../cow-face-correction.js';
import {floorClearance} from '../floor-constraints.js';
import {inspectJointRanges,inspectSupports} from '../pose-validation.js';
import {createSelfConstraints} from '../self-constraints.js';
const dimensions={pelvisHeight:.97,torso:.48,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43},material=new T.MeshStandardMaterial();
const rig=createBody({scene:new T.Scene(),dimensions,bodyMaterial:material,jointMaterial:material});rig.dimensions=dimensions;rig.byId=Object.fromEntries(rig.joints.map(j=>[j.id,j]));rig.meshes=[];rig.root.traverse(m=>{if(m.isMesh)rig.meshes.push(m)});
rig.root.position.fromArray(cowFaceCorrection.rootPosition);for(const j of rig.joints)j.group.rotation.set(...(cowFaceCorrection.rotations[j.id]||[0,0,0]).map(T.MathUtils.degToRad));
const self=createSelfConstraints(rig),pos=g=>g.getWorldPosition(new T.Vector3()),rad=T.MathUtils.degToRad;
const orient=(g,q)=>g.quaternion.copy(g.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(q));
const legJoints=rig.joints.filter(j=>/Hip|Knee|Ankle|FootArch|Toe/.test(j.id));
function leg(side,k,phi,ankles){
 const h=rig.byId[side+'Hip'].group,knee=rig.byId[side+'Knee'].group,ankle=rig.feet[side].wrist;
 let height=.09;
 for(let iteration=0;iteration<7;iteration++){
  const horizontal=Math.sqrt(Math.max(.00001,.43**2-(height-k.y)**2));
  const end=new T.Vector3(k.x+Math.cos(rad(phi))*horizontal,height,k.z+Math.sin(rad(phi))*horizontal);
  const u=k.clone().sub(pos(h)).normalize(),v=end.sub(k).normalize(),x=u.clone().cross(v).normalize(),y=u.clone().negate();
  orient(h,new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x,y,x.clone().cross(y))));knee.rotation.set(u.angleTo(v),0,0);ankle.rotation.set(...ankles.map(rad));rig.root.updateWorldMatrix(true,true);
  const gap=Math.min(pos(ankle).y-.047,...rig.feet[side].meshes.map(floorClearance));height+=.00075-gap;
 }
}
function measure(v){
 const [lower,delta,dx,dz,phiL,phiR,...ankles]=v,hipY=rig.root.position.y-.04,upper=lower+delta;
 const A=2*dz/(4*(.11-dx/2)),B=((lower-hipY)**2-(upper-hipY)**2)/(4*(.11-dx/2)),C=B+dx/2-.11;
 const a=A*A+1,b=2*A*C+dz,c=C*C+dz*dz/4+(lower-hipY)**2-.43**2,discriminant=b*b-4*a*c;
 if(discriminant<0)return {cost:1e10};
 const z=(-b+Math.sqrt(discriminant))/(2*a),center=A*z+B,leftX=center+dx/2,rightX=center-dx/2;
 if(z<.15)return {cost:1e10};
 leg('left',new T.Vector3(leftX,lower,z+dz/2),phiL,ankles.slice(0,3));leg('right',new T.Vector3(rightX,upper,z-dz/2),phiR,ankles.slice(3));
 const rom=inspectJointRanges(legJoints).issues,body=self.contacts(0),floor=Math.min(...rig.meshes.map(floorClearance));
 const anklePositions=['left','right'].map(s=>pos(rig.feet[s].wrist));
 const folded=['left','right'].every(s=>rig.byId[s+'Knee'].group.rotation.x>rad(110));
 const cost=rom.reduce((n,i)=>n+i.excessDegrees**2*1000,0)+body.reduce((n,c)=>n+c.depth**2*1e8,0)+Math.max(0,.00068-floor)**2*1e8+Math.max(0,anklePositions[0].z-.2)**2*1e5+Math.max(0,anklePositions[1].z-.2)**2*1e5+(folded?0:100000);
 return {cost,rom,body,floor,folded,positions:{leftKnee:pos(rig.byId.leftKnee.group).toArray(),rightKnee:pos(rig.byId.rightKnee.group).toArray(),ankles:anklePositions.map(v=>v.toArray())}};
}
const ranges=[[.12,.30],[.08,.20],[-.20,.19],[-.25,.25],[-120,0],[-180,-60],[-40,50],[-90,90],[-25,25],[-40,50],[-90,90],[-25,25]],steps=[.02,.012,.02,.02,10,10,12,15,8,12,15,8];
let state=739;const random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296);
let best={cost:Infinity},valid;
for(let restart=0;restart<10;restart++){
 let v=[.2,.1547,.11397,.04578,-33.47,-174.63,-14.98,17.57,15.49,12.82,-18.13,-8.5];if(restart)v=ranges.map(([a,b],i)=>i<6?a+random()*(b-a):0);
 let current=measure(v);
 for(let i=0;i<2500;i++){
  const next=[...v],k=Math.floor(random()*v.length);next[k]=T.MathUtils.clamp(next[k]+(random()-.5)*2*steps[k]*(i>1800?.25:1),...ranges[k]);
  const candidate=measure(next);
  if(candidate.cost<current.cost){v=next;current=candidate;}
  if(candidate.cost<best.cost){best={...candidate,parameters:next};}
  // Physical clearance alone accepted an asymmetric squat in the first search.
  // Keep the feet behind the knees and close to the seated pelvis as well.
  const feetBack=candidate.positions?.ankles.every((p,index)=>p[2]<=.2&&p[2]<candidate.positions[index===0?'leftKnee':'rightKnee'][2]-.08);
  if(feetBack&&candidate.folded&&candidate.rom?.length===0&&candidate.body.length===0&&candidate.floor>=.00068){valid={...candidate,parameters:next};break;}
 }
 console.log(restart,best.cost,Boolean(valid));if(valid)break;
}
const result=valid||best;measure(result.parameters);const supports=inspectSupports(rig,{supportRequirements:['sit-bones']});
result.success=!!valid&&!supports.issues.length&&!self.externalContacts(1e-9).length&&!self.jointViolations().length;
result.pose={rootPosition:rig.root.position.toArray(),rotations:Object.fromEntries(rig.joints.map(j=>[j.id,j.group.rotation.toArray().slice(0,3).map(T.MathUtils.radToDeg)]))};
await writeFile('/tmp/cow-face-leg-candidate.json',JSON.stringify(result,null,2));console.log(JSON.stringify({...result,pose:undefined},null,2));
