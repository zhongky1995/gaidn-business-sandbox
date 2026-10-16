(function(host){
'use strict';
const V3=typeof module!=='undefined'&&module.exports?require('./v3-model.js'):host.GAIDNV3;
const clone=x=>JSON.parse(JSON.stringify(x));
class InputError extends Error{constructor(issues){super(issues.map(x=>x.message).join('；'));this.issues=issues;}}
const OPTIONS={
 experience:{unknown:'待确认',repeated:'有多次同类经验',one_case:'有一个实际例子',none:'目前没有实际经验'},
 standard:{unknown:'待确认',ready:'适用条件、做法和合格标准明确',partial:'有部分记录，边界待补',none:'主要靠口头经验'},
 materials:{unknown:'待确认',ready:'资料可查、可用于本次任务',scattered:'有资料，但还分散',none:'还没有可用资料'},
 review:{unknown:'待确认',assigned:'已有明确复核人和检查办法',none:'还未安排复核'},
 ai_use:{unknown:'待确认',none:'还没有使用AI',manual:'人工调用AI',workflow:'已有AI工作流'},
 repetition:{unknown:'待确认',repeated:'同类任务反复发生',occasional:'偶发或一次性任务'},
 correction:{unknown:'待确认',yes:'有实际错误及修订记录',no:'还没有实际修订记录'},
 pilot:{unknown:'待确认',verified:'已有通过检查的试用样板',none:'还没有通过检查的样板'},
 rollout:{unknown:'待确认',single:'先做这一项任务',phased:'计划逐个场景推广'},
 reuse:{unknown:'待确认',verified:'有跨项目复用实例',candidate:'找到候选模块，尚未跨项目验证',none:'暂未找到可复用部分'}
};
const FACT_LABELS={experience:'实际积累',standard:'使用标准',materials:'资料状态',review:'人工复核',ai_use:'AI使用',repetition:'任务频率',correction:'纠错记录',pilot:'试用样板',rollout:'推广安排',reuse:'项目复用依据'};
const MECHANISMS={
 knowledge:{name:'资料共用型',shape:'共用资料库',title:'让好答案，跟着每一次服务到场。',source:'已有资料来源',target:'希望支持的服务环节',ai:'按问题查找依据',action:'按实际问题查找适用说明',effect:'把分散的说明变成可共同查找的依据',steps:['整理适用说明与例外','用真实问题查找说明','核对口径并更新说明']},
 process:{name:'任务接力型',shape:'编号接力链',title:'让好做法，接得住、传得下去。',source:'当前步骤（按先后顺序）',target:'后续步骤（按先后顺序）',ai:'检查交接缺项',action:'检查交接中的资料缺项',effect:'让前后环节在明确条件下接起来',steps:['写清交接与异常去向','检查一次真实任务交接','核对接手与完成记录']},
 expert:{name:'经验传承型',shape:'判断条件分叉树',title:'让一个人的门道，帮到下一次判断。',source:'经验来自谁',target:'希望由谁参考使用',ai:'按条件准备判断',action:'按条件整理判断依据',effect:'把老手如何取舍写成可参考的条件',steps:['说清取舍条件与例外','按条件准备一次判断','由有经验的人核对差异']},
 project:{name:'项目复用型',shape:'项目模块桥',title:'让做过的项目，继续为新项目出力。',source:'已有项目或成果',target:'准备使用的新项目',ai:'核对新旧差异',action:'比较新需求与旧模块的适用差异',effect:'把旧项目中适用的部分带进新项目',steps:['找到可复用部分与边界','比较新需求并准备候选方案','核对差异与验收结果']},
 matching:{name:'资源匹配型',shape:'双侧筛选门',title:'让手里的资源，更快遇到合适的需求。',source:'需求方及约束',target:'已有资源与供给',ai:'按条件筛选候选',action:'按双方条件比较候选',effect:'先筛掉不适合的组合，再由双方确认',steps:['说清双方条件和排除项','比较一次真实需求与资源','人工确认适配与排除原因']},
 network:{name:'协作联动型',shape:'责任交接泳道',title:'让分散的本事，接成一件做得成的事。',source:'谁提供什么（角色·职责）',target:'谁接手什么（角色·职责）',ai:'提醒交接缺项',action:'按共同要求提醒交接缺项',effect:'把各方提供什么、交给谁、如何确认写清楚',steps:['写清各方交付与接手条件','用一次协作检查缺项','核对各方确认与完成记录']},
 explore:{name:'先验证一个起点',shape:'一次真实任务',title:'先做成一件小事，再找到值得放大的本事。',source:'可用线索',target:'本次任务',ai:'辅助整理一次任务',action:'辅助整理一次实际任务',effect:'先留下一份能检查的结果',steps:['选一项真实小任务','AI辅助准备一次结果','人工检查并留下经验']}
};
const MODELS={
 fast:{name:'重复工作提效',title:'先省下重复工，再处理特殊情况',metric:'完成一次合格任务的总工时',reading:'越低，表示完成同样合格的任务所用总工时越少。',direction:'decrease',phases:['接入重复环节','核对实际结果','完善特殊情况'],why:'同类任务反复发生，标准、资料与复核已就绪，可先减少重复准备；特殊情况仍需逐次核对。',check:'比较同类任务、同一合格标准，合计准备、人工复核和返工工时。',condition:'适用于还未充分自动化的重复任务；能否省工时，要看实际记录。'},
 delayed:{name:'经验沉淀复用',title:'先花时间把经验留下，再看下一次能省多少',metric:'每次同类任务的总工时（含整理与复核）',reading:'先升：整理经验要投入；后降：复用成立后才可能省工时。',direction:'mixed',phases:['整理经验与边界','试用同类任务','复核后再次使用'],why:'经验还要整理和试用，前期总工时可能增加；后续任务能否复用，要由实际结果验证。',check:'计入首次整理、请教老手、人工复核和返工；对照后续同类任务，不假定必然回本。',condition:'必须有真实经验可整理；资料或复核不足，先补齐安排再试用。'},
 gradual:{name:'持续纠错改进',title:'把这次发现的错误，挡在下次交付之前',metric:'同等任务量下的返工次数',reading:'越低，表示完成同样任务量时，因不合格而重做的次数越少。',direction:'decrease',phases:['检查现有使用','把错误写回依据','再次检验同类任务'],why:'AI已有实际使用和纠错记录，继续把错误与修订写回依据，再看同类错误是否减少。',check:'采用同等任务量和同一合格标准，记录返工次数、错误原因及是否再次出现。',condition:'已有AI使用、实际修订和明确复核人；持续纠错不等于保证持续改善。'},
 staged:{name:'样板逐步推广',title:'一个场景验收通过，再把好做法多用一处',metric:'已通过试用验收的业务场景数',reading:'每上一阶，表示又有一个场景通过检查；平台期表示还在验证。',direction:'increase',phases:['复核当前样板','试用一个新场景','通过验收再推广'],why:'已有通过检查的样板，但新场景条件不同；只在逐个验收通过后扩大使用范围。',check:'每个场景留下适用条件、负责人、试用结果与验收记录；未通过的不计入。',condition:'这条线只表示通过验收的使用范围扩大，不表示工时、营收或利润增长。'},
 explore:{name:'先做一次验证',title:'先留下一次结果，再决定下一步',metric:'本次任务是否通过人工检查',reading:'水平虚线表示尚待验证，不表示已经测得没有改善。',direction:'pending',phases:['选定一次任务','辅助完成一次','人工检查结果'],why:'目前不足以采用四套改善模型。先完成一次实际任务，留下可比较的结果。',check:'记下任务要求、AI参与部分和人工检查结果，再决定是否继续。',condition:'不预设改善幅度，也不把一次任务当作长期增长证明。'}
};
const MODEL_OPTIONS={unknown:'请选择本次观察方式',...Object.fromEntries(Object.entries(MODELS).map(([k,v])=>[k,v.name]))};
const MECHANISM_OPTIONS={unknown:'请选择最接近的使用关系',...Object.fromEntries(Object.entries(MECHANISMS).map(([k,v])=>[k,v.name]))};
function blank(){return {schema_version:'4.0',is_example:false,company:{name:'',business:''},work:{task:'',asset:'',evidence:''},mechanism:'unknown',sources:[],targets:[],model:'unknown',facts:Object.fromEntries(Object.keys(OPTIONS).map(k=>[k,'unknown'])),reviewer:'',goal:''};}
const TEXT_LIMITS={'company.name':40,'company.business':100,'work.task':100,'work.asset':18,'work.evidence':600,reviewer:200,goal:160};
function normalize(raw){
 const d=blank(),notes=[];for(const k of ['company','work','facts'])if(raw[k]!==undefined&&(!raw[k]||typeof raw[k]!=='object'||Array.isArray(raw[k])))notes.push(k+'格式需重新确认');const text=(obj,k,path)=>{if(obj?.[k]===undefined)return '';if(typeof obj[k]!=='string'){notes.push(path+'格式需重新确认');return '';}return obj[k].trim();};
 d.is_example=raw.is_example===true;if(raw.is_example!==undefined&&typeof raw.is_example!=='boolean'){d.is_example=true;notes.push('示例标识格式未识别，暂按示例展示；原输入已保留');}
 for(const [g,keys] of [['company',['name','business']],['work',['task','asset','evidence']]])for(const k of keys)d[g][k]=text(raw[g],k,g+'.'+k);
 for(const k of ['reviewer','goal'])d[k]=text(raw,k,k);
 for(const [k,opts] of [['mechanism',MECHANISM_OPTIONS],['model',MODEL_OPTIONS]])if(raw[k]!==undefined){if(Object.hasOwn(opts,raw[k]))d[k]=raw[k];else notes.push(k+'未识别，已标为待确认');}
 for(const k of Object.keys(OPTIONS))if(raw.facts?.[k]!==undefined){if(Object.hasOwn(OPTIONS[k],raw.facts[k]))d.facts[k]=raw.facts[k];else notes.push(FACT_LABELS[k]+'未识别，已标为待确认');}
 for(const k of ['sources','targets'])if(raw[k]!==undefined){if(Array.isArray(raw[k])&&raw[k].every(v=>typeof v==='string'))d[k]=raw[k].map(v=>v.trim()).filter(Boolean);else notes.push(k+'需填写短名称列表');}
 for(const k of ['previous_parameters','original_parameters'])if(raw[k]&&typeof raw[k]==='object')d[k]=clone(raw[k]);
 const known=new Set([...Object.keys(d),'import_notes']);const extra=Object.keys(raw).filter(k=>!known.has(k));if(extra.length)notes.push('另有字段仅保存在原参数中，不参与曲线：'+extra.join('、'));
 const needsOriginal=notes.length>0;if(Array.isArray(raw.import_notes))notes.unshift(...raw.import_notes.filter(v=>typeof v==='string'));
 if(notes.length){d.import_notes=[...new Set(notes)];if(needsOriginal&&!d.original_parameters)d.original_parameters=clone(raw);}
 return d;
}
function migrate(raw){
 let old,legacyValidated=true;try{old=V3.parse(JSON.stringify(raw));}catch{old=raw;legacyValidated=false;}const d=blank(),f=(g,k)=>typeof old[g]?.[k]?.value==='string'?old[g][k].value:'unknown',str=v=>typeof v==='string'?v:'';
 d.is_example=old.is_example===true;d.company={name:str(old.subject?.name),business:str(old.subject?.business)};d.work={task:str(old.focus?.task),asset:str(old.focus?.asset),evidence:str(old.focus?.experience?.evidence)};
 d.mechanism=old.opportunity?.intent?.value||'unknown';d.sources=old.opportunity?.sources||[];d.targets=old.opportunity?.targets||[];
 d.facts.experience=f('focus','experience');const record=f('memory','record');d.facts.standard=(legacyValidated&&V3.diagnose(old).ruleComplete)?'ready':record==='none'?'none':record==='unknown'?'unknown':'partial';
 d.facts.materials=f('readiness','materials');d.facts.review=f('readiness','owner')==='assigned'&&f('readiness','review')==='clear'?'assigned':f('readiness','owner')==='none'||f('readiness','review')==='none'?'none':'unknown';
 d.facts.ai_use={auto_traced:'workflow',auto_untraced:'workflow',manual:'manual',none:'none'}[f('practice','ai_use')]||'unknown';d.facts.correction={closed:'yes',none:'no'}[f('practice','feedback')]||'unknown';
 d.facts.repetition=f('readiness','frequency');d.facts.pilot=f('opportunity','pilot')==='ready'?'verified':f('opportunity','pilot');d.facts.rollout=f('readiness','rollout');d.facts.reuse=f('opportunity','reuse');
 d.reviewer=[old.readiness?.owner?.evidence,old.readiness?.review?.evidence].filter(Boolean).join('；');d.goal=old.outcome?.metric||'';d.previous_parameters=clone(raw);d.import_notes=['原参数完整保留。请确认新模型的观察口径；原业务指标不会自动替换成固定曲线。'];if(!legacyValidated)d.import_notes.push('旧参数有缺项或格式问题，已提取可识别内容；其余在本页补齐。');return normalize(d);
}
function parse(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>320000)throw new InputError([{path:'input',message:'请使用不超过320 KB的参数文本'}]);
 const blocks=[...text.matchAll(/```(?:json)?\s*\n?([\s\S]*?)```/g)];if(blocks.length>1)throw new InputError([{path:'input',message:'请一次导入一份参数；当前有多个代码框'}]);
 let raw;try{raw=JSON.parse((blocks.length?blocks[0][1]:text).trim());}catch{throw new InputError([{path:'input',message:'这段JSON格式不完整。可保留原文修正，也可以从空白核对页直接填写'}]);}
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new InputError([{path:'input',message:'请导入一份JSON参数对象'}]);
 if(['1.0','2.0','3.0','3.1'].includes(raw.schema_version))return migrate(raw);
 if(raw.schema_version!=='4.0'&&!(raw.schema_version===undefined&&(raw.company||raw.work)))throw new InputError([{path:'schema_version',message:'请使用本页提示词返回schema4.0；支持保留1.0至3.1旧版参数'}]);
 return normalize(raw);
}
function relevantFacts(d){return [...new Set(['experience',...(d.model==='fast'?['repetition','standard','materials','review','ai_use']:d.model==='delayed'?['standard','materials','review']:d.model==='gradual'?['ai_use','correction','review','standard']:d.model==='staged'?['pilot','rollout','standard','materials','review']:['review']),...(d.mechanism==='project'?['reuse']:[])])];}
function requiredQuestions(d){
 const q=[],bad=(path,message)=>{if(!q.some(v=>v.path===path))q.push({path,message});},get=path=>path.split('.').reduce((o,k)=>o?.[k],d);
 for(const [path,max] of Object.entries(TEXT_LIMITS)){const v=get(path);if(typeof v!=='string')bad(path,'请确认'+path+'的文字');else if(v.length>max)bad(path,'请将'+path+'缩短到'+max+'字以内；原输入仍保留');}
 for(const [path,label] of [['company.name','企业或经营者名称'],['company.business','主营业务'],['work.task','这次先看哪项工作']])if(!get(path)?.trim())bad(path,'请填写'+label);
 for(const k of relevantFacts(d))if(!OPTIONS[k]?.[d.facts[k]]||d.facts[k]==='unknown')bad('facts.'+k,'请确认'+FACT_LABELS[k]);
 if(d.mechanism==='unknown'||!MECHANISMS[d.mechanism])bad('mechanism','请确认已有本事准备怎样使用');
 if(d.model==='unknown'||!MODELS[d.model])bad('model','请选择本次观察的固定模型，并确认它的指标');
 if(d.mechanism==='explore'&&d.model!=='unknown'&&d.model!=='explore')bad('model','当前还在验证使用关系，请先选“先做一次验证”；明确关系后再采用改善模型');
 const has=d.facts.experience==='repeated'||d.facts.experience==='one_case';
 if(has){if(!d.work.asset.trim())bad('work.asset','请给已有本事起一个短名称');if(d.work.evidence.trim().length<8)bad('work.evidence','请留下一个实际事例，说明这项积累从哪里来');}
 if(has&&d.mechanism==='explore'){}else if(d.mechanism!=='unknown'&&d.mechanism!=='explore'){
  if(!has&&d.facts.experience==='none')bad('mechanism','当前没有实际经验，请选择“先验证一个起点”；取得例子后再判断优势类型');
  for(const k of ['sources','targets']){if(!Array.isArray(d[k])||!d[k].length)bad(k,'请填写'+(k==='sources'?'已有来源或当前步骤':'希望支持的对象或后续步骤'));else if(d[k].length>3||d[k].some(x=>typeof x!=='string'||!x.trim()||x.length>12))bad(k,'每侧最多3项，每项1—12字；请在页面精简名称');}
 }
 if(d.facts.review==='assigned'&&d.reviewer.trim().length<6)bad('reviewer','请写明谁复核、怎样判断合格');
 const requireValue=(k,values,message)=>{if(d.facts[k]!=='unknown'&&!values.includes(d.facts[k]))bad('facts.'+k,message);};
 if(d.model!=='unknown'&&d.model!=='explore'&&!has&&d.facts.experience==='none')bad('model','还没有实际经验，先选“先做一次验证”');
 if(d.model==='fast'){
 requireValue('experience',['repeated'],'重复工作提效需要多次同类经验；否则先选经验沉淀复用或一次验证');requireValue('repetition',['repeated'],'偶发任务不适用重复工作提效，请选择其他观察方式');
 for(const k of ['standard','materials'])requireValue(k,['ready'],FACT_LABELS[k]+'还未就绪，先选经验沉淀复用');requireValue('review',['assigned'],'重复工作提效需要明确的复核人和检查办法');requireValue('ai_use',['none','manual'],'已有工作流时不重复计算首次提效，可选择持续纠错改进');
 }
 if(d.model==='gradual'){requireValue('ai_use',['manual','workflow'],'持续纠错改进需要已有AI使用；否则先整理经验或验证一次');requireValue('correction',['yes'],'还没有实际修订记录，不能按持续纠错改进展示');requireValue('review',['assigned'],'持续纠错改进需要明确复核人和检查办法');}
 if(d.model==='staged'){requireValue('pilot',['verified'],'还没有通过检查的样板，请先做一次验证或整理经验');requireValue('rollout',['phased'],'本次只做单项任务，不采用样板逐步推广曲线');for(const k of ['standard','materials'])requireValue(k,['ready'],FACT_LABELS[k]+'还未就绪，暂不能推广样板');requireValue('review',['assigned'],'推广样板需要明确复核人和检查办法');}
 if(d.mechanism==='project'&&d.facts.reuse==='verified'&&d.facts.experience==='none')bad('facts.reuse','没有实际经验与已验证跨项目复用相矛盾，请核对');
 if(d.mechanism==='project'&&d.facts.reuse==='none')bad('mechanism','尚未找到可复用部分，请改选一次验证，或补充真实候选模块');
 return q;
}
function validate(d){const q=requiredQuestions(d);if(q.length)throw new InputError(q);return clone(d);}
function makeGraph(d,kind){
 const def=MECHANISMS[kind],nodes=[],edges=[],add=(id,label,role,state='known')=>nodes.push({id,label,role,state}),link=(from,to,relation,planned=true)=>edges.push({from,to,relation,planned});
 if(kind==='explore'){add('task',d.work.task,'task');add('ai','AI辅助一次','ai','planned');add('check','人工检查结果','check','planned');link('task','ai','准备');link('ai','check','检查');return {kind,nodes,edges};}
 d.sources.forEach((x,i)=>add('s'+i,x,'source'));add('asset',d.work.asset,'asset');add('ai',def.ai,'ai','planned');d.targets.forEach((x,i)=>add('t'+i,x,'target'));
 if(kind==='knowledge'){d.sources.forEach((_,i)=>link('s'+i,'asset','归集',false));d.targets.forEach((_,i)=>link('asset','t'+i,'共用依据'));link('ai','asset','辅助查找');link('t0','asset','问题回流');}
 if(kind==='process'){const seq=[...d.sources.map((_,i)=>'s'+i),'ai',...d.targets.map((_,i)=>'t'+i)];seq.slice(1).forEach((id,i)=>link(seq[i],id,'交接'));link('asset','ai','按标准检查',false);}
 if(kind==='expert'){d.sources.forEach((_,i)=>link('s'+i,'asset','说清条件',false));link('asset','ai','依据条件');d.targets.forEach((_,i)=>link('ai','t'+i,'准备判断'));}
 if(kind==='project'){d.sources.forEach((_,i)=>link('s'+i,'asset','提取模块',false));d.targets.forEach((_,i)=>link('asset','t'+i,'候选复用'));link('s0','ai','旧边界');link('ai','t0','核对本次差异');}
 if(kind==='matching'){add('confirm','双方人工确认','confirm','planned');d.sources.forEach((_,i)=>link('s'+i,'asset','提出条件',false));link('asset','ai','按条件比较');d.targets.forEach((_,i)=>link('t'+i,'ai','可用供给',false));link('ai','confirm','提交候选');}
 if(kind==='network'){add('handoff','共同交接记录','handoff','planned');d.sources.forEach((_,i)=>link('s'+i,'handoff','提供与确认'));d.targets.forEach((_,i)=>link('handoff','t'+i,'按要求接手'));link('asset','handoff','共同要求',false);link('ai','handoff','提醒缺项');}
 return {kind,nodes,edges};
}
function diagnose(raw){
 const d=clone(raw),required=requiredQuestions(d),kind=d.facts.experience==='none'?'explore':MECHANISMS[d.mechanism]?d.mechanism:'explore',def=MECHANISMS[kind],id=MODELS[d.model]?d.model:'explore',curve={id,...clone(MODELS[id])},tentative=d.facts.experience==='one_case'||kind==='project'&&d.facts.reuse==='candidate';
 const graph=makeGraph(d,kind),action=def.action,asset=d.work.asset||'本次经验';
 let details=id==='fast'?['让AI先'+action+'，保留人工复核','按同一合格标准记录准备、复核和返工','把特殊情况写回“'+asset+'”的适用说明']:id==='delayed'?['围绕“'+asset+'”'+def.steps[0],'让AI'+action+'，由人检查一次真实结果',def.steps[2]+'，比较再次使用时的总工时']:id==='gradual'?['收集当前AI结果中的实际错误','修订“'+asset+'”的说明、条件与例子','用同类任务检查错误是否再次出现']:id==='staged'?['检查“'+asset+'”样板的适用条件与验收记录','换一个实际场景，让AI'+action,'由负责人验收；通过后再多推广一个场景']:MECHANISMS.explore.steps;
 if(id==='delayed'&&d.facts.review==='none')details[0]+='；先明确复核人和检查办法';
 const milestones=curve.phases.map((title,i)=>({title,detail:details[i]}));
 const classification=def.name+(tentative?' · 待验证':''),explanation=kind==='explore'?'先在“'+d.work.task+'”中留下一次可检查的结果，再判断哪些经验值得反复使用。':'本次积累是“'+asset+'”。'+def.effect+'；AI可'+action+'，人工决定是否采用。';
 const basis=[{name:'这份判断的依据',detail:'本次工作：'+d.work.task+'\n类型：'+classification+'\n实际事例：'+(d.work.evidence||'尚无实际经验')+'\n观察模型：'+curve.name+'\n固定指标：'+curve.metric+'\n原始目标：'+(d.goal||'本次按上方固定指标观察')+'\n复核：'+(d.reviewer||'尚未安排，试用前需明确')+'\n'+curve.check+'\n'+curve.condition},...graph.nodes.map(n=>({name:n.label,detail:(n.state==='planned'?'这是建议的AI参与或人工确认环节，尚不表示已经实现。':'这是资料中描述的积累、步骤或参与者。')+'\n'+d.work.evidence+'\n'+(n.role==='ai'?action+'；人工决定最终采用。':n.role==='asset'?def.steps[0]:n.role==='target'?def.effect:curve.check)}))];
 return {data:d,kind,graph,nodes:graph.nodes,classification,headline:def.title,explanation,tentative,milestones,curve,basis,required,complete:!required.length};
}
function curveLevel(curve,t){t=Math.max(0,Math.min(1,t));const id=typeof curve==='string'?curve:curve.id;if(id==='explore')return .5;if(id==='delayed'){if(t<=.22)return .62+.22*Math.sin(t/.22*Math.PI/2);const z=(t-.22)/.78;return .84-.62*z*z*(3-2*z);}if(id==='fast')return 1-.72*(1-Math.pow(1-t,3.5));if(id==='staged'){let y=.12;for(const start of [.12,.43,.73]){const z=Math.max(0,Math.min(1,(t-start)/.10));y+=.24*z*z*(3-2*z);}return y;}return 1-.72*t;}
const api={VERSION:'4.0',OPTIONS,FACT_LABELS,MECHANISMS,MECHANISM_OPTIONS,MODELS,MODEL_OPTIONS,InputError,blank,clone,normalize,parse,validate,requiredQuestions,relevantFacts,diagnose,makeGraph,curveLevel};if(typeof module!=='undefined'&&module.exports)module.exports=api;else host.GAIDNModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);
