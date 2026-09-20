const POSE_ROUTE_PREFIX='/movement/poses/';

export function poseSlug(pose){
 const sourceKey=pose.source?.split('/').filter(Boolean).at(-1);
 const value=sourceKey||pose.name||pose.id;
 return value
  .replace(/([a-z0-9])([A-Z])/g,'$1-$2')
  .normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
  .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}

export function posePath(pose){return `${POSE_ROUTE_PREFIX}${poseSlug(pose)}`;}

export function poseSlugFromPath(pathname){
 const match=pathname.match(/^\/movement\/poses\/([^/]+)\/?$/);
 return match?decodeURIComponent(match[1]).toLowerCase():null;
}

export function findPoseByPath(poses,pathname){
 const slug=poseSlugFromPath(pathname);
 return slug?poses.find(pose=>poseSlug(pose)===slug)||null:null;
}
