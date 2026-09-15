const paths={
 Play:'<path d="m8 5 11 7-11 7Z"/>',
 Pause:'<path d="M8 5v14M16 5v14"/>',
 Replay:'<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>',
 Restart:'<path d="M5 5v14m14-14L8 12l11 7Z"/>',
 Speed:'<path d="M4 19a9 9 0 1 1 16 0M12 13l5-6M6 15h1m10 0h1M12 5v1"/><circle cx="12" cy="13" r="1"/>',
 Camera:'<path d="M4 8h4l2-3h4l2 3h4v11H4Z"/><circle cx="12" cy="13" r="3"/>',
 Collapse:'<path d="m7 14 5-5 5 5"/>',
 Expand:'<path d="m7 10 5 5 5-5"/>'
};
const icon=name=>`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
export function setPlaybackIcon(button,name){
 if(button.getAttribute('aria-label')===name)return;
 button.innerHTML=icon(name);button.setAttribute('aria-label',name);button.title=name;
}
export function enablePlaybackToolbar(){
 const toolbar=document.querySelector('.playback-controls');
 const stage=document.querySelector('.stage');
 const overlay=document.createElement('div');overlay.className='playback-overlay';
 const anchor=document.createElement('div');anchor.className='playback-sticky';
 const modes=document.querySelector('.mode-controls');
 const views=document.querySelector('.view-controls');
 const lower=document.createElement('div');lower.className='canvas-control-row';
 const camera=document.createElement('div');camera.className='camera-menu';
 const cameraButton=document.createElement('button');
 const collapseButton=document.createElement('button');
 collapseButton.type='button';collapseButton.className='control-box-toggle';
 collapseButton.setAttribute('aria-controls','canvas-control-box');
 cameraButton.type='button';cameraButton.className='camera-menu-toggle';
 cameraButton.innerHTML=icon('Camera');cameraButton.setAttribute('aria-label','Camera views');
 cameraButton.setAttribute('aria-expanded','false');cameraButton.title='Camera views';
 views.hidden=true;camera.append(cameraButton,views);lower.append(modes,camera);
 anchor.id='canvas-control-box';toolbar.prepend(collapseButton);
 anchor.append(toolbar,lower);overlay.append(anchor);stage.prepend(overlay);
 new ResizeObserver(()=>stage.style.setProperty('--playback-height',`${anchor.getBoundingClientRect().height}px`)).observe(anchor);
 const closeCamera=()=>{views.hidden=true;cameraButton.setAttribute('aria-expanded','false');};
 const setExpanded=expanded=>{
  closeCamera();anchor.classList.toggle('is-collapsed',!expanded);
  collapseButton.innerHTML=icon(expanded?'Collapse':'Expand');
  collapseButton.setAttribute('aria-expanded',String(expanded));
  const label=expanded?'Minimize controls':'Open controls';
  collapseButton.setAttribute('aria-label',label);collapseButton.title=label;
 };
 collapseButton.addEventListener('click',()=>setExpanded(anchor.classList.contains('is-collapsed')));
 cameraButton.addEventListener('click',()=>{
  const open=views.hidden;views.hidden=!open;cameraButton.setAttribute('aria-expanded',String(open));
 });
 views.addEventListener('click',event=>{if(event.target.closest('button'))closeCamera();});
 document.addEventListener('pointerdown',event=>{if(!camera.contains(event.target))closeCamera();});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'){closeCamera();cameraButton.focus();}});
 setPlaybackIcon(document.querySelector('#restart-sequence'),'Restart');
 const speedLabel=toolbar.querySelector('label');
 speedLabel.innerHTML=icon('Speed');speedLabel.title='Playback speed';
 const speed=document.querySelector('#playback-speed');
 speed.setAttribute('aria-label','Playback speed');speed.title='Playback speed';
 setExpanded(true);
}
