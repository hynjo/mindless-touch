// Grounded, unbound preparation for the fixed-length mannequin. The full
// knee-to-ear fold and finger clasp remain separate, unvalidated relationships.
export const deafManCorrection={
 name:"Deaf Man's (Preparation)",draft:false,floorSupport:'ground',
 modification:'Grounded arms apart · Knees approach ears without a bind',
 rootPosition:[0,.3631427047347992,0],
 rotations:{
  pelvis:[-206,0,0],waist:[45,0,0],torso:[68,0,0],neck:[.4159528714528475,0,0],
  ...Object.fromEntries(['left','right'].flatMap(side=>[
   [side+'Hip',[-116,0,0]],[side+'Knee',[55.13933978319223,0,0]],
   [side+'Ankle',[35,0,0]],[side+'FootArch',[8,0,0]],
   [side+'Shoulder',[20.2955,0,(side==='left'?1:-1)*39.07114165175446]],
   [side+'Elbow',[-13.599976957581758,0,0]],[side+'Wrist',[3,0,0]],
  ])),
 },
};
