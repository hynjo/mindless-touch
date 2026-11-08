// Grounded Cobra, with bent elbows and an extended lumbar/thoracic spine.
// The hand mount offset clears the rigid forearm capsule without changing bones.
const pair=(joint,x)=>({['left'+joint]:[x,0,0],['right'+joint]:[x,0,0]});
export const cobraCorrection={
 draft:false,
 rootPosition:[0,.11590666912428237,0],
 handOffsets:{left:[0,0,-.025],right:[0,0,-.025]},
 rotations:{pelvis:[90,0,0],waist:[-22,0,0],torso:[-32,0,0],neck:[-5.24300011228033,0,0],
  ...pair('Hip',-1.805963029761754),...pair('Knee',.48572509833572086),
  ...pair('Ankle',41.558671143961014),...pair('Shoulder',-74),
  ...pair('Elbow',-30.53),...pair('Wrist',-21.47)},
};
