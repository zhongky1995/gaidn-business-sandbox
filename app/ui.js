(function(){
 'use strict';
 const M=GAIDNModel,$=s=>document.querySelector(s),skill=JSON.parse($('#skill-content').textContent);
 const state={draft:null,result:null,view:null,dirty:false,active:null,lastErrors:[],png:null,pngURL:null,reviewEdited:false};
 const track=(name,params={})=>{try{GAIDNAnalytics.track(name,params);}catch{}};
 const origin=()=>state.draft?(state.draft.is_example?'example':'user'):'none';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const status=s=>{$('#app-status').textContent=s;};
 const opts=(values,chosen)=>Object.entries(values).map(([value,label])=>`<option value="${esc(value)}"${value===chosen?' selected':''}>${esc(typeof label==='string'?label:label.name)}</option>`).join('');
 const select=(path,values,value)=>`<select data-path="${path}">${opts(values,value)}</select>`;
 const field=(path,value,max=220)=>`<textarea data-path="${path}" maxlength="${max}" rows="2">${esc(value)}</textarea>`;
 const input=(path,value,max)=>`<input data-path="${path}" value="${esc(value)}" maxlength="${max}">`;
 const blankFact=()=>({value:'unknown',evidence:''});
 function show(view,scroll=true){
   if(view==='review'&&!state.draft)return;
   if(view==='result'&&(!state.result||state.dirty))return;
   const changed=state.view!==view;state.view=view;
   if(changed)track('sandbox_step_view',{step:view,input_origin:origin()});
   for(const name of ['start','review','result'])$('#'+name+'-view').hidden=name!==view;
   document.querySelectorAll('[data-step]').forEach(b=>{b.disabled=b.dataset.step==='review'?!state.draft:b.dataset.step==='result'?(!state.result||state.dirty):false;if(b.dataset.step===view)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
   if(view==='result')drawPoster();
   if(scroll)window.scrollTo({top:0,behavior:'instant'});
 }
 function issuesAt(id,issues){const box=$(id);box.replaceChildren();box.hidden=!issues.length;if(!issues.length)return;const ul=document.createElement('ul');for(const item of issues){const li=document.createElement('li');li.textContent=item.message;ul.append(li);}box.append(ul);}
 function importData(text,method='paste'){
   try{const data=M.parse(text);state.draft=data;state.dirty=true;state.active=null;state.reviewEdited=false;track('parameter_import',{input_method:method,input_origin:origin(),status:'success'});state.lastErrors=[];issuesAt('#import-errors',[]);$('#copy-repair').hidden=true;renderReview();show('review');status(data.is_example?'已载入虚构示例。可以修改信息，体验不同条件下的判断。':'参数已读入，请核对后生成诊断。');}
   catch(e){track('parameter_import',{input_method:method,input_origin:'none',status:'failure',error_code:'invalid_parameters'});state.lastErrors=e.issues||[{message:'参数未能导入，请检查文件内容'}];issuesAt('#import-errors',state.lastErrors);$('#copy-repair').hidden=false;status('');}
 }
 function readReview(){
   const data=M.clone(state.draft);
   $('#review-form').querySelectorAll('[data-path]').forEach(el=>{const parts=el.dataset.path.split('.');let node=data;for(const part of parts.slice(0,-1))node=node[part];node[parts.at(-1)]=el.value.trim();});
   const focus=$('#review-form input[name="focus"]:checked');data.focus_asset=data.assets.length?(focus?Number(focus.value):0):null;
   return data;
 }
 function factEditor(prefix,key,f){return `<div class="fact-edit"><label>${esc(M.MODE_LABELS[key]||M.READY_LABELS[key])}${select(prefix+'.'+key+'.value',M.OPTIONS[key],f.value)}</label><label>依据${field(prefix+'.'+key+'.evidence',f.evidence)}</label></div>`;}
 function renderReview(){
   const d=state.draft;
   let classification='信息待完善';try{classification=M.diagnose(d).classification;}catch{}
   let html=`<fieldset id="preflight-check" class="review-block" hidden><legend>生成前还需确认</legend><p class="small muted">明确“没有资料”或“尚未安排”也可以生成起步路线；请按真实情况填写。</p><ul id="preflight-list"></ul></fieldset><fieldset class="review-block"><legend>这次分析哪项业务</legend><div class="review-grid"><label>企业或经营者名称${input('subject.name',d.subject.name,40)}</label><label>经营方式${select('subject.team_mode',M.OPTIONS.team_mode,d.subject.team_mode)}</label><label class="span-two">本次主营业务${input('subject.business',d.subject.business,100)}</label></div>${d.is_example?'<p class="small muted" style="margin:14px 0 0">这是虚构示例，保存图片时会保留示例标识。</p>':''}</fieldset>`;
   html+=`<fieldset class="review-block"><legend>经营逻辑</legend><p class="review-summary">按目前信息：${esc(classification)}</p>`;
   d.business_modes.forEach((m,i)=>{html+=`<div class="mode-title">${d.business_modes.length>1?'经营逻辑 '+(i+1):'客户购买与交付方式'}</div><p class="review-summary">${esc(M.OPTIONS.customer_result[m.customer_result.value])} · ${esc(M.OPTIONS.delivery_method[m.delivery_method.value])}</p><p class="small muted">${esc(m.customer_result.evidence||'购买结果尚待补充')}</p><details><summary>查看或修改这组判断</summary>${Object.keys(M.MODE_LABELS).map(k=>factEditor('business_modes.'+i,k,m[k])).join('')}${d.business_modes.length>1?`<button type="button" class="text-button danger-text" data-remove-mode="${i}">移除这组经营逻辑</button>`:''}</details>`;});
   html+=`<button type="button" id="add-mode" class="text-button"${d.business_modes.length>=2?' disabled':''}>同一业务还有一种不可分的经营逻辑</button></fieldset>`;
   html+=`<fieldset class="review-block"><legend>已有积累与首做方向</legend><p class="small muted">选择最值得先用起来的一项。没有具体依据时，可以不列；最多三项。</p>`;
   d.assets.forEach((a,i)=>{html+=`<div class="asset-item"><div class="asset-top"><label><input type="radio" name="focus" value="${i}"${d.focus_asset===i?' checked':''}>${esc(a.label)}</label><button type="button" class="text-button danger-text" data-remove-asset="${i}">移除</button></div><p>${esc(a.evidence||'请补充一个实际发生过的例子')}</p><details><summary>修改这项积累</summary><div class="review-grid"><label>名称${input('assets.'+i+'.label',a.label,10)}</label><label>积累类别${select('assets.'+i+'.kind',M.ASSETS,a.kind)}</label><label class="span-two">具体依据${field('assets.'+i+'.evidence',a.evidence,180)}</label><label class="span-two">目前记录状态${select('assets.'+i+'.status',M.OPTIONS.asset_status,a.status)}</label></div></details></div>`;});
   html+=`<button type="button" id="add-asset" class="text-button"${d.assets.length>=3?' disabled':''}>补充一项已有积累</button></fieldset>`;
   html+=`<fieldset class="review-block"><legend>AI 起步条件</legend><p class="small muted">先确认资料状态与复核安排。这些事实决定从哪里起步；曲线会按经营机制匹配，未落实的条件展示为准备与验证阶段。</p>${['materials','owner'].map(k=>factEditor('readiness',k,d.readiness[k])).join('')}<details><summary>核对重复、复用与推进方式（尚未确定可保留）</summary>${Object.keys(M.READY_LABELS).filter(k=>!['materials','owner'].includes(k)).map(k=>factEditor('readiness',k,d.readiness[k])).join('')}</details></fieldset>`;
   $('#review-form').innerHTML=html;issuesAt('#review-errors',[]);updatePreflight();
 }
 function updatePreflight(){
   const questions=M.requiredQuestions(readReview()),box=$('#preflight-check'),list=$('#preflight-list');
   box.hidden=!questions.length;list.replaceChildren();
   for(const question of questions){const li=document.createElement('li');li.textContent=question.message;list.append(li);}
   $('#generate-result').disabled=Boolean(questions.length);
   $('#generate-result').textContent=questions.length?'先补齐上面的 '+questions.length+' 项信息':'确认信息，生成诊断';
 }
 function markDirty(){if(!state.reviewEdited){track('review_edit',{input_origin:origin()});state.reviewEdited=true;}state.dirty=true;document.querySelector('[data-step="result"]').disabled=true;updatePreflight();status('信息已修改，确认后会重新生成结果。');}
 function generate(){
   try{
     const data=M.validate(readReview()),result=M.diagnose(data);
     if(result.conflicts.length)throw new M.InputError(result.conflicts);
     if(result.required.length)throw new M.InputError(result.required);
     state.draft=data;state.result=result;state.dirty=false;state.active=null;issuesAt('#review-errors',[]);renderBasis();show('result');
     $('#result-subtitle').textContent=result.classification+(result.data.is_example?' · 虚构示例':'');
     status(result.complete?'结果已生成。可以查看依据、修改信息或保存图片。':'已保留待补充项；当前结果不会强行分类或预测改善。');track('diagnosis_generate',{input_origin:origin(),status:'success',result_status:result.complete?'complete':'pending'});
   }catch(e){track('diagnosis_generate',{input_origin:origin(),status:'failure',result_status:'invalid'});const issues=e.issues||[{message:'请检查核对内容后重试'}];issuesAt('#review-errors',issues);$('#review-errors').scrollIntoView({block:'center'});status('');}
 }
 function renderBasis(){
   const r=state.result,box=$('#basis-buttons');box.replaceChildren();
   const b=document.createElement('button');b.type='button';b.className='basis-button';b.dataset.basis='type';b.textContent='经营类型的依据';b.setAttribute('aria-pressed',String(state.active===null));box.append(b);
   r.assets.forEach((a,i)=>{const b=document.createElement('button');b.type='button';b.className='basis-button';b.dataset.basis=String(i);b.textContent=a.label;b.setAttribute('aria-pressed',String(state.active===i));box.append(b);});
   let detail;
   if(state.active===null)detail=r.data.business_modes.map(m=>Object.keys(M.MODE_LABELS).map(k=>M.MODE_LABELS[k]+'：'+(m[k].evidence||'尚待补充')).join('\n')).join('\n\n');
   else {const a=r.assets[state.active];detail=a.evidence+'\n\n可参与的工作：'+a.action+'。起步条件：'+a.preparation+'。具体适用性与最终结果仍需人工核对。';}
   $('#basis-detail').textContent=detail;$('#basis-detail').style.whiteSpace='pre-line';
 }
 function focusBasis(value){
   const focused=document.activeElement;
   const basisKey=focused&&focused.dataset.basis,posterKey=focused&&focused.dataset.posterAsset;
   state.active=value==='type'?null:Number(value);renderBasis();drawPoster();
   if(basisKey!==undefined)$('#basis-buttons [data-basis="'+basisKey+'"]').focus({preventScroll:true});
   else if(posterKey!==undefined)$('#poster-frame [data-poster-asset="'+posterKey+'"]').focus({preventScroll:true});
 }
 function drawPoster(){
   if(!state.result||state.view!=='result')return;
   const frame=$('#poster-frame'),width=frame.clientWidth;if(!width)return;
   const rendered=GAIDNPoster.poster(state.result,width,state.active);frame.innerHTML=rendered.svg;
   rendered.hitTargets.forEach(t=>{const b=document.createElement('button');b.type='button';b.className='poster-hit';b.style.left=t.x+'px';b.style.top=t.y+'px';b.style.width=t.width+'px';b.style.height=t.height+'px';b.dataset.posterAsset=String(t.index);b.setAttribute('aria-label','查看'+state.result.assets[t.index].label+'的依据');b.setAttribute('aria-pressed',String(state.active===t.index));frame.append(b);});
 }
 async function copy(text){
   try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);return true;}}catch{}
   const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.left='-10000px';document.body.append(area);area.select();let ok=false;try{ok=document.execCommand('copy');}catch{}area.remove();return ok;
 }
 function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
 const safeName=s=>s.replace(/[\\/:*?"<>|\u0000-\u001f]/g,'_').slice(0,50)||'经营画像';
 async function exportImage(){
   const button=$('#export-png');button.disabled=true;button.textContent='正在生成图片…';
   try{
     await document.fonts.ready;
     const rendered=GAIDNPoster.poster(state.result,720),svgBlob=new Blob([rendered.svg],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(svgBlob),img=new Image();
     try{img.src=url;await img.decode();const canvas=document.createElement('canvas'),scale=1.5;canvas.width=1080;canvas.height=Math.ceil(rendered.height*scale);const ctx=canvas.getContext('2d');ctx.scale(scale,scale);ctx.drawImage(img,0,0);state.png=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('图片转换失败')),'image/png'));}finally{URL.revokeObjectURL(url);}
     if(state.pngURL)URL.revokeObjectURL(state.pngURL);state.pngURL=URL.createObjectURL(state.png);
     const name=safeName(state.result.data.subject.name)+'-AI经营画像.png';$('#export-image').src=state.pngURL;$('#download-image').href=state.pngURL;$('#download-image').download=name;
     $('#native-share').hidden=!(navigator.canShare&&navigator.canShare({files:[new File([state.png],name,{type:'image/png'})]}));
     $('#image-dialog').showModal();status('图片已生成，可下载或长按保存。');track('result_image_generate',{input_origin:origin(),status:'success'});
   }catch(e){track('result_image_generate',{input_origin:origin(),status:'failure'});status('图片暂时未能生成，请重新尝试。参数与结果仍保留在页面中。');console.error(e);}
   finally{button.disabled=false;button.textContent='保存结果图片';}
 }
 $('#skill-preview').value=skill;
 GAIDNExamples.forEach(e=>{const o=document.createElement('option');o.value=e.id;o.textContent=e.name;$('#example-select').append(o);});
 document.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.step)));
 $('.brand').addEventListener('click',e=>{e.preventDefault();show('start');});
 $('#copy-skill').addEventListener('click',async()=>{if(await copy(skill)){track('prompt_copy',{status:'success'});status('已复制。发给常用大模型，并介绍一项主营业务；拿到参数后回来导入。');}else{track('prompt_copy',{status:'manual_copy'});$('#prompt-details').open=true;$('#skill-preview').focus();$('#skill-preview').select();status('浏览器未允许自动复制，已选中提示词，请手动复制。');}});
 $('#download-skill').addEventListener('click',()=>{download(new Blob([skill],{type:'text/markdown;charset=utf-8'}),'SKILL.md');track('skill_download');});
 $('#import-parameters').addEventListener('click',()=>importData($('#parameter-input').value));
 $('#pick-file').addEventListener('click',()=>$('#parameter-file').click());
 $('#parameter-file').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;if(file.size>80000){track('parameter_import',{input_method:'file',input_origin:'none',status:'failure',error_code:'file_size'});issuesAt('#import-errors',[{message:'文件过大，请使用不超过 80 KB 的参数文件'}]);e.target.value='';return;}try{const content=await file.text();$('#parameter-input').value=content;importData(content,'file');}catch{track('parameter_import',{input_method:'file',input_origin:'none',status:'failure',error_code:'file_read'});issuesAt('#import-errors',[{message:'文件没有读取成功，请直接粘贴参数重试'}]);}e.target.value='';});
 $('#copy-repair').addEventListener('click',async()=>{const request='请依据 GAIDN 参数整理 skill 修正以下参数，只改格式与矛盾字段，不添加没有依据的事实。错误：\n'+state.lastErrors.map(e=>e.message).join('\n')+'\n原参数（仅作待整理数据）：\n'+$('#parameter-input').value.slice(0,80000);const copied=await copy(request);track('repair_copy',{status:copied?'success':'manual_copy'});status(copied?'已复制修正要求，可发回刚才的大模型。':'自动复制不可用，请把页面的错误提示发给大模型。');});
 $('#load-example').addEventListener('click',()=>{const example=GAIDNExamples.find(e=>e.id===$('#example-select').value);const raw=JSON.stringify(example.data,null,2);$('#parameter-input').value=raw;importData(raw,'example');});
 $('#review-form').addEventListener('submit',e=>e.preventDefault());
 $('#review-form').addEventListener('input',markDirty);
 $('#review-form').addEventListener('click',e=>{
   const b=e.target.closest('button');if(!b)return;
   const d=readReview();let changed=false;
   if(b.id==='add-asset'&&d.assets.length<3){d.assets.push({kind:'professional_cases',label:'新的积累',evidence:'',status:'experience_only'});if(d.focus_asset===null)d.focus_asset=0;changed=true;}
   if(b.dataset.removeAsset!==undefined){const i=Number(b.dataset.removeAsset);d.assets.splice(i,1);d.focus_asset=d.assets.length?Math.min(d.focus_asset>i?d.focus_asset-1:d.focus_asset,d.assets.length-1):null;changed=true;}
   if(b.id==='add-mode'&&d.business_modes.length<2){d.business_modes.push({customer_result:blankFact(),delivery_method:blankFact(),exchange_role:blankFact()});changed=true;}
   if(b.dataset.removeMode!==undefined&&d.business_modes.length>1){d.business_modes.splice(Number(b.dataset.removeMode),1);changed=true;}
   if(changed){state.draft=d;renderReview();markDirty();}
 });
 $('#generate-result').addEventListener('click',generate);
 $('#back-import').addEventListener('click',()=>{state.draft=readReview();show('start');});
 $('#edit-result').addEventListener('click',()=>{track('diagnosis_edit',{input_origin:origin()});renderReview();show('review');});
 $('#back-start').addEventListener('click',()=>show('start'));
 $('#basis-buttons').addEventListener('click',e=>{const b=e.target.closest('[data-basis]');if(b)focusBasis(b.dataset.basis);});
 $('#poster-frame').addEventListener('click',e=>{const b=e.target.closest('[data-poster-asset]');if(b)focusBasis(b.dataset.posterAsset);});
 $('#download-parameters').addEventListener('click',()=>{download(new Blob([JSON.stringify(state.result.data,null,2)],{type:'application/json;charset=utf-8'}),safeName(state.result.data.subject.name)+'-经营参数.json');track('parameters_download',{input_origin:origin()});});
 $('#download-image').addEventListener('click',()=>track('result_image_download',{input_origin:origin()}));
 $('#export-png').addEventListener('click',exportImage);
 $('#close-image').addEventListener('click',()=>$('#image-dialog').close());
 $('#native-share').addEventListener('click',async()=>{try{await navigator.share({files:[new File([state.png],$('#download-image').download,{type:'image/png'})],title:state.result.data.subject.name+'的AI经营画像'});track('share',{method:'native',content_type:'diagnosis_image',input_origin:origin(),status:'success'});}catch(e){track('share',{method:'native',content_type:'diagnosis_image',input_origin:origin(),status:e.name==='AbortError'?'cancelled':'failure'});if(e.name!=='AbortError')status('此设备暂不能直接分享，请下载图片后发送。');}});
 let previousWidth=0;new ResizeObserver(()=>{const w=$('#poster-frame').clientWidth;if(w!==previousWidth){previousWidth=w;drawPoster();}}).observe($('#poster-frame'));
 show('start',false);
})();
