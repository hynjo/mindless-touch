import {ashtangaShapes} from './ashtanga-shapes.js';

const clone=value=>structuredClone(value);
const base={
 ...clone(ashtangaShapes.Bridge),
 leftShoulder:[18.55,-.783,-3.98],rightShoulder:[18.55,.783,3.98],
 leftElbow:[-.748,.013,-2.057],rightElbow:[-.748,-.013,2.057],
};
const supported={
 ...clone(ashtangaShapes.Bridge),
 leftShoulder:[25.801,-23.771,8.956],rightShoulder:[25.801,23.771,-8.956],
 leftElbow:[-73.574,0,0],rightElbow:[-73.574,0,0],
 leftWrist:[-18,0,-18],rightWrist:[-18,0,18],
};
const liftedLeg={leftHip:[-90,0,0],leftKnee:[0,0,0],leftAnkle:[0,0,0],leftFootArch:[8,0,0]};

export const bridgeCorrection={
 rootPosition:[0,.97,0],rotations:base,floorSupport:'ground',poseContract:'bridge-interlaced-v1',
 cue:'Press through both feet and upper arms while lifting the chest and pelvis.',
 modification:'Upper arms pressing alongside the torso',draft:false,
};

const variant=(id,name,source,difficulty,rotations,supportRequirements,cue,modification)=>({
 id:`library-${id}`,name,category:'Reclining',difficulty,draft:true,
 source:`https://www.pocketyoga.com/pose/${source}`,rootPosition:[0,.97,0],rotations,
 floorSupport:'ground',supportRequirements,cue,modification,holdSeconds:3,transitionSeconds:2.2,
});

export const bridgeVariations=[
 variant('BridgeSupported','Supported Bridge','BridgeSupported','intermediate',supported,['soles','back','back-head'],'Keep both feet grounded and support the lifted pelvis with both hands.','Hands support the lower back'),
 variant('BridgeLegUp','One Legged Bridge','BridgeLegUp','intermediate',{...clone(base),...liftedLeg},['any-sole','back','back-head','upper-arms'],'Keep the pelvis lifted while extending the left leg upward.','Left leg lifted'),
 variant('BridgeLegUpSupported','One Legged Supported Bridge','BridgeLegUpSupported','intermediate',{...clone(supported),...liftedLeg},['any-sole','back','back-head'],'Support the pelvis with both hands while extending the left leg upward.','Hands support the lower back · Left leg lifted'),
 variant('SetuPreparation','Extended Bridge (Preparation)','SetuPreparation','expert',{
  pelvis:[-74,0,0],waist:[-18,0,0],torso:[-22,0,0],neck:[-18,0,0],
  leftHip:[-98,-48,30],rightHip:[-98,48,-30],leftKnee:[92,0,0],rightKnee:[92,0,0],
  leftShoulder:[61.829,36.791,15.623],rightShoulder:[61.829,-36.791,-15.623],leftElbow:[-48.05,0,0],rightElbow:[-48.05,0,0],
 },['forearms','head'],'Press the forearms down, lift the chest and rest lightly on the crown of the head.','Preparation · Bound-angle legs'),
];

export const bridgeRouteEntries=[
 {name:'Bridge',source:'/Bridge'},
 ...bridgeVariations.map(({name,source})=>({name,source})),
];
