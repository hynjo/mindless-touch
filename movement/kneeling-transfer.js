import * as T from 'three';
import {capturePose,restorePose} from './pole-constraints.js';
import {blendHandOffsets} from './hand-offsets.js';
import {solve} from './rig.js';
import {floorClearance} from './floor-constraints.js';
import {inspectSupports,inspectJointRanges} from './pose-validation.js';
import {createSelfConstraints} from './self-constraints.js';

const sides=['left','right'],rad=T.MathUtils.degToRad,lerp=T.MathUtils.lerp;
const pos=g=>g.getWorldPosition(new T.Vector3());
const q=a=>new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),a);
const orient=(g,value)=>g.quaternion.copy(g.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(value));
export function interpolateTransferFrame(rig,a,b,t){
 blendHandOffsets(rig.root,a.handOffsets,b.handOffsets,t);
 rig.root.position.lerpVectors(a.position,b.position,t);
 rig.joints.forEach((j,i)=>j.group.quaternion.slerpQuaternions(a.rotations[i],b.rotations[i],t));
 rig.root.updateWorldMatrix(true,true);
}
export function inspectTransferFrame(rig,self,requirements){
 const supports=inspectSupports(rig,{supportRequirements:requirements}).issues;
 if(!requirements.length||supports.length)return {reason:'support',supports};
 const ranges=inspectJointRanges(rig.joints).issues;if(ranges.length)return {reason:'joint-range',ranges};
 const wrists=self.jointViolations();if(wrists.length)return {reason:'wrist',wrists};
 const body=self.contacts(0),hands=self.externalContacts(1e-9);
 if(body.length||hands.length)return {reason:'collision',body,hands};
 const clearance=Math.min(...rig.meshes.map(floorClearance));
 if(clearance<.00068)return {reason:'floor',clearance};
 return null;
}

