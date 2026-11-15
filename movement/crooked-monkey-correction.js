// Left foot forward; right palm and right knee support the twist. The left
// fingers hook the raised rear heel. Authored for the current fixed proportions.
export const crookedMonkeyCorrection={
 draft:false,rootPosition:[0,.29527,0],floorSupport:'ground',
 cue:'Ground the front sole, opposite knee and supporting palm. Turn the chest and hold the raised rear heel with the free hand.',
 rotations:{
  pelvis:[20,0,0],waist:[10,0,0],torso:[15,61.0781306158723,-4.59898390530884],neck:[-15,-20,0],
  leftHip:[-123.59017102911,-27.994364249184,13.5709790910372],leftKnee:[78.0531055409713,0,0],
  leftAnkle:[35.1189095194263,4.31663273759074,-22.9216588150541],leftFootArch:[8,0,0],
  rightHip:[42,-8.76891955273728,15],rightKnee:[145,0,0],rightAnkle:[20,0,0],
  rightShoulder:[-99.7634657102625,-62.9644225541951,-83.4429722097365],rightElbow:[-24.1841808714841,0,0],
  rightWrist:[-73.5930399278314,-5.57232729977366,28.1798754690873],
  leftShoulder:[66.4462745714472,-46.0753507126696,35.347511036622],leftElbow:[-81.2075059643361,0,0],
  leftWrist:[-38.2580583245566,8.96210732291909,-3.04381841425218],
  leftThumb1:[66.6099544622346,37.5441174823005,17.8090417840573],leftThumb2:[46.6269681235642,0,0],
  ...Object.fromEntries(['Index','Middle','Ring','Little'].flatMap(finger=>[52.578115989973,47.0273885380541,25].map((bend,i)=>[`left${finger}${i+1}`,[bend,0,0]]))),
 },
};
