from pathlib import Path

path = Path('C:/Users/kubai/.codex/visualizations/2026/10/07/01a11537-35c9-7660-8318-346e7cc5f58f/bar-customizer-design.html')
text = path.read_text(encoding='utf-8')
text = text.replace('[key,{x:0,y:0,z:Math.max', '[key,{x:Math.max(-100,Math.min(100,Number(state.poses[key]?.x)||0)),y:Math.max(-100,Math.min(100,Number(state.poses[key]?.y)||0)),z:Math.max')
text = text.replace('aspect-ratio:1.6;touch-action:auto', 'aspect-ratio:1.6;touch-action:pan-y')
start = text.index(" q('.scale-input').oninput=event=>")
drag = ''' let drag;
 canvas.onpointerdown=event=>{
   if(!state.poses[active]||(active==='outside'&&state.outside==='original')||event.button!==0)return;
   drag={x:event.clientX,y:event.clientY,pose:clone(pose())};canvas.setPointerCapture(event.pointerId);
 };
 canvas.onpointermove=event=>{
   if(!drag)return;
   const rect=canvas.getBoundingClientRect();
   const p=pose();
   if(active==='outside'&&p.z===100)p.z=110;
   p.x=Math.max(-100,Math.min(100,Math.round(drag.pose.x+(event.clientX-drag.x)/rect.width*300)));
   p.y=Math.max(-100,Math.min(100,Math.round(drag.pose.y+(event.clientY-drag.y)/rect.height*300)));
   syncControls();draw();
 };
 canvas.onpointerup=canvas.onpointercancel=()=>{if(drag){drag=undefined;remember();}};
'''
text = text[:start] + drag + text[start:]
text = text.replace("   q('.placement-panel').hidden=!movable;", "   q('.placement-panel').hidden=!movable;\n   canvas.style.cursor=movable?'grab':'default';canvas.style.touchAction=movable?'none':'pan-y';")
text = text.replace('scenery:state.outside,scale:pose().z', 'scenery:state.outside,scale:pose().z,position:pose()')
path.write_text(text, encoding='utf-8')
print('Direct dragging restored; scale is the only placement control.')