// A bounded contact-transfer primitive for the current planar rig. It starts
// from a measured bilateral palm/sole landing, not an arbitrary library pose.
// Each leg moves separately. The support set changes only after landing;
// untucking is permitted only after both knee regions have acquired support.
// This certifies sampled geometry, not forces or balance.
export function solveKneelingTransfer(rig,target){
 const saved=capturePose(rig.root,rig.joints),self=createSelfConstraints(rig),phases=[];
 const joint=id=>rig.byId[id].group,d=rig.dimensions;
 const anchors=Object.fromEntries(sides.map(side=>[side,{hand:pos(rig.hands[side].wrist),foot:pos(joint(side+'Ankle')),elbow:pos(joint(side+'Elbow'))}]));
 const entryPelvis=joint('pelvis').rotation.x,entryChest=joint('torso').rotation.x;
 let stage='initial';
 function reject(failure){throw {transferFailure:true,stage,...failure};}
 function leg(side,point,angle){
  const hip=joint(side+'Hip'),knee=joint(side+'Knee'),delta=point.clone().sub(pos(hip)),length=delta.length();
  if(length>d.thigh+d.shin-.0001||length<.001||Math.abs(delta.x)>.001)reject({reason:'leg-reach'});
  const base=Math.atan2(-delta.z,-delta.y),offset=Math.acos(T.MathUtils.clamp((d.thigh**2+length**2-d.shin**2)/(2*d.thigh*length),-1,1));
  orient(hip,q(base-offset));knee.rotation.set(Math.PI-Math.acos(T.MathUtils.clamp((d.thigh**2+d.shin**2-length**2)/(2*d.thigh*d.shin),-1,1)),0,0);orient(joint(side+'Ankle'),q(angle));
 }
 function arms(){for(const side of sides){
  const shoulder=joint(side+'Shoulder'),elbow=joint(side+'Elbow'),wrist=rig.hands[side].wrist,point=anchors[side].hand;
  if(pos(shoulder).distanceTo(point)>d.upperArm+d.forearm-.0001)reject({reason:'arm-reach'});
  solve({upper:shoulder,middle:elbow,a:d.upperArm,b:d.forearm},point,anchors[side].elbow);
  const u=pos(elbow).sub(pos(shoulder)).normalize(),v=pos(wrist).sub(pos(elbow)).normalize(),x=v.clone().cross(u),y=u.clone().negate();
  if(x.lengthSq()>1e-10){x.normalize();orient(shoulder,new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x,y,x.clone().cross(y))));elbow.rotation.set(-u.angleTo(v),0,0);}
  orient(wrist,q(-Math.PI/2));
 }}
 function phase(name,requirements,sample){
  stage=name;const start=capturePose(rig.root,rig.joints),frames=[start];
  const initial=inspectTransferFrame(rig,self,requirements);if(initial)reject(initial);
  for(let i=1;i<=240;i++){
   restorePose(rig.root,rig.joints,start);sample(i/240);rig.root.updateWorldMatrix(true,true);
   const failure=inspectTransferFrame(rig,self,requirements);if(failure)reject({progress:i/240,...failure});
   frames.push(capturePose(rig.root,rig.joints));
  }
  // Use the same interpolator as playback, including hand mounts. Check the
  // spaces between snapshots too; floor contact can fail under quaternion blend.
  restorePose(rig.root,rig.joints,start);self.sync();
  for(let edge=1;edge<frames.length;edge++)for(let part=1;part<=4;part++){
   interpolateTransferFrame(rig,frames[edge-1],frames[edge],part/4);
   const failure=inspectTransferFrame(rig,self,requirements);
   if(failure)reject({edge,part,...failure});
   if(!self.commit())reject({reason:'swept-collision',edge,part,detail:self.failure()});
  }
  phases.push({name,supportRequirements:requirements,frames});
 }
 try{
  const initial=inspectTransferFrame(rig,self,['palms','soles']);if(initial)reject(initial);
  // These are deterministic search results for the current mannequin, kept as
  // an explicit primitive rather than a name-based exemption from validation.
  for(const side of sides){
   const other=side==='left'?'right':'left';
   phase(`Step ${side} foot back`,['palms',other+(side==='left'?'-sole':'-forefoot')],t=>{
    if(side==='left'){
     rig.root.position.y=lerp(saved.position.y,.72,t);rig.root.position.z=lerp(saved.position.z,-.04,t);
     joint('pelvis').rotation.x=lerp(entryPelvis,rad(85),t);
     joint('torso').rotation.x=lerp(entryChest,rad(70),t);
     leg('right',anchors.right.foot,0);
    }
    const point=anchors[side].foot.clone().lerp(new T.Vector3(anchors[side].foot.x,.1161,-.6),t);point.y+=Math.sin(Math.PI*t)*.12;
    for(const j of rig.feet[side].joints)j.group.rotation.x=j.segment===0?-rad(40)*t:0;
    leg(side,point,rad(40)*t+rad(35)*Math.sin(Math.PI*t));arms();
   });
  }
  const standing=capturePose(rig.root,rig.joints),balls=Object.fromEntries(sides.map(side=>[side,pos(rig.feet[side].meshes[2])])),standingArch=rig.feet.left.archJoint.group.rotation.x;
  function lower(t,height,fitArms=true){
   rig.root.position.y=lerp(.72,height,t);rig.root.position.z=lerp(-.04,-.08,t);
   joint('pelvis').rotation.x=rad(lerp(85,110,t));joint('waist').rotation.x=rad(lerp(4,-20,t));joint('torso').rotation.x=rad(lerp(70,-20,t));
   for(const side of sides){
    const foot=rig.feet[side],angle=rad(lerp(40,60,t));
    foot.archJoint.group.rotation.x=lerp(standingArch,-rad(15),t);
    for(const j of foot.joints)j.group.rotation.x=j.segment===0?-rad(lerp(40,45,t)):0;
    orient(foot.wrist,q(angle));rig.root.updateWorldMatrix(true,true);
    const point=pos(foot.wrist),ball=foot.meshes[2];point.x+=balls[side].x-pos(ball).x;point.z+=balls[side].z-pos(ball).z;point.y+=.0007-floorClearance(ball);
    leg(side,point,angle);
   }
   if(fitArms)arms();
  }
  let lo=.2,hi=.6;
  for(let i=0;i<35;i++){
   const mid=(lo+hi)/2;restorePose(rig.root,rig.joints,standing);lower(1,mid,false);
   if(inspectSupports(rig,{supportRequirements:['knees']}).surfaces['left-knee'].gapMm>.02)hi=mid;else lo=mid;
  }
  restorePose(rig.root,rig.joints,standing);
  phase('Lower knees',['palms','forefeet'],t=>lower(t,(lo+hi)/2));
  const shinStart=new T.Euler().setFromQuaternion(joint('leftKnee').getWorldQuaternion(new T.Quaternion())).x;
  const kneeContactZ=pos(joint('leftKnee')).z-Math.sin(shinStart)*.063;
  const kneeContactY=pos(joint('leftKnee')).y-Math.cos(shinStart)*.063;
  function knees(angle){
   const kneeY=kneeContactY+.063*Math.cos(angle),kneeZ=kneeContactZ+.063*Math.sin(angle),hip=pos(joint('leftHip')),dz=kneeZ-hip.z;
   const dy=Math.sqrt(d.thigh**2-dz**2);if(!Number.isFinite(dy))reject({reason:'knee-reach'});
   rig.root.position.y+=kneeY+dy-hip.y;
   for(const side of sides){const base=Math.atan2(-dz,dy);orient(joint(side+'Hip'),q(base));joint(side+'Knee').rotation.set(angle-base,0,0);}
  }
  for(const [name,endShin,endAnkle,endArch,endToe] of [['Lift feet',103,80,-15,-45],['Untuck feet',103,153,T.MathUtils.radToDeg(.3),0],['Lower feet',90,140,T.MathUtils.radToDeg(.3),0]]){
   const startShin=new T.Euler().setFromQuaternion(joint('leftKnee').getWorldQuaternion(new T.Quaternion())).x;
   const startAnkle=new T.Euler().setFromQuaternion(rig.feet.left.wrist.getWorldQuaternion(new T.Quaternion())).x,startArch=rig.feet.left.archJoint.group.rotation.x,startToe=rig.feet.left.joints[0].group.rotation.x;
   phase(name,['palms','knees'],t=>{
    knees(lerp(startShin,rad(endShin),t));
    for(const side of sides){orient(rig.feet[side].wrist,q(lerp(startAnkle,rad(endAnkle),t)));rig.feet[side].archJoint.group.rotation.x=lerp(startArch,rad(endArch),t);for(const j of rig.feet[side].joints)j.group.rotation.x=j.segment===0?lerp(startToe,rad(endToe),t):0;}
    arms();
   });
  }
  const kneeling=capturePose(rig.root,rig.joints);restorePose(rig.root,rig.joints,target);
  const targets=Object.fromEntries(sides.map(side=>[side,{hand:pos(rig.hands[side].wrist),knee:pos(joint(side+'Knee'))}]));
  restorePose(rig.root,rig.joints,kneeling);
  for(const side of sides){
   const start=anchors[side].hand.clone();
   phase(`Place ${side} palm`,['knees',(side==='left'?'right':'left')+'-palm'],t=>{anchors[side].hand.copy(start).lerp(targets[side].hand,t);anchors[side].hand.y+=Math.sin(Math.PI*t)*.06;arms();});
  }
  const kneeTargets=Object.fromEntries(sides.map(side=>[side,pos(joint(side+'Knee'))]));
  function targetKnees(rootZ){
   rig.root.position.z=rootZ;
   function height(roll){
    rig.root.quaternion.copy(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),roll).multiply(q(rad(110))));
    return sides.map(side=>{const h=pos(joint(side+'Hip')),k=kneeTargets[side];return k.y+Math.sqrt(d.thigh**2-(h.x-k.x)**2-(h.z-k.z)**2)-h.y;});
   }
   let lo=-.3,hi=.3;
   for(let n=0;n<35;n++){const mid=(lo+hi)/2,ys=height(mid);if(ys[0]>ys[1])lo=mid;else hi=mid;}
   const ys=height((lo+hi)/2);if(ys.some(y=>!Number.isFinite(y)))reject({reason:'knee-reach'});rig.root.position.y+=(ys[0]+ys[1])/2;
   for(const side of sides){
    const hip=joint(side+'Hip'),knee=joint(side+'Knee'),u=kneeTargets[side].clone().sub(pos(hip)).normalize(),v=new T.Vector3(0,0,-1),x=u.clone().cross(v).normalize(),y=u.clone().negate();
    orient(hip,new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x,y,x.clone().cross(y))));knee.rotation.set(u.angleTo(v),0,0);orient(rig.feet[side].wrist,q(rad(140)));
   }
  }
  for(const [name,side] of [['Shift body',null],['Place left knee','left'],['Place right knee','right']]){
   const start=side?kneeTargets[side].clone():null;
   phase(name,side?['palms',(side==='left'?'right':'left')+'-knee']:['palms','knees'],t=>{
    if(side){kneeTargets[side].copy(start).lerp(targets[side].knee,t);kneeTargets[side].y+=Math.sin(Math.PI*t)*.01;}
    targetKnees(side?target.position.z:lerp(-.08,target.position.z,t));arms();
   });
  }
  const finish=capturePose(rig.root,rig.joints);
  phase('Finish Cow',['palms','knees'],t=>interpolateTransferFrame(rig,finish,target,t));
  return {success:true,phases};
 }catch(error){if(error?.transferFailure)return {success:false,phases:[],failure:error};throw error;}
 finally{restorePose(rig.root,rig.joints,saved);}
}
