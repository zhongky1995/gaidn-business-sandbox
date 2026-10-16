(function(host){'use strict';
const M=typeof module!=='undefined'&&module.exports?require('./model.js'):host.GAIDNModel;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const C={bg:'#07151f',panel:'#0d2230',ink:'#edf5fb',muted:'#a4bdcc',dim:'#476474',cyan:'#8cdee6',blue:'#91b5fa',line:'#2c4a5c'};
let measure;function widthOf(s,size){if(typeof document!=='undefined'){measure||=document.createElement('canvas').getContext('2d');measure.font=size+'px "PingFang SC","Microsoft YaHei",sans-serif';return measure.measureText(s).width;}return [...s].reduce((n,c)=>n+(/[\u0000-\u00ff]/.test(c)?size*.55:size),0);}
function lines(text,width,size){const out=[];for(const part of String(text).split('\n')){let l='';for(const ch of part){if(l&&widthOf(l+ch,size)>width){out.push(l);l=ch;}else l+=ch;}out.push(l);}return out;}
function text(s,x,y,w,size=14,color=C.ink,weight=400,anchor='start',lh=1.65){const ls=lines(s,w,size);return {svg:`<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}">${ls.map((l,i)=>`<tspan x="${x}" dy="${i?size*lh:0}">${esc(l)}</tspan>`).join('')}</text>`,height:ls.length*size*lh};}
function layoutGraph(r,w){
 const small=w<460,pos={},caps=[],rects=[],s=r.nodes.filter(n=>n.role==='source'),t=r.nodes.filter(n=>n.role==='target');let height=370;
 const put=(id,x,y,width=110,h=58)=>{pos[id]={x,y,width,height:h};};
 const row=(arr,y,width=small?82:130,h=58)=>arr.forEach((n,i)=>put(n.id,(w-arr.length*width-(arr.length-1)*12)/2+i*(width+12),y,width,h));
 if(r.kind==='knowledge'){
  height=small?395:365;caps.push({label:'已有说明，汇成共同依据',x:w/2,y:17});row(s,35,Math.min(small?80:140,(w-24)/s.length-8));
  put('asset',w*.22,130,w*.56,78);put('ai',w*.3,235,w*.4,44);row(t,small?325:305,Math.min(small?80:140,(w-24)/t.length-8));
  rects.push(`<rect x="${w*.22+8}" y="121" width="${w*.56-16}" height="78" rx="9" fill="none" stroke="${C.dim}"/><path d="M${w*.22+16} 145h${w*.56-32}M${w*.22+16} 156h${w*.56-50}" stroke="${C.dim}"/>`);caps.push({label:'按问题查找 · 各环节共用',x:w/2,y:small?306:289});
 }else if(r.kind==='process'){
  const seq=[...s,'ai',...t].map(n=>typeof n==='string'?n:n.id);put('asset',w*.14,30,w*.72,55);caps.push({label:'按标准检查，每一步有接手',x:w/2,y:17});
  if(small){height=135+seq.length*78;seq.forEach((id,i)=>put(id,w*.18,115+i*78,w*.64,56));}
  else{height=310;const bw=(w-18*(seq.length-1))/seq.length;seq.forEach((id,i)=>put(id,i*(bw+18),160,bw,85));}
  seq.forEach((id,i)=>{const p=pos[id];caps.push({label:String(i+1).padStart(2,'0'),x:p.x+p.width/2,y:p.y-9});});
 }else if(r.kind==='expert'){
  height=small?425:390;caps.push({label:'谁的经验',x:w/2,y:17});row(s,30,Math.min(small?80:140,(w-24)/s.length-8));put('asset',w*.24,135,w*.52,62);put('ai',w*.25,245,w*.5,52);row(t,small?360:330,Math.min(small?80:140,(w-24)/t.length-8));caps.push({label:'把取舍写成条件与例外',x:w/2,y:121});caps.push({label:'给下一次判断准备依据',x:w/2,y:small?342:315});
 }else if(r.kind==='project'){
  height=small?420:365;const col=small?w*.28:w*.3;s.forEach((n,i)=>put(n.id,0,75+i*82,col,65));t.forEach((n,i)=>put(n.id,w-col,75+i*82,col,65));put('asset',w*.35,130,w*.3,80);put('ai',w*.25,small?325:290,w*.5,52);
  caps.push({label:'已有项目',x:col/2,y:40},{label:'新项目',x:w-col/2,y:40},{label:r.tentative?'候选模块·待验证':'可复用部分',x:w/2,y:107},{label:'沿用合适部分，另查本次差异',x:w/2,y:small?405:358});
  s.forEach(n=>{const p=pos[n.id];rects.push(`<rect x="${p.x+5}" y="${p.y-6}" width="${p.width-10}" height="${p.height}" rx="7" fill="none" stroke="${C.dim}"/>`);});
  height=Math.max(height,75+Math.max(s.length,t.length)*82+100);if(s.length===3||t.length===3)pos.ai.y=75+Math.max(s.length,t.length)*82+4;
 }else if(r.kind==='matching'){
  height=small?450:425;const col=w*.29;s.forEach((n,i)=>put(n.id,0,48+i*76,col,57));t.forEach((n,i)=>put(n.id,w-col,48+i*76,col,57));put('asset',w*.35,105,w*.3,70);put('ai',w*.28,small?295:275,w*.44,50);put('confirm',w*.28,small?386:362,w*.44,52);caps.push({label:'需求与约束',x:col/2,y:21},{label:'已有资源',x:w-col/2,y:21},{label:'先比较条件，再提交候选',x:w/2,y:small?280:260});
  rects.push(`<path d="M${w*.31} 90L${w*.69} 90L${w*.59} 195L${w*.41} 195Z" fill="${C.cyan}08" stroke="${C.dim}"/>`);
 }else if(r.kind==='network'){
  height=small?465:420;const side=w*.27;put('asset',w*.18,28,w*.64,50);put('ai',w*.28,111,w*.44,48);put('handoff',w*.355,246,w*.29,80);s.forEach((n,i)=>put(n.id,0,205+i*83,side,66));t.forEach((n,i)=>put(n.id,w-side,205+i*83,side,66));caps.push({label:'各方按共同要求协作',x:w/2,y:16},{label:'谁提供什么',x:side/2,y:188},{label:'谁接手什么',x:w-side/2,y:188});height=Math.max(height,205+Math.max(s.length,t.length)*83+12);
  rects.push(`<path d="M${w*.32} 200v${height-220}M${w*.68} 200v${height-220}" stroke="${C.line}" stroke-dasharray="3 6"/>`);
 }else{height=295;put('task',w*.12,20,w*.76,60);put('ai',w*.2,125,w*.6,54);put('check',w*.2,230,w*.6,54);}
 return {positions:pos,captions:caps,decoration:rects,height};
}
function drawGraph(r,w,active){
 const {positions:p,captions,decoration,height}=layoutGraph(r,w),parts=[...decoration],hits=[];
 for(const e of r.graph.edges){const a=p[e.from],b=p[e.to];if(!a||!b)continue;const ax=a.x+a.width/2,ay=a.y+a.height/2,bx=b.x+b.width/2,by=b.y+b.height/2;let x1=ax,y1=ay,x2=bx,y2=by;
  if(Math.abs(ax-bx)>Math.abs(ay-by)*.6){x1=ax+(bx>ax?a.width/2:-a.width/2);x2=bx+(bx>ax?-b.width/2:b.width/2);}else{y1=ay+(by>ay?a.height/2:-a.height/2);y2=by+(by>ay?-b.height/2:b.height/2);}
  let path=r.kind==='network'?`M${x1} ${y1}H${(x1+x2)/2}V${y2}H${x2}`:`M${x1} ${y1}C${x1+(x2-x1)*.4} ${y1+(y2-y1)*.2},${x2-(x2-x1)*.4} ${y2-(y2-y1)*.2},${x2} ${y2}`;
  if(r.kind==='knowledge'&&e.from==='asset'&&e.to.startsWith('t')){const lane=bx<w/2?w*.06:w*.94;path=`M${ax+(bx<w/2?-a.width*.4:a.width*.4)} ${a.y+a.height}V${a.y+a.height+12}H${lane}V${b.y-10}H${bx}V${b.y}`;}if(r.kind==='knowledge'&&e.relation==='问题回流'){path=`M${a.x} ${ay}H${w*.02}V${by}H${b.x}`;}
  parts.push(`<path data-relation="${esc(e.relation)}" d="${path}" fill="none" stroke="${e.planned?C.cyan:C.dim}" stroke-width="1.4" ${e.planned?'stroke-dasharray="4 4"':''} marker-end="url(#arrow)" opacity=".8"/>`);
 }
 for(const c of captions)parts.push(text(c.label,c.x,c.y,w*.85,w<460?10:12,C.muted,400,'middle',1.35).svg);
 r.nodes.forEach((n,i)=>{const b=p[n.id];if(!b)return;const selected=active===i,accent=n.role==='asset'?C.cyan:n.role==='ai'?C.blue:C.dim;const fs=w<460?11:13;const label=lines(n.label,b.width-14,fs),lineH=fs*1.45,ty=b.y+b.height/2-(label.length-1)*lineH/2+fs*.35;
  const body=r.kind==='expert'&&n.role==='asset'?`<polygon points="${b.x+b.width/2},${b.y-8} ${b.x+b.width+5},${b.y+b.height/2} ${b.x+b.width/2},${b.y+b.height+8} ${b.x-5},${b.y+b.height/2}" fill="#193744" stroke="${C.cyan}"/>`:'';
  parts.push(`<g data-node="${esc(n.id)}" data-role="${esc(n.role)}">${body}<rect ${body?'opacity="0"':''} x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="${n.role==='asset'?5:10}" fill="${n.role==='asset'?'#193744':C.panel}" stroke="${selected?C.ink:accent}" stroke-width="${selected?2:1}" ${n.state==='planned'?'stroke-dasharray="4 3"':''}/>${text(n.label,b.x+b.width/2,ty,b.width-14,fs,C.ink,n.role==='asset'?600:400,'middle',1.45).svg}</g>`);hits.push({index:i,...b});
 });return {svg:parts.join(''),height,hitTargets:hits};
}
function poster(r,width=720,active=null){
 const w=Math.max(260,Math.round(width)),small=w<480,p=small?20:38,cw=w-2*p,parts=[],hitTargets=[];let y=35;
 const add=(s,size=14,color=C.ink,weight=400,gap=12)=>{const t=text(s,p,y,cw,size,color,weight);parts.push(t.svg);y+=t.height+gap;};
 const rule=()=>{parts.push(`<path d="M${p} ${y}H${w-p}" stroke="${C.line}"/>`);y+=30;};
 add('GAIDN  /  企业 AI 经营沙盘',small?10:11,C.cyan,500,18);add(r.data.company.name+(r.data.is_example?' · 虚构示例':''),small?23:29,C.ink,600,8);add(r.data.company.business,small?12:14,C.muted,400,12);add('本次工作  '+r.data.work.task,small?12:14,C.ink,400,22);
 add(r.headline,small?24:34,C.ink,600,17);add(r.classification+'  /  '+r.curve.name,small?12:14,C.cyan,500,18);
 const g=drawGraph(r,cw,active),gy=y;parts.push(`<g data-graph-kind="${r.kind}" transform="translate(${p},${gy})">${g.svg}</g>`);g.hitTargets.forEach(h=>hitTargets.push({...h,x:h.x+p,y:h.y+gy}));y+=g.height+20;
 add('实线：已描述的积累  ·  虚线：建议的使用关系',small?10:11,C.muted,400,18);add(r.explanation,small?13:16,C.ink,400,10);
 if(r.data.work.evidence)add('实际例子：'+(r.data.work.evidence.length>130?r.data.work.evidence.slice(0,130)+'…':r.data.work.evidence),small?11:12,C.muted,400,20);
 rule();add('AI 从哪里开始',small?17:20,C.ink,600,20);
 r.milestones.forEach((m,i)=>{add(String(i+1).padStart(2,'0')+'  '+m.title,small?14:16,C.cyan,500,6);add(m.detail,small?12:14,C.ink,400,15);});
 add('人工复核：'+(r.data.reviewer||'尚未安排；试用前需明确负责人和检查办法。'),small?11:12,C.muted,400,20);rule();
 add(r.curve.name+' · 观察什么变化',small?18:22,C.ink,600,10);add(r.curve.title,small?13:16,C.ink,500,12);add('纵轴｜'+r.curve.metric,small?12:14,C.cyan,500,6);add(r.curve.reading,small?11:12,C.muted,400,14);
 add('灰点线：情景起点参照 · 青线：推进后示意',small?10:11,C.muted,400,8);
 const chartTop=y+14,ch=small?116:145,x=p+8,cwidth=cw-16,chartY=level=>chartTop+(1-level)*ch*.76+ch*.1;
 const ref=M.curveLevel(r.curve,0);parts.push(`<g data-fixed-model="${r.curve.id}" data-curve-metric="${esc(r.curve.metric)}"><path d="M${x} ${chartY(ref)}H${x+cwidth}" stroke="${C.dim}" stroke-dasharray="2 5"/><path d="M${x} ${chartTop-2}V${chartTop+ch+4}H${x+cwidth}" fill="none" stroke="${C.line}"/>`);
 const path=Array.from({length:121},(_,i)=>(i?'L':'M')+(x+cwidth*i/120).toFixed(2)+' '+chartY(M.curveLevel(r.curve,i/120)).toFixed(2)).join(' ');parts.push(`<path data-curve-line="${r.curve.id}" d="${path}" fill="none" stroke="${C.cyan}" stroke-width="${small?2.5:3}" stroke-linecap="round" ${r.curve.id==='explore'?'stroke-dasharray="5 6"':''}/></g>`);y=chartTop+ch+29;
 let labelsH=0;r.curve.phases.forEach((s,i)=>{const fs=small?10:12,tw=cwidth/3-10,xx=x+cwidth*i/2;const a=i===0?'start':i===2?'end':'middle',t=text(s,xx,y,tw,fs,C.muted,400,a,1.5);parts.push(t.svg);labelsH=Math.max(labelsH,t.height);});y+=labelsH+15;
 add('横轴｜按上方三个步骤推进，不代表固定日期',small?10:11,C.muted,400,17);add('为什么选这条线：'+r.curve.why,small?11:13,C.ink,400,10);add('怎样检查：'+r.curve.check,small?11:12,C.muted,400,10);add(r.curve.condition,small?11:12,C.muted,400,16);
 if(r.data.goal)add('本次业务目标：'+r.data.goal+'。曲线的观察口径见上方纵轴。',small?10:11,C.muted,400,14);
 rule();add('曲线是条件示意；线高、斜率与台阶不代表测量值。',small?10:11,C.muted,400,4);add('不预测日期、改善比例、营收或利润。',small?10:11,C.muted,400,20);add('从已有积累出发，让 AI 参与下一次真实经营。',small?11:13,C.cyan,500,15);add('GAIDN  ·  组织 AI 化探索工具  /  v4.0',small?9:10,C.muted,400,12);
 const height=Math.ceil(y+8),svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${height}" viewBox="0 0 ${w} ${height}" role="img" aria-label="${esc(r.data.company.name+'的AI经营诊断')}" font-family="PingFang SC,Microsoft YaHei,sans-serif"><defs><marker id="arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L8 4L0 8" fill="none" stroke="${C.cyan}"/></marker></defs><rect width="${w}" height="${height}" rx="14" fill="${C.bg}"/><rect x=".5" y=".5" width="${w-1}" height="${height-1}" rx="14" fill="none" stroke="${C.line}"/>${parts.join('')}</svg>`;
 return {svg,height,hitTargets};
}
const api={poster,layoutGraph};if(typeof module!=='undefined'&&module.exports)module.exports=api;else host.GAIDNPoster=api;
})(typeof globalThis!=='undefined'?globalThis:this);
