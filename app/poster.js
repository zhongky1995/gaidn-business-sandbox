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
    const w=Math.max(280,Math.round(width)),small=w<480,pad=small?20:36,inner=w-2*pad,cx=w/2;
    const p={bg:'#08131e',fg:'#eaf4fc',muted:'#a0b6c7',line:'#294051',ink:'#8adce7',core:'#163145',edge:'#4d748d',violet:'#bcaaf0'};
    let parts=[],y=0,hitTargets=[];
    const add=s=>parts.push(s);
    const line=(x1,y1,x2,y2,stroke=p.line,opacity=1)=>add(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="1" opacity="${opacity}"/>`);
    const text=(s,x,top,size=14,color=p.fg,weight=400,anchor='start',maxWidth=inner,lineHeight=size*1.65)=>{
      const lines=wrap(s,maxWidth,size,weight);
      lines.forEach((s,i)=>add(`<text x="${x}" y="${top+size+i*lineHeight}" font-size="${size}" fill="${color}" font-weight="${weight}" text-anchor="${anchor}">${esc(s)}</text>`));
      return lines.length*lineHeight;
    };
    add(`<defs><radialGradient id="poster-halo"><stop offset="0" stop-color="#365b71" stop-opacity=".52"/><stop offset="1" stop-color="#365b71" stop-opacity="0"/></radialGradient><radialGradient id="poster-core" cx="35%" cy="23%" r="85%"><stop offset="0" stop-color="#43677e"/><stop offset="1" stop-color="${p.core}"/></radialGradient><linearGradient id="curve-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.ink}" stop-opacity=".13"/><stop offset="1" stop-color="${p.ink}" stop-opacity="0"/></linearGradient></defs>`);
    y=25;
    const sample=result.data.is_example?'虚构示例':'经营画像';
    const metaW=inner-66;
    const nameH=text(result.data.subject.name,pad,y,small?16:19,p.fg,600,'start',metaW);
    text(sample,w-pad,y+3,11,p.muted,400,'end',65);y+=nameH+6;
    y+=text(result.data.subject.business,pad,y,small?12:13,p.muted,400,'start',inner)+18;
    const pending=!result.complete;
    y+=text(pending?'先保留能核对的积累':'已有积累，可以从这里接入 AI',cx,y,12,p.muted,400,'middle',inner)+2;
    const graphTop=y,n=result.assets.length;
    const cy=graphTop+(n===3?168:n===2?91:n===1?148:90),r=small?47:59;
    const side=pad+Math.max(53,inner*.21);
    const positions=n===3?[{x:cx,y:graphTop+69,top:graphTop+3},{x:side,y:graphTop+263,top:graphTop+282},{x:w-side,y:graphTop+263,top:graphTop+282}]:n===2?[{x:side,y:graphTop+205,top:graphTop+223},{x:w-side,y:graphTop+205,top:graphTop+223}]:n===1?[{x:cx,y:graphTop+57,top:graphTop+1}]:[];
    add(`<circle cx="${cx}" cy="${cy}" r="${r+56}" fill="url(#poster-halo)"/>`);
    add(`<ellipse cx="${cx}" cy="${cy}" rx="${Math.min(inner/2-5,r+58)}" ry="${r+24}" fill="none" stroke="${p.line}" stroke-width=".8" transform="rotate(-25 ${cx} ${cy})"/><ellipse cx="${cx}" cy="${cy}" rx="${Math.min(inner/2-6,r+46)}" ry="${r+12}" fill="none" stroke="${p.line}" stroke-width=".6" opacity=".6" transform="rotate(28 ${cx} ${cy})"/>`);
    result.assets.forEach((a,i)=>{
      const pos=positions[i],dx=pos.x-cx,dy=pos.y-cy,len=Math.hypot(dx,dy),color=active===i?p.violet:p.ink;
      add(`<path d="M ${cx+dx*r/len} ${cy+dy*r/len} Q ${cx+dx*.28+(i===0&&n!==2?17:0)} ${cy+dy*.77} ${pos.x} ${pos.y}" fill="none" stroke="${color}" stroke-width="${active===i?1.8:1.1}" opacity=".85"/>`);
      add(`<circle cx="${pos.x}" cy="${pos.y}" r="13" fill="${color}" opacity=".07"/><circle cx="${pos.x}" cy="${pos.y}" r="6" fill="${p.core}" stroke="${color}"/><circle cx="${pos.x}" cy="${pos.y}" r="2.6" fill="${color}"/>`);
      const labelW=small?100:156,h=text(a.label,pos.x,pos.top,small?13:15,p.fg,600,'middle',labelW,20);
      text(a.action,pos.x,pos.top+h+2,11,p.muted,400,'middle',labelW,17);
      hitTargets.push({index:i,x:pos.x-labelW/2,y:Math.min(pos.top,pos.y-14),width:labelW,height:Math.abs(pos.top-pos.y)+h+26});
    });
    add(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#poster-core)" stroke="${p.edge}"/><circle cx="${cx}" cy="${cy}" r="${r-6}" fill="none" stroke="${p.edge}" opacity=".3"/>`);
    if(result.typeNames.length===2){text(result.typeNames[0],cx,cy-22,small?13:15,p.fg,500,'middle',r*2-7);text(result.typeNames[1],cx,cy+3,small?13:15,p.fg,500,'middle',r*2-7);}
    else {text(pending?'当前判断':'经营类型',cx,cy-25,11,p.muted,400,'middle',r*2-7);text(result.typeNames[0]||'待补充',cx,cy-2,small?15:17,p.fg,600,'middle',r*2-6);if(pending&&result.ids.length)text('仍有待补充',cx,cy+22,11,p.muted,400,'middle',r*2-6);}
    y=graphTop+(n===3?340:n===2?288:n===1?243:180);
    if(!n)y+=text('还没有足够依据列出已有积累。',cx,y,12,p.muted,400,'middle',inner)+9;
    const basis=result.assets.length?'已有积累：'+result.assets.map(a=>a.label).join('、')+'。':'补充实际交付的一个例子，就能继续判断。';
    y+=text(basis,pad,y,11,p.muted,400,'start',inner,18)+20;
    const hs=small?21:30;
    y+=text(result.headline.replace('，','，\n'),cx,y,hs,p.fg,600,'middle',inner,hs*1.5)+15;
    y+=text(result.explanation,cx,y,small?12:14,p.muted,400,'middle',inner,small?22:25)+23;
    line(pad,y,w-pad,y);y+=18;
    y+=text('AI 化起点',pad,y,11,p.muted)+8;
    y+=text(result.next,pad,y,small?13:15,p.fg,400,'start',inner,small?23:27)+19;
    line(pad,y,w-pad,y);y+=20;
    if(result.curve){
      y+=text(result.curve.title,pad,y,small?16:19,p.fg,500)+7;
      y+=text('有效交付能力 · 情景示意',pad,y,11,p.muted)+4;
      const left=pad+34,right=w-pad-5,top=y+12,bottom=y+101;
      line(left,top,right,top,p.line,.6);line(left,bottom,right,bottom);
      text('更高',pad,top-7,11,p.muted);text('当前',pad,bottom-7,11,p.muted);
      let d='';for(let i=0;i<=80;i++){const t=i/80;d+=(i?' L ':'M ')+(left+(right-left)*t)+' '+(bottom-(bottom-top-5)*M.curveValue(result.curve.id,t));}
      add(`<path d="${d} L ${right} ${bottom} L ${left} ${bottom} Z" fill="url(#curve-area)"/><path d="${d}" fill="none" stroke="${p.ink}" stroke-width="2.3" stroke-linecap="round"/>`);
      text(result.curve.phases[0],left,bottom+11,11,p.muted,400,'start',(right-left)/2);text(result.curve.phases[1],right,bottom+11,11,p.muted,400,'end',(right-left)/2);
      y=bottom+42;y+=text('相对推进过程 · 同等人员投入与交付质量假设',pad,y,11,p.muted,400,'start',inner,18)+9;
      y+=text(result.curve.condition,pad,y,11,p.muted,400,'start',inner,19)+8;
    }else{
      y+=text('先补齐条件，再看变化节奏',pad,y,small?15:18,p.fg,500)+8;
      y+=text('目前暂不生成改善曲线。还需核实资料是否可用、谁负责复核，以及重复任务或经验复用能否成立。',pad,y,12,p.muted,400,'start',inner,21)+10;
    }
    y+=text('本图用于经营探索，曲线不预测日期、营收或增长率。',pad,y,11,p.muted,400,'start',inner,18)+18;
    line(pad,y,w-pad,y);y+=13;
    y+=text('GAIDN · 企业 AI 经营探索',pad,y,11,p.muted,400,'start',inner)+9;
    const height=Math.ceil(y+8);
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${height}" viewBox="0 0 ${w} ${height}" role="img" aria-label="${esc(result.data.subject.name+'：'+result.classification+'。'+result.headline)}" style="font-family:${esc(font)}"><title>${esc(result.classification)}</title><desc>${esc(result.explanation+' '+result.next)}</desc><rect x=".5" y=".5" width="${w-1}" height="${height-1}" rx="18" fill="${p.bg}" stroke="${p.line}"/>${parts.join('')}</svg>`;
    return {svg,width:w,height,hitTargets};
  }
  host.GAIDNPoster={poster,wrap};
})(globalThis);
