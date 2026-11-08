import * as T from 'three';
import {capturePose,restorePose} from './pole-constraints.js';
import {solve} from './rig.js';
import {inspectSupports,inspectJointRanges} from './pose-validation.js';
import {createSelfConstraints} from './self-constraints.js';
import {floorClearance} from './floor-constraints.js';
const pos=g=>g.getWorldPosition(new T.Vector3());
const orientation=(g,q)=>g.quaternion.copy(g.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(q));
// Bounded deterministic first-stage planner: soles remain anchored while seeking
// a bilateral palm landing. It never settles the entire body to hide penetration.
export function solveFloorEntry(rig,{samples=240}={}){
 if(!Number.isInteger(samples)||samples<10||samples>240)throw new RangeError('samples must be 10–240');
 const saved=capturePose(rig.root,rig.joints),self=createSelfConstraints(rig),attempts=[];
 const startPelvis=rig.byId.pelvis.group.rotation.x,startChest=rig.byId.torso.group.rotation.x;
 const feet=Object.fromEntries(['left','right'].map(side=>{const g=rig.byId[side+'Ankle'].group;return [side,{position:pos(g),rotation:g.getWorldQuaternion(new T.Quaternion())}];}));
 function inspect(palms=false){
  rig.root.updateWorldMatrix(true,true);
  const supports=inspectSupports(rig,{supportRequirements:palms?['soles','palms']:['soles']});
  const rom=inspectJointRanges(rig.joints).issues,body=self.contacts(0),hands=self.externalContacts(1e-9),wrists=self.jointViolations();
  const clearance=Math.min(...rig.meshes.map(floorClearance));
  const drift=Math.max(...['left','right'].map(side=>pos(rig.byId[side+'Ankle'].group).distanceTo(feet[side].position)));
  return {pass:!supports.issues.length&&!rom.length&&!body.length&&!hands.length&&!wrists.length&&clearance>=.00068&&drift<.0005,supports:supports.issues,rom,body,hands,wrists,clearance,drift};
 }
 try{
  const initial=inspect();if(!initial.pass)return {success:false,stage:'initial',attempts,initial};
  // Ordered geometry candidates, no random seed or acceptance by penalty alone.
  for(const height of [.75,.65,.55,.45])for(const forward of [.35,.45,.55])for(const width of [.22,.32,.42])for(const pelvisAngle of [90,70,50])for(const chestAngle of [25,45,65]){
   restorePose(rig.root,rig.joints,saved);const frames=[capturePose(rig.root,rig.joints)];let failure;
   const armStart=Object.fromEntries(['left','right'].map(side=>[side,{position:pos(rig.hands[side].wrist),rotation:rig.hands[side].wrist.getWorldQuaternion(new T.Quaternion())}]));
   for(let i=1;i<=samples;i++){
    const t=i/samples;
    restorePose(rig.root,rig.joints,saved);rig.root.position.y=T.MathUtils.lerp(saved.position.y,height,Math.max(0,(t-.3)/.7));rig.byId.torso.group.rotation.x=T.MathUtils.lerp(startChest,chestAngle*Math.PI/180,t);rig.byId.pelvis.group.rotation.x=T.MathUtils.lerp(startPelvis,pelvisAngle*Math.PI/180,t);rig.root.updateWorldMatrix(true,true);
    for(const side of ['left','right']){
     const hip=rig.byId[side+'Hip'].group,knee=rig.byId[side+'Knee'].group,ankle=rig.byId[side+'Ankle'].group;
     const h=pos(hip),target=feet[side].position,d=target.clone().sub(h),length=d.length(),a=rig.dimensions.thigh,b=rig.dimensions.shin;
     if(length>a+b||Math.abs(d.x)>.001){failure={reason:'Leg reach or lateral target',length};break;}
     const base=Math.atan2(-d.z,-d.y),offset=Math.acos(T.MathUtils.clamp((a*a+length*length-b*b)/(2*a*length),-1,1));
     const world=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),base-offset);
     orientation(hip,world);knee.rotation.set(Math.PI-Math.acos(T.MathUtils.clamp((a*a+b*b-length*length)/(2*a*b),-1,1)),0,0);orientation(ankle,feet[side].rotation);
     const shoulder=rig.byId[side+'Shoulder'].group,elbow=rig.byId[side+'Elbow'].group,wrist=rig.hands[side].wrist;
     const final=new T.Vector3((side==='left'?1:-1)*width,.0157-rig.hands[side].root.position.z,forward);
     const handTarget=armStart[side].position.clone().lerp(final,t);handTarget.x+=(side==='left'?1:-1)*Math.sin(Math.PI*t)*.15;handTarget.y+=Math.sin(Math.PI*t)*.1;
     solve({upper:shoulder,middle:elbow,a:rig.dimensions.upperArm,b:rig.dimensions.forearm},handTarget,pos(elbow).add(new T.Vector3(0,.05,-.1)));
     const u=pos(elbow).sub(pos(shoulder)).normalize(),v=pos(wrist).sub(pos(elbow)).normalize();
     const x=v.clone().cross(u),y=u.clone().negate();
     if(x.lengthSq()>1e-10){x.normalize();orientation(shoulder,new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x,y,x.clone().cross(y))));elbow.rotation.set(-u.angleTo(v),0,0);}
     orientation(wrist,armStart[side].rotation.clone().slerp(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-Math.PI/2),t));
    }
    if(failure)break;
    const report=inspect(i===samples);
    if(!report.pass){failure={progress:t,...report};break;}
    frames.push(capturePose(rig.root,rig.joints));
   }
   if(!failure){
    restorePose(rig.root,rig.joints,frames[0]);self.sync();
    for(let edge=1;edge<frames.length&&!failure;edge++)for(let part=1;part<=4;part++){
     const a=frames[edge-1],b=frames[edge],t=part/4;
     rig.root.position.lerpVectors(a.position,b.position,t);rig.joints.forEach((j,k)=>j.group.quaternion.slerpQuaternions(a.rotations[k],b.rotations[k],t));
     const report=inspect(edge===frames.length-1&&part===4);
     if(!report.pass||!self.commit()){failure={reason:'Between-frame validation',edge,part,...report,collision:self.failure()};break;}
    }
   }
   attempts.push({height,forward,width,pelvisAngle,chestAngle,failure:failure||null,acceptedFrames:frames.length-1});
   if(!failure)return {success:true,stage:'palms-and-soles',frames,attempts};
  }
  return {success:false,stage:'palms-and-soles',attempts};
 }finally{restorePose(rig.root,rig.joints,saved);}
}
