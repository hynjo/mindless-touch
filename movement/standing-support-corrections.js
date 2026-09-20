import {ashtangaShapes} from './ashtanga-shapes.js';
import {normalizeRotations} from './pose-shapes.js';

// Authored corrections for the current mannequin. Keep draft status: passing
// contact/envelope checks does not establish exact reference alignment.
export const standingSupportCorrections={
 WarriorI:{rotations:normalizeRotations(structuredClone(ashtangaShapes['Warrior I'])),cue:'Both soles grounded. Shallow front-knee bend for the current mannequin.'},
 WarriorII:{rotations:normalizeRotations(structuredClone(ashtangaShapes['Warrior II'])),cue:'Both soles grounded. Shallow front-knee bend; open the chest and reach both arms out.'},
 TriangleForward:{rotations:normalizeRotations(structuredClone(ashtangaShapes.Triangle)),cue:'Both soles grounded. Lower hand reaches toward the shin; modified depth.'},
 TriangleRevolved:{rotations:normalizeRotations({
  pelvis:[60,0,0],waist:[20,0,0],torso:[10,70,0],neck:[0,-35,0],
  leftHip:[-85,0,0],rightHip:[-35,0,0],leftFootArch:[8,0,0],rightFootArch:[8,0,0],
  leftAnkle:[25,0,0],rightAnkle:[-25,30,0],
  leftShoulder:[-90,0,110],rightShoulder:[-90,0,-70],
 }),cue:'Ground both soles and reach the lower hand to the floor while lifting the opposite arm.'},
};
