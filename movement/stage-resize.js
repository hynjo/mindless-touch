// Resize the stage, not the WebGL drawing buffer. The viewport's existing
// ResizeObserver updates the camera and renderer after each layout change.
export function enableStageResize(stage){
 const handle=document.createElement('div');
 handle.className='stage-resize-handle';handle.tabIndex=0;
 handle.setAttribute('role','separator');handle.setAttribute('aria-orientation','horizontal');
 handle.setAttribute('aria-label','Resize 3D view height');
 handle.setAttribute('aria-controls','viewport');
 handle.title='Drag to resize. Arrow keys adjust height. Double-click or Enter to reset.';
 handle.textContent='Resize view';stage.append(handle);
 const minimum=420,maximum=()=>Math.max(1200,window.innerHeight*2);
 let pointer=null;
 function describe(){
  const height=Math.round(stage.getBoundingClientRect().height);
  handle.setAttribute('aria-valuemin',String(minimum));handle.setAttribute('aria-valuemax',String(maximum()));
  handle.setAttribute('aria-valuenow',String(height));handle.setAttribute('aria-valuetext',`${height} pixels high`);
 }
 function resize(height){
  stage.style.setProperty('--stage-height',`${Math.max(minimum,Math.min(maximum(),height))}px`);
  stage.classList.add('has-custom-height');describe();
 }
 function finish(event){
  if(!pointer||event&&event.pointerId!==pointer.id)return;
  const {id}=pointer;pointer=null;stage.classList.remove('is-resizing');
  if(handle.hasPointerCapture(id))handle.releasePointerCapture(id);
 }
 function reset(){finish();stage.classList.remove('has-custom-height');stage.style.removeProperty('--stage-height');describe();}
 handle.addEventListener('pointerdown',event=>{
  if(event.button!==0||pointer)return;
  event.preventDefault();handle.focus({preventScroll:true});
  pointer={id:event.pointerId,y:event.clientY,height:stage.getBoundingClientRect().height};
  handle.setPointerCapture(event.pointerId);stage.classList.add('is-resizing');
 });
 handle.addEventListener('pointermove',event=>{if(pointer?.id===event.pointerId)resize(pointer.height+event.clientY-pointer.y);});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])handle.addEventListener(type,finish);
 handle.addEventListener('dblclick',reset);
 handle.addEventListener('keydown',event=>{
  const delta=event.shiftKey?100:20,height=stage.getBoundingClientRect().height;
  if(event.key==='ArrowUp')resize(height-delta);
  else if(event.key==='ArrowDown')resize(height+delta);
  else if(event.key==='Home')resize(minimum);
  else if(event.key==='End')resize(maximum());
  else if(event.key==='Enter')reset();
  else return;
  event.preventDefault();
 });
 new ResizeObserver(describe).observe(stage);
 window.addEventListener('resize',()=>{if(stage.classList.contains('has-custom-height'))resize(stage.getBoundingClientRect().height);else describe();});
 describe();
}
