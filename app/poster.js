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
function poster(result,width=640,active=null){
 const w=Math.max(280,Math.round(width)),small=w<480,pad=small?20:34,inner=w-pad*2,cx=w/2;
 const p={bg:'#08131e',fg:'#eaf4fc',muted:'#a0b6c7',line:'#294051',ink:'#8adce7',core:'#163145',edge:'#4d748d',violet:'#bcaaf0'};
 const parts=[],hitTargets=[];let y=24;
 const add=s=>parts.push(s),line=(x1,y1,x2,y2,opacity=1)=>add(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${p.line}" opacity="${opacity}"/>`);
 const text=(s,x,top,size=14,color=p.fg,weight=400,anchor='start',maxWidth=inner,lineHeight=size*1.65)=>{const lines=wrap(s,maxWidth,size,weight);lines.forEach((s,i)=>add(`<text x="${x}" y="${top+size+i*lineHeight}" font-size="${size}" fill="${color}" font-weight="${weight}" text-anchor="${anchor}">${esc(s)}</text>`));return lines.length*lineHeight;};
 add(`<defs><radialGradient id="poster-halo"><stop offset="0" stop-color="#5a8aa4" stop-opacity=".38"/><stop offset="1" stop-color="#365b71" stop-opacity="0"/></radialGradient><radialGradient id="poster-core" cx="35%" cy="20%" r="85%"><stop offset="0" stop-color="#426d85"/><stop offset="1" stop-color="${p.core}"/></radialGradient><linearGradient id="curve-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.ink}" stop-opacity=".17"/><stop offset="1" stop-color="${p.ink}" stop-opacity="0"/></linearGradient></defs>`);
 y+=text(result.data.subject.name,pad,y,small?16:19,p.fg,600,'start',inner-64)+5;text(result.data.is_example?'虚构示例':'组织画像',w-pad,25,11,p.muted,400,'end',64);
 y+=text(result.data.subject.business,pad,y,small?11:13,p.muted)+18;
 y+=text(result.headline.replace('，','，\n'),cx,y,small?21:29,p.fg,600,'middle',inner,small?32:43)+10;
 const graphTop=y,cy=graphTop+134,r=small?49:58,labelW=small?86:150;
 const positions=[{x:cx,y:graphTop+53,top:graphTop-1},{x:pad+inner*.19,y:graphTop+220,top:graphTop+238},{x:w-pad-inner*.19,y:graphTop+220,top:graphTop+238}];
 add(`<circle cx="${cx}" cy="${cy}" r="${r+61}" fill="url(#poster-halo)"/><ellipse cx="${cx}" cy="${cy}" rx="${Math.min(inner/2-4,r+62)}" ry="${r+25}" fill="none" stroke="${p.line}" transform="rotate(-27 ${cx} ${cy})"/><ellipse cx="${cx}" cy="${cy}" rx="${Math.min(inner/2-8,r+43)}" ry="${r+15}" fill="none" stroke="${p.line}" stroke-width=".6" opacity=".65" transform="rotate(30 ${cx} ${cy})"/>`);
 result.nodes.forEach((node,i)=>{const pos=positions[i],dx=pos.x-cx,dy=pos.y-cy,len=Math.hypot(dx,dy),color=active===i?p.violet:p.ink;add(`<path d="M ${cx+dx*r/len} ${cy+dy*r/len} Q ${cx+dx*.4+12} ${cy+dy*.78} ${pos.x} ${pos.y}" fill="none" stroke="${color}" stroke-width="1.3"/><circle cx="${pos.x}" cy="${pos.y}" r="13" fill="${color}" opacity=".08"/><circle cx="${pos.x}" cy="${pos.y}" r="6" fill="${p.core}" stroke="${color}"/><circle cx="${pos.x}" cy="${pos.y}" r="2.6" fill="${color}"/>`);const h=text(node.label,pos.x,pos.top,small?11.5:14,p.fg,550,'middle',labelW,small?18:21);text(node.action,pos.x,pos.top+h+1,10,p.muted,400,'middle',labelW,16);hitTargets.push({index:i,x:pos.x-labelW/2,y:Math.min(pos.top,pos.y-14),width:labelW,height:Math.abs(pos.top-pos.y)+h+25});});
 add(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#poster-core)" stroke="${p.edge}"/><circle cx="${cx}" cy="${cy}" r="${r-6}" fill="none" stroke="${p.edge}" opacity=".35"/>`);
 text(result.stage===null?'先选一个起点':'首做积累',cx,cy-30,10,p.muted,400,'middle',r*2-10);
 text(result.data.focus.asset||'一项真实工作',cx,cy-9,small?14:17,p.fg,550,'middle',r*2-13,small?21:25);
 y=graphTop+305;
 y+=text(result.stageLabel+' → '+result.classification,pad,y,small?12:14,p.ink,500,'start',inner,small?21:24)+7;
 y+=text(result.explanation,pad,y,small?11:12,p.muted,400,'start',inner,small?20:22)+10;
 line(pad,y,w-pad,y);y+=15;
 y+=text('适合你的推进方式',pad,y,10,p.muted)+3;y+=text(result.route.name,pad,y,small?14:17,p.fg,550)+8;
 y+=text('先做这一件',pad,y,10,p.muted)+3;y+=text(result.next,pad,y,small?12:14,p.fg,400,'start',inner,small?21:24)+16;
 line(pad,y,w-pad,y);y+=16;
 const c=result.curve;y+=text(c.title,pad,y,small?16:19,p.fg,550)+3;y+=text('选定工作能力的释放节奏 · 条件情景',pad,y,10,p.muted)+3;
 const left=pad+28,right=w-pad-3,top=y+11,bottom=y+91;
 line(left,top,right,top,.5);line(left,bottom,right,bottom);text('更高',pad,top-7,10,p.muted);text('当前',pad,bottom-7,10,p.muted);
 let d='',prep='';for(let i=0;i<=80;i++){const t=i/80,point=(left+(right-left)*t)+' '+(bottom-(bottom-top-4)*M.curveValue(c.id,t,c.preparation));d+=(i?' L ':'M ')+point;if(t<=(c.id==='explore' ? .42 : c.preparation))prep+=(prep?' L ':'M ')+point;}
 add(`<path d="${d} L ${right} ${bottom} L ${left} ${bottom} Z" fill="url(#curve-area)"/><path d="${d}" fill="none" stroke="${p.ink}" stroke-width="2.2" stroke-linecap="round"${c.conditional?' stroke-dasharray="6 4"':''}/>`);if(c.conditional&&prep)add(`<path d="${prep}" fill="none" stroke="${p.ink}" stroke-width="2.2"/>`);
 text(c.phases[0],left,bottom+10,10,p.muted,400,'start',(right-left)/2);text(c.phases[1],right,bottom+10,10,p.muted,400,'end',(right-left)/2);y=bottom+38;
 y+=text(c.basis,pad,y,10,p.muted,400,'start',inner,17)+5;y+=text(c.condition,pad,y,10,p.muted,400,'start',inner,17)+10;
 y+=text(result.scopeNote+'曲线不预测日期、营收或增长率。',pad,y,10,p.muted,400,'start',inner,17)+13;
 line(pad,y,w-pad,y);y+=10;y+=text('GAIDN · 让经验留下来，让团队用起来',pad,y,small?10:11,p.muted)+3;y+=text('方法参考：老谭·准则工程；匹配与情景为GAIDN设计。',pad,y,9,p.muted,400,'start',inner,15)+10;
 const height=Math.ceil(y);const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${height}" viewBox="0 0 ${w} ${height}" role="img" aria-label="${esc(result.data.subject.name+'：'+result.headline)}" style="font-family:${esc(font)}"><title>${esc(result.classification)}</title><desc>${esc(result.stageLabel+'。'+result.explanation+' '+result.next+' 推进方式：'+result.route.name+'。情景走向：'+c.title+'。'+c.basis+' '+c.condition+' '+result.scopeNote)}</desc><rect x=".5" y=".5" width="${w-1}" height="${height-1}" rx="18" fill="${p.bg}" stroke="${p.line}"/>${parts.join('')}</svg>`;
 return {svg,width:w,height,hitTargets};
}
host.GAIDNPoster={poster,wrap};
})(globalThis);
