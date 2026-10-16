(function(host){
  'use strict';
  const M=host.GAIDNModel;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  const font='"PingFang SC","Microsoft YaHei",sans-serif';
  const ctx=document.createElement('canvas').getContext('2d');
  function wrap(s,width,size,weight=400){
    ctx.font=weight+' '+size+'px '+font;
    const lines=[];
    for(const paragraph of String(s).split('\n')){
      const start=lines.length;
      let line='';
      for(const c of Array.from(paragraph)){
        if(line&&ctx.measureText(line+c).width>width){
          if(/[，。！？；：、）》」』]/.test(c)&&line.length>1){const last=Array.from(line).pop();lines.push(Array.from(line).slice(0,-1).join(''));line=last+c;}
          else {lines.push(line);line=c;}
        }else line+=c;
      }
      lines.push(line);
      if(lines.length-start>1&&Array.from(lines.at(-1)).length<=4&&Array.from(lines.at(-2)).length>12){
        const previous=Array.from(lines.at(-2));let cut=previous.length-8;
        while(cut>0&&/[，。！？；：、）》」』]/.test(previous[cut]))cut--;
        const tail=previous.slice(cut).join('')+lines.at(-1);
        if(ctx.measureText(tail).width<=width){lines[lines.length-2]=previous.slice(0,cut).join('');lines[lines.length-1]=tail;}
      }
    }
    return lines;
  }
function layoutGraph(result,small){
 const ns=result.graph.nodes,kind=result.graph.kind,pos=ns.map(()=>({x:.5,y:.5})),ids=role=>ns.flatMap((n,i)=>n.role===role?[i]:[]),S=ids('source'),T=ids('target'),C=ids('asset')[0],A=ids('ai')[0];
 const rows=(list,x)=>list.forEach((n,i)=>pos[n]={x,y:list.length===1?.43:.09+i*.72/(list.length-1)}),spread=(list,y)=>list.forEach((n,i)=>pos[n]={x:list.length===1?.5:.14+i*.72/(list.length-1),y});
 if(kind==='explore'){S.forEach(n=>pos[n]={x:.15,y:.25});pos[A]={x:.5,y:.5};T.forEach(n=>pos[n]={x:.85,y:.75});}
 if(kind==='knowledge'){spread(S,.02);pos[C]={x:.43,y:.38};pos[A]={x:.82,y:.4};spread(T,.81);}
 if(kind==='process'){pos[C]={x:.5,y:.01};const order=[...S,A,...T],cols=small?3:4;order.forEach((n,i)=>{const row=Math.floor(i/cols),col=i%cols;pos[n]={x:.12+((row%2)?cols-1-col:col)*.76/(cols-1),y:.27+row*(small?.28:.48)};});}
 if(kind==='expert'){rows(S,.08);pos[C]={x:.36,y:.43};pos[A]={x:.64,y:.43};rows(T,.92);}
 if(kind==='project'){rows(S,.1);pos[C]={x:.47,y:.18};pos[A]={x:.47,y:.68};rows(T,.89);}
 if(kind==='matching'){rows(S,.1);rows(T,.9);pos[C]={x:.5,y:.55};pos[A]={x:.5,y:.06};}
 if(kind==='network'){const ring=[...S,...T];ring.forEach((n,i)=>{const a=-Math.PI/2+i*2*Math.PI/ring.length;pos[n]={x:.5+.4*Math.cos(a),y:.45+.43*Math.sin(a)};});pos[C]={x:.5,y:.62};pos[A]={x:.5,y:.32};}
 return pos;
}
function poster(result,width=640,active=null){
 const w=Math.max(280,Math.round(width)),small=w<480,pad=small?20:34,inner=w-2*pad,cx=w/2;
 const p={bg:'#08131e',fg:'#eaf4fc',muted:'#a0b6c7',line:'#294051',ink:'#8adce7',core:'#163145',edge:'#5c8299',violet:'#c6b5f2'},parts=[],hitTargets=[];let y=24;
 const add=s=>parts.push(s),line=(x1,y1,x2,y2,op=1)=>add(`<path d="M ${x1} ${y1} L ${x2} ${y2}" fill="none" stroke="${p.line}" opacity="${op}"/>`);
 const text=(s,x,top,size=14,color=p.fg,weight=400,anchor='start',maxWidth=inner,lh=size*1.65)=>{const rows=wrap(s,maxWidth,size,weight);rows.forEach((v,i)=>add(`<text x="${x}" y="${top+size+i*lh}" font-size="${size}" fill="${color}" font-weight="${weight}" text-anchor="${anchor}">${esc(v)}</text>`));return rows.length*lh;};
 add(`<defs><radialGradient id="v3-halo"><stop offset="0" stop-color="${p.ink}" stop-opacity=".18"/><stop offset="1" stop-color="${p.ink}" stop-opacity="0"/></radialGradient><radialGradient id="v3-core" cx="30%" cy="20%"><stop offset="0" stop-color="#3e697e"/><stop offset="1" stop-color="${p.core}"/></radialGradient><linearGradient id="v3-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.ink}" stop-opacity=".14"/><stop offset="1" stop-color="${p.ink}" stop-opacity="0"/></linearGradient><marker id="v3-arrow-new" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0 L4 2.5 L0 5" fill="none" stroke="${p.ink}" stroke-width=".8"/></marker><marker id="v3-arrow-old" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0 L4 2.5 L0 5" fill="none" stroke="${p.edge}" stroke-width=".8"/></marker></defs>`);
 y+=text(result.data.subject.name,pad,y,small?16:19,p.fg,550,'start',inner-70);text(result.data.is_example?'虚构示例':'经营探索',w-pad,26,11,p.muted,400,'end',70);y+=5;
 y+=text(result.data.subject.business,pad,y,small?11:13,p.muted)+22;
 y+=text(result.headline.replace('，','，\n'),cx,y,small?22:30,p.fg,550,'middle',inner,small?34:45)+15;
 y+=text(result.classification,cx,y,small?13:15,p.ink,500,'middle',inner)+3;
 y+=text('当前起点：'+result.stageLabel,cx,y,11,p.muted,400,'middle',inner)+7;
 const top=y,gh=small?415:335,positions=layoutGraph(result,small),points=positions.map(v=>({x:pad+inner*v.x,y:top+28+v.y*(gh-100)})),ns=result.graph.nodes;
 add(`<g data-graph-kind="${esc(result.kind)}"><ellipse cx="${cx}" cy="${top+gh*.49}" rx="${inner*.5}" ry="${gh*.5}" fill="url(#v3-halo)"/>`);
 if(result.kind==='knowledge')add(`<ellipse cx="${pad+inner*.43}" cy="${top+28+.38*(gh-100)}" rx="${inner*.34}" ry="${gh*.26}" fill="none" stroke="${p.line}" opacity=".65" transform="rotate(-19 ${cx} ${top+gh*.5})"/>`);
 if(result.kind==='network')add(`<ellipse cx="${cx}" cy="${top+28+.45*(gh-100)}" rx="${inner*.4}" ry="${(gh-100)*.43}" fill="none" stroke="${p.line}" opacity=".55"/>`);
 if(result.kind==='project')add(`<ellipse cx="${pad+inner*.47}" cy="${top+gh*.48}" rx="${inner*.23}" ry="${gh*.36}" fill="none" stroke="${p.line}" opacity=".5" transform="rotate(22 ${cx} ${top+gh*.5})"/>`);
 result.graph.edges.forEach((e,i)=>{const a=points[e.from],b=points[e.to],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,r1=ns[e.from].role==='asset'?22:12,r2=ns[e.to].role==='asset'?26:16,x1=a.x+dx*r1/len,y1=a.y+dy*r1/len,x2=b.x-dx*r2/len,y2=b.y-dy*r2/len;
  const feedback=(result.kind==='knowledge'||result.kind==='project')&&ns[e.from].role==='target'&&ns[e.to].role==='asset',bend=feedback?(i%2?26:-26):result.kind==='matching'?(i%2?9:-9):0;
  add(`<path data-relation="${e.planned?'proposed':'described'}" d="M ${x1} ${y1} Q ${(x1+x2)/2+bend} ${(y1+y2)/2-bend} ${x2} ${y2}" fill="none" stroke="${e.planned?p.ink:p.edge}" stroke-width="${e.planned?1.5:1.15}"${e.planned?' stroke-dasharray="4 5"':''} opacity="${e.planned?.85:.7}" marker-end="url(#${e.planned?'v3-arrow-new':'v3-arrow-old'})"/>`);
 });
 ns.forEach((node,i)=>{const pt=points[i],core=node.role==='asset',ai=node.role==='ai',r=core?23:ai?17:10,color=active===i?p.violet:node.state==='planned'?p.ink:p.edge;
  if(core||ai)add(`<circle cx="${pt.x}" cy="${pt.y}" r="${r+22}" fill="url(#v3-halo)"/>`);
  add(`<circle cx="${pt.x}" cy="${pt.y}" r="${r+5}" fill="none" stroke="${color}" opacity=".15"/><circle cx="${pt.x}" cy="${pt.y}" r="${r}" fill="${core?'url(#v3-core)':p.core}" stroke="${color}"${node.state==='planned'?' stroke-dasharray="3 3"':''}/><circle cx="${pt.x}" cy="${pt.y}" r="${core?4:2.5}" fill="${color}"/>`);
  const mw=small?inner*(result.kind==='expert'?.22:.29):Math.min(140,inner*.22),h=text(node.label,pt.x,pt.y+r+8,small?11.5:13,p.fg,core?500:400,'middle',mw,small?17:20);
  hitTargets.push({index:i,x:pt.x-mw/2,y:pt.y-r-4,width:mw,height:r*2+h+16});
 });add('</g>');y=top+gh;
 line(pad,y+6,pad+20,y+6);text('已有描述',pad+26,y-2,10,p.muted,400,'start',65);add(`<path d="M ${pad+110} ${y+6} H ${pad+130}" stroke="${p.ink}" stroke-dasharray="4 4"/>`);text('建议由AI支持的连接',pad+136,y-2,10,p.muted,400,'start',inner-136);y+=36;
 y+=text(result.kind==='explore'?'这次先验证什么':'这项优势，值得怎样放大',pad,y,small?13:15,p.fg,500)+5;
 y+=text(result.opportunityReason,pad,y,small?12:14,p.muted,400,'start',inner,small?21:25)+9;
 y+=text(result.explanation,pad,y,small?11:12,p.muted,400,'start',inner,small?20:22)+15;
 line(pad,y,w-pad,y);y+=16;
 y+=text('先走这三步',pad,y,small?15:18,p.fg,500)+10;
 result.milestones.forEach((m,i)=>{y+=text((i+1)+'  '+m.title,pad,y,small?12:14,p.ink,500)+2;y+=text(m.detail,pad+19,y,small?11:12,p.fg,400,'start',inner-19,small?20:22)+9;});
 y+=text(result.route.name,pad,y,11,p.muted)+3;y+=text(result.data.readiness.owner.evidence,pad,y,11,p.muted,400,'start',inner,19)+14;
 line(pad,y,w-pad,y);y+=16;
 const c=result.curve;y+=text(c.title,pad,y,small?16:20,p.fg,500)+4;y+=text('本次工作能力的变化节奏 · 条件情景',pad,y,10,p.muted)+5;
 const left=pad+15,right=w-pad-4,plotTop=y+14,bottom=y+112,pointsC=[];
 line(left,plotTop,right,plotTop,.35);line(left,bottom,right,bottom);text('相对能力／可用范围',left,plotTop-5,10,p.muted,400,'start',right-left);
 for(let i=0;i<=100;i++){const t=i/100;pointsC.push([left+(right-left)*t,bottom-(bottom-plotTop-16)*M.curveValue(c.id,t,c.preparation)]);}
 const d=pointsC.map((v,i)=>(i?'L':'M')+v.map(x=>x.toFixed(2)).join(' ')).join(' ');add(`<path d="${d} L ${right} ${bottom} L ${left} ${bottom} Z" fill="url(#v3-area)"/><path data-curve-kind="${esc(c.id)}" d="${d}" fill="none" stroke="${p.ink}" stroke-width="2.2" stroke-dasharray="5 4" stroke-linecap="round"/>`);
 const lw=(right-left)/3-6;let labelH=0;c.phases.forEach((label,i)=>{const anchor=i===0?'start':i===2?'end':'middle',x=i===0?left:i===2?right:(left+right)/2;labelH=Math.max(labelH,text(label,x,bottom+9,10,p.muted,400,anchor,lw,16));});y=bottom+labelH+24;
 y+=text(c.basis,pad,y,10,p.muted,400,'start',inner,18)+4;if(c.id!=='delayed')y+=text(c.condition,pad,y,10,p.muted,400,'start',inner,18)+5;
 y+=text('仅观察本次工作；曲线不预测日期、营收或增长率。',pad,y,10,p.muted,400,'start',inner,18)+11;
 line(pad,y,w-pad,y);y+=12;y+=text('GAIDN · 让已有的本事，用到更多次业务里',pad,y,small?10:11,p.muted)+3;
 y+=text('方法参考：老谭·准则工程；机会结构与情景匹配为GAIDN设计。',pad,y,9,p.muted,400,'start',inner,16)+12;
 const height=Math.ceil(y),svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${height}" viewBox="0 0 ${w} ${height}" role="img" aria-label="${esc(result.data.subject.name+'：'+result.headline)}" style="font-family:${esc(font)}"><title>${esc(result.classification)}</title><desc>${esc(result.explanation+' '+result.next+' '+c.title+' '+c.basis)}</desc><rect x=".5" y=".5" width="${w-1}" height="${height-1}" rx="18" fill="${p.bg}" stroke="${p.line}"/>${parts.join('')}</svg>`;
 return {svg,height,hitTargets};
}
const api={poster,layoutGraph,wrap};if(typeof module!=='undefined'&&module.exports)module.exports=api;else host.GAIDNPoster=api;
})(typeof globalThis!=='undefined'?globalThis:this);
