(function(h){
'use strict';
const A=typeof module!=='undefined'&&module.exports?require('./poster-assets.js'):h.GAIDNPosterAssets;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#x27;'}[c]));
function wrap(s,limit=31){const lines=[];let line='',n=0;for(const ch of s){const k=ch.charCodeAt(0)<128?.55:1;if(n+k>limit){lines.push(line);line=ch;n=k;}else{line+=ch;n+=k;}}if(line)lines.push(line);return lines.join('\n');}
function cut(s,limit){let n=0,out='';for(const ch of s){const w=ch.charCodeAt(0)<128?.55:1;if(n+w>limit)return out+'…';n+=w;out+=ch;}return out;}
const units=s=>[...s].reduce((n,c)=>n+(c.charCodeAt(0)<128?.55:1),0);
function fitTag(old,value,config){
 let tag=old.slice(0,old.indexOf('>')+1);const x=tag.match(/ x="([^"]+)"/)[1],base=Number(tag.match(/font-size="([^"]+)"/)[1]);let size=base,lines=String(value).split('\n');
 if(config){const [width,min,maxLines]=config;if(lines.length>maxLines)lines=[lines.join('')];if(maxLines>1&&lines.length===1&&units(lines[0])*base>width){lines=wrap(lines[0],width/base).split('\n');}
  if(lines.length>maxLines){size=min;lines=wrap(lines.join(''),width/size).split('\n');}
  const max=Math.max(...lines.map(units),1);size=Math.max(min,Math.min(size,Math.floor(width/max*100)/100));if(size>base)size=base;
  lines=lines.slice(0,maxLines).map(v=>cut(v,width/size-1));if(String(value).replace(/\n/g,'').length>lines.join('').replace(/…/g,'').length&&!lines.at(-1).endsWith('…'))lines[lines.length-1]=cut(lines.at(-1),width/size-1)+'…';
  // Keep the approved reference SVG unchanged when no adaptation is needed.
  const original=String(value).split('\n');if(original.length<=maxLines&&original.every(v=>units(v)*base<=width)){size=base;lines=original;}
 }
 tag=tag.replace(/font-size="[^"]+"/,'font-size="'+size+'"');const dy=Math.round(size*1.38*100)/100;
 return tag+lines.map((v,i)=>'<tspan x="'+x+'" dy="'+(i?dy:0)+'">'+esc(v)+'</tspan>').join('')+'</text>';
}
function replaceText(svg,role,value){const re=new RegExp('<text data-role="'+role+'"[^>]*>[\\s\\S]*?</text>'),configs={company:[772,24,1],business:[772,16,1],headline:[772,34,2],diagnosis:[772,22,3],priority:[732,19,1],'first-step':[772,16,1]};return svg.replace(re,old=>fitTag(old,value,configs[role]));}
const positions={knowledge:[[450,224],[229,65],[685,265]],process:[[450,221],[207,274],[696,274]],expert:[[350,234],[176,28],[176,320]],project:[[450,233],[204,37],[686,293]],matching:[[450,222],[248,39],[652,280]],network:[[450,-1],[150,192],[750,192]]};
function poster(r,width=900){
 const d=r.data,inferred=Boolean(d.assumptions?.length);if(!A.templates[r.kind]||!A.curves[r.curve.id])throw new Error('企业优势和经营基础尚未确认');
 let svg=A.templates[r.kind].replace('__FONT__',A.font).replace(/aria-label="[^"]*"/,'aria-label="'+esc(d.company.name)+'企业 AI 化机会画像'+(d.is_example?' · 虚构示例':'')+'"');
 const exampleIndex={knowledge:1,process:2,expert:3,project:4,matching:5,network:6}[r.kind];
 for(const [role,value] of Object.entries({company:d.company.name,business:d.company.business+(d.company.customers?' · '+d.company.customers:''),headline:d.headline.join('\n'),diagnosis:wrap(d.diagnosis),priority:d.priority,'first-step':d.first?'起步例子｜'+d.first:'起步例子｜围绕优先方向，先验证一组真实业务。',example:d.is_example?String(exampleIndex).padStart(2,'0')+' / 虚构企业示例':(inferred?'初步画像 · 含 AI 联想':'企业经营探索'),kind:r.classification}))svg=replaceText(svg,role,value);
 if(inferred){svg=replaceText(svg,'scope','优势线索 → AI 建议方向');svg=replaceText(svg,'disclaimer','含 AI 联想，适用条件待确认；曲线不代表日期、增幅或营收预测。');}
 let assetIndex=0;svg=svg.replace(/<text data-role="asset(?:-primary)?"[^>]*>[\s\S]*?<\/text>/g,old=>{const value=d.assets[assetIndex++]||'待确认线索';return fitTag(old,value,[220,18,1]);});
 svg=svg.replace(/<g data-fixed-model="[\s\S]*?<\/g>/,A.curves[r.curve.id]);
 const scale=width/900;svg=svg.replace('width="900" height="1640"','width="'+width+'" height="'+1640*scale+'"');
 const hitTargets=positions[r.kind].map(([x,y],index)=>({index,x:(x-110)*scale,y:(394+.88*y-27)*scale,width:220*scale,height:40*scale}));
 return {svg,width,height:1640*scale,hitTargets};
}
const api={poster};if(typeof module!=='undefined'&&module.exports)module.exports=api;else h.GAIDNPoster=api;
})(globalThis);
