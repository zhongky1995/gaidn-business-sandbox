(function(host){
'use strict';
const V2=typeof module!=='undefined'&&module.exports?require('./v2-model.js'):host.GAIDNV2;
const clone=V2.clone,InputError=V2.InputError,f=(value='unknown',evidence='')=>({value,evidence});
const MECHANISMS={
 knowledge:{name:'产品知识共用',shape:'共用源与回流',title:'让产品的好解释，跟着每一次服务到场。',solo:'把产品的门道，用在每一次服务里。',ai:'查找适用说明',prepare:'整理适用说明与不适用情形',trial:'按实际问题查找说明',check:'核对口径并留下反馈',effect:'让不同服务环节共用适用的信息'},
 process:{name:'流程衔接',shape:'任务接力链',title:'让好做法，接得住、传得下去。',solo:'让好做法，接上下一步工作。',ai:'检查交接缺项',prepare:'写清交接条件与异常去向',trial:'用一次任务检查交接',check:'核对接手与完成记录',effect:'让前后环节在清楚的条件下接起来'},
 expert:{name:'专家经验传承',shape:'经验扩散',title:'让一个人的门道，成为更多人的本事。',solo:'让自己的门道，用在下一次关键判断。',ai:'整理判断依据',prepare:'说清取舍条件与例外',trial:'按条件准备一次判断',check:'由有经验的人核对差异',effect:'让有经验的人怎样取舍，有机会被其他使用者参考'},
 project:{name:'项目经验复用',shape:'项目与模块连接',title:'让做过的项目，继续为新项目出力。',solo:'让做过的项目，继续为新项目出力。',ai:'查找适用经验',prepare:'整理模块的适用边界',trial:'按新需求查找候选经验',check:'核对本次差异与验收结果',effect:'把过往项目里适用的内容带进新项目'},
 matching:{name:'供需匹配',shape:'双侧条件连接',title:'把懂供需的本事，用在每一次连接上。',solo:'把懂供需的本事，用在每一次连接上。',ai:'比较匹配条件',prepare:'列清双方条件与排除项',trial:'筛选一组可核对的候选',check:'由双方确认并记录原因',effect:'把双方条件与筛选依据放在一起比较'},
 network:{name:'多方协作',shape:'共同任务网络',title:'让每一次合作，为下一次协作留下办法。',solo:'让每一次合作，为下一次协作留下办法。',ai:'准备协作衔接',prepare:'写清角色、输入与接手条件',trial:'围绕一个共同任务衔接',check:'核对分工并留下合作反馈',effect:'让参与者围绕实际任务衔接，并留下合作依据'}
};
const OPTIONS={...V2.OPTIONS,intent:{...Object.fromEntries(Object.entries(MECHANISMS).map(([k,v])=>[k,v.name])),explore:'先验证一个新起点',unknown:'尚未确认本次重点'},reuse:{verified:'有跨项目实际复用事例',candidate:'有可复用线索，尚未验证',none:'明确暂无可复用内容',unknown:'尚未确认'},pilot:{ready:'已有可检查的试用样板',none:'尚无可检查的试用样板',unknown:'尚未确认'}};
const OUTCOME_DIRECTIONS={increase:'增加更好',decrease:'减少更好',unknown:'尚未确认'};
const BASELINES={measured:'已有同口径记录',described:'能描述当前做法，尚未统一测量',unmeasured:'明确尚未测量',unknown:'尚未确认'};
const blankOutcome=()=>({metric:'',direction:'unknown',baseline:f(),hypothesis:'',check:''});
const FACT_LABELS={...V2.FACT_LABELS,intent:'这次希望放大的方式',reuse:'跨项目复用依据',pilot:'实际试用样板'};
function blank(){const d=V2.blank();d.schema_version='3.1';d.outcome=blankOutcome();d.opportunity={intent:f(),sources:[],targets:[],reuse:f(),pilot:f()};return d;}
function asV2(d){const a=clone(d);a.schema_version='2.0';delete a.opportunity;delete a.outcome;delete a.previous_parameters;return a;}
function validate(d){
 if(!d||typeof d!=='object'||Array.isArray(d))throw new InputError([{path:'input',message:'请导入完整参数对象'}]);
 if(d.schema_version!=='3.1')throw new InputError([{path:'schema_version',message:'请使用本页新版提示词返回schema 3.1参数'}]);
 V2.validate(asV2(d));const issues=[],bad=(path,message)=>issues.push({path,message}),o=d.opportunity;
 if(!o||typeof o!=='object'||Array.isArray(o))bad('opportunity','缺少本次优势放大方式，请使用新版提示词补问');
 else{
  const keys=['intent','sources','targets','reuse','pilot'];for(const k of Object.keys(o))if(!keys.includes(k))bad('opportunity.'+k,'不支持的机会字段：'+k);
  for(const k of ['intent','reuse','pilot']){const x=o[k];if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).some(k=>!['value','evidence'].includes(k))||typeof x.value!=='string'||!Object.hasOwn(OPTIONS[k],x.value)||typeof x.evidence!=='string'||Array.from(x.evidence).length>240)bad('opportunity.'+k,'请按提示词填写'+FACT_LABELS[k]+'和一句事实依据');}
  for(const k of ['sources','targets'])if(!Array.isArray(o[k])||o[k].length>3||o[k].some(s=>typeof s!=='string'||Array.from(s.trim()).length<1||Array.from(s).length>12)||new Set(o[k]).size!==o[k].length)bad('opportunity.'+k,'请使用0—3个不同的短名称，每个不超过12字');
 }
 const outcome=d.outcome;
 if(!outcome||typeof outcome!=='object'||Array.isArray(outcome))bad('outcome','缺少业务改善目标，请用新版提示词补充');
 else{
  const keys=['metric','direction','baseline','hypothesis','check'];for(const k of Object.keys(outcome))if(!keys.includes(k))bad('outcome.'+k,'不支持的业务结果字段：'+k);
  for(const [k,max] of [['metric',36],['hypothesis',180],['check',180]])if(typeof outcome[k]!=='string'||Array.from(outcome[k]).length>max)bad('outcome.'+k,'请按提示词填写业务指标及检查方法，注意字数上限');
  if(!Object.hasOwn(OUTCOME_DIRECTIONS,outcome.direction))bad('outcome.direction','请确认指标增加还是减少更好');
  const x=outcome.baseline;if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).some(k=>!['value','evidence'].includes(k))||!Object.hasOwn(BASELINES,x.value)||typeof x.evidence!=='string'||Array.from(x.evidence).length>240)bad('outcome.baseline','请如实填写当前做法或尚未测量及依据');
 }
 if(d.previous_parameters){try{const p=d.previous_parameters;if(p.schema_version==='3.0'){if(Object.hasOwn(p,'outcome'))throw Error();if(p.previous_parameters&&!['1.0','2.0'].includes(p.previous_parameters.schema_version))throw Error();validate({...clone(p),schema_version:'3.1',outcome:blankOutcome()});}else if(p.schema_version==='2.0')V2.validate(p);else if(p.schema_version==='1.0')V2.parse(JSON.stringify(p));else throw Error();}catch{bad('previous_parameters','保留的旧版参数不完整，请重新导入原文件');}}
 if(issues.length)throw new InputError(issues);return clone(d);
}
function migrateLegacy(raw){
 if(raw.schema_version==='3.0'&&Object.hasOwn(raw,'outcome'))throw new InputError([{path:'outcome',message:'旧3.0参数包含不支持的新字段，请按新版提示词核对版本'}]);
 const old=raw.schema_version==='3.0'?validate({...clone(raw),schema_version:'3.1',outcome:blankOutcome()}):raw.schema_version==='1.0'?V2.migrateLegacy(raw):V2.validate(raw),d=clone(old);
 d.schema_version='3.1';d.outcome=blankOutcome();if(raw.schema_version!=='3.0')d.opportunity=blank().opportunity;d.previous_parameters=clone(raw);return validate(d);
}
function parse(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>160000)throw new InputError([{path:'input',message:'请导入不超过160 KB的参数文件'}]);
 let s=text.trim().replace(/^\uFEFF/,'');const blocks=Array.from(s.matchAll(/```(?:json)?\s*\n([\s\S]*?)```/gi));if(blocks.length>1)throw new InputError([{path:'input',message:'请只复制最后的一份JSON参数'}]);if(blocks.length===1)s=blocks[0][1];let d;try{d=JSON.parse(s);}catch{throw new InputError([{path:'input',message:'没有读到完整参数，请复制整段JSON或导入参数文件'}]);}return ['1.0','2.0','3.0'].includes(d?.schema_version)?migrateLegacy(d):validate(d);
}
function requiredQuestions(d){
 const q=V2.requiredQuestions(asV2(d)),add=(path,message)=>{if(!q.some(x=>x.path===path))q.push({path,message});},o=d.opportunity;
 const u=d.outcome;
 if(u.metric.trim().length<4||['效率','质量','工作能力','可用范围','相对能力','相对能力／可用范围','业务改善','经营能力','产出'].includes(u.metric.trim()))add('outcome.metric','这次具体看什么结果？请选一个能比较的指标，如每份合格方案的准备工时，不只写效率或能力。');
 if(u.direction==='unknown')add('outcome.direction','这个指标是增加更好，还是减少更好？');
 if(u.baseline.value==='unknown'||u.baseline.evidence.trim().length<4)add('outcome.baseline','现在是怎样做的、是否已有记录？明确尚未测量也可以，不需要编数字。');
 if(u.hypothesis.trim().length<8)add('outcome.hypothesis','请说明AI具体做哪一步，以及为什么可能改变这个业务指标；这是待验证的改善设想。');
 if(u.check.trim().length<8)add('outcome.check','怎样比较试用前后？请写明同类任务、相同合格标准与统计办法，并算上人工复核和返工。');
 if(o.intent.value==='unknown')add('opportunity.intent','这次最想让哪项积累用到哪里？请确认一个主要方向，暂无事例可以选探索。');
 if(o.intent.value!=='unknown'&&o.intent.evidence.trim().length<8)add('opportunity.intent','请用一句话说明本次想改变哪段工作，以及已有的具体依据。');
 const experienced=['repeated','one_case'].includes(d.focus.experience.value),normal=experienced&&Object.hasOwn(MECHANISMS,o.intent.value);
 if(normal){if(!o.sources.length)add('opportunity.sources','请确认这项积累目前来自哪里：岗位、资料、步骤、项目或参与者。');if(!o.targets.length)add('opportunity.targets','请确认本次希望支持的实际角色、步骤、项目或参与者。');}
 if(o.intent.value==='project'&&o.reuse.value==='unknown')add('opportunity.reuse','请确认是否真的跨项目复用过，还是目前只有可复用线索；明确暂无也可以。');
 for(const key of ['frequency','rollout'])if(d.readiness[key].value==='unknown')add('readiness.'+key,key==='frequency'?'同类工作反复发生，还是目前偶尔发生？':'本次先试一项工作，还是已明确分环节推广？');
 if(d.readiness.rollout.value==='phased'&&o.pilot.value==='unknown')add('opportunity.pilot','分段推广前是否已有可检查的试用样板？尚无也可以明确说明。');
 for(const key of ['reuse','pilot'])if(o[key].value!=='unknown'&&o[key].evidence.trim().length<2)add('opportunity.'+key,'请为'+FACT_LABELS[key]+'保留一句事实依据。');
 if(o.reuse.value==='verified'&&d.focus.experience.value==='none')add('opportunity.reuse','跨项目已复用与暂无实际积累的陈述有冲突，请先核对。');
 if(o.pilot.value==='ready'&&(d.focus.experience.value==='none'||d.readiness.review.value==='none'))add('opportunity.pilot','可检查样板与暂无实际经验或未确定检查方法有冲突，请先核对。');
 return q;
}
function makeGraph(d,kind,base){
 const nodes=[],edges=[],o=d.opportunity,add=(label,role,state='current')=>{nodes.push({label,role,state});return nodes.length-1;},link=(a,b,planned=true)=>edges.push({from:a,to:b,planned});
 const sources=o.sources.map(s=>add(s,'source')),targets=o.targets.map(s=>add(s,'target','planned'));
 if(kind==='explore'){return {kind,nodes:[{label:'一次真实工作',role:'source',state:'current'},{label:'AI整理与检查',role:'ai',state:'planned'},{label:'可核对的结果',role:'target',state:'planned'}],edges:[{from:0,to:1,planned:true},{from:1,to:2,planned:true}]};}
 const core=add(d.focus.asset,'asset'),ai=add(MECHANISMS[kind].ai,'ai',base.ruleComplete&&d.practice.ai_use.value==='auto_traced'?'current':'planned');
 if(kind==='process'){const ordered=[...sources,ai,...targets];for(let i=1;i<ordered.length;i++)link(ordered[i-1],ordered[i],i>=sources.length);link(core,ai,!(base.ruleComplete&&d.practice.ai_use.value==='auto_traced'));}
 else if(kind==='network'){sources.forEach(n=>link(n,core,false));targets.forEach(n=>link(core,n));link(core,ai,ai!==core&&nodes[ai].state==='planned');targets.forEach(n=>link(n,ai));}
 else{sources.forEach(n=>link(n,core,false));link(core,ai,nodes[ai].state==='planned');targets.forEach(n=>link(ai,n));if(kind==='knowledge'||kind==='project')targets.forEach(n=>link(n,core,true));if(kind==='matching')sources.forEach(n=>targets.forEach(t=>link(n,t,true)));}
 return {kind,nodes,edges};
}
function diagnose(raw){
 const data=validate(raw),d=data,o=d.opportunity,b=V2.diagnose(asV2(d)),has=['one_case','repeated'].includes(d.focus.experience.value),requested=o.intent.value;
 const kind=has&&Object.hasOwn(MECHANISMS,requested)&&!(requested==='project'&&o.reuse.value==='none')?requested:'explore',def=MECHANISMS[kind],tentative=d.focus.experience.value==='one_case'||(kind==='project'&&o.reuse.value!=='verified'),asset=d.focus.asset||'一项真实工作';
 const conditions=[];if(kind!=='explore'&&!b.ruleComplete)conditions.push('把适用条件和例外说清');if(d.readiness.materials.value!=='ready')conditions.push(d.readiness.materials.value==='scattered'?'整理可用资料':'准备一份可核对的材料');if(d.readiness.owner.value!=='assigned')conditions.push('安排维护和复核人');if(d.readiness.review.value!=='clear')conditions.push('确定结果检查办法');if(b.gaps.length)conditions.push('校准判断标准与实际引用');if(tentative)conditions.push('验证同类任务中的适用性');
 const prepared=conditions.length===0;
 let curveId;if(kind==='explore')curveId='explore';else if(!prepared)curveId='delayed';else if(d.readiness.rollout.value==='phased'&&o.pilot.value==='ready')curveId='staged';else if(d.readiness.rollout.value==='single'&&d.readiness.frequency.value==='repeated'&&['none','manual'].includes(d.practice.ai_use.value))curveId='fast';else if(['manual','auto_traced'].includes(d.practice.ai_use.value)||o.pilot.value==='ready')curveId='gradual';else curveId='delayed';
 if(kind!=='explore'&&curveId==='delayed'&&prepared)conditions.push(d.readiness.rollout.value==='phased'?'先取得一个可检查的样板':'先验证一次实际试用');
 let headline=kind==='explore'?'从一次真实工作，找到值得留下的本事。':d.subject.team_mode==='solo'?def.solo:def.title;
 if(tentative&&kind!=='explore')headline={knowledge:'从一次好解释，试出可共用的服务方法。',process:'从一次顺畅交接，留下下一次能用的办法。',expert:'让这次判断，成为下一次可参考的经验。',project:'从这次项目，试出下一次能用的经验。',matching:'从一次合适连接，留下可核对的匹配依据。',network:'从这次合作，留下下一次协作的线索。'}[kind];
 const first=kind==='explore'?'选一次真实工作，记下条件、处理和结果':!b.ruleComplete?def.prepare:b.gaps.length?'核对适用标准与引用版本':def.trial;
 const second=kind==='explore'?'请实际使用者检查结果':!b.ruleComplete||b.gaps.length?def.trial:def.check;
 const third=kind==='explore'?'再判断哪些做法值得复用':curveId==='staged'?'带到一个相邻环节，再检查差异':curveId==='gradual'?'把纠正写回依据，再用一次':def.check===second?'保留修正，供下一次使用':def.check;
 const short={knowledge:['整理适用说明','准备实际答复','核对并补充说明'],process:['写清交接条件','检查一条任务链','核对交接与异常'],expert:['整理取舍条件','准备实际判断','核对条件与例外'],project:['整理模块边界','查找候选经验','核对本次需求差异'],matching:['列清双方条件','比较匹配候选','双方核对候选'],network:['写清接手条件','衔接共同任务','各方核对交接'],explore:['完成一次工作','检查实际结果','确认下一步方向']}[kind];
 let milestones=[{title:kind==='explore'?short[0]:!b.ruleComplete?short[0]:b.gaps.length?'校准使用依据':short[1],detail:first},{title:kind==='explore'?short[1]:!b.ruleComplete||b.gaps.length?short[1]:short[2],detail:second},{title:kind==='explore'?short[2]:curveId==='gradual'?'更新依据再用一次':short[2]===short[1]?'比较后再用一次':'留下修正与比较记录',detail:third}];
 if(curveId==='staged')milestones=[{title:'核对已有样板',detail:'复核当前样板中“'+asset+'”的适用边界与检查结果'},{title:'在相邻环节试用',detail:'让AI在一个新环节中'+def.ai+'，由实际使用者核对差异'},{title:'比较效果再扩大',detail:'按同一业务指标比较，保留采用与纠正记录，再决定是否推广下一段'}];
 const curveDefs={fast:{title:'先在重复任务上见效，再完善特殊情况',basis:'标准、资料和复核已可用，同类工作反复发生，AI可先承担其中的重复准备；特殊情况仍需逐次核对，因此先较快改善、随后趋缓。'},delayed:{title:b.gaps.length?'先校准依据，再检验业务改善':'先把依据理清，再检验业务改善',basis:conditions.join('；')+'。这些准备完成前，不假定业务已经改善；进入真实任务并通过复核后，才可能逐步见效。'},staged:{title:'先验证一个环节，再分段扩大改善',basis:'已有可检查样板，但新环节的条件不同；每段试用通过再推进下一段，因此改善可能分段出现。'},gradual:{title:'每用一次检查一次，让改善逐步累积',basis:'AI已有使用基础，本次主要靠采用、纠正与再次使用积累改善；不把已有工具的首次收益重复计算。'},explore:{title:'先完成一次交付，再判断改善方向',basis:'当前缺少可确认的积累，先取得一次任务结果；水平虚线表示改善尚待验证，不表示已测得没有改善。'}};
 const curve={id:curveId,...curveDefs[curveId],metric:d.outcome.metric,direction:d.outcome.direction,baseline:clone(d.outcome.baseline),hypothesis:d.outcome.hypothesis,check:d.outcome.check,preparation:curveId==='delayed'?.3:0,conditional:true,phases:milestones.map(x=>x.title),condition:kind==='explore'?'后续以实际任务结果为依据，不预设改善幅度。':conditions.length?'成立条件：'+conditions.join('、')+'。':'持续核对资料、适用边界与人工复核；推广还需验证相邻环节。'};
 const graph=makeGraph(d,kind,b),nodes=graph.nodes,classification=kind==='explore'?'先验证一个起点':def.name+(tentative?' · 待验证':''),stageLabel=b.stage===null?'先看一次真实任务':['主要靠老手经验','已有记录，边界待整理','已有明确标准','已经按标准调用','已有负责人的修订循环','有跨场景继承线索'][b.stage];
 const explanation=kind==='explore'?'先完成“'+d.focus.task+'”中的一次实际任务，留下可以检查的结果，再判断哪些经验值得继续使用。':(tentative?'本次先作可验证线索。':'')+'围绕“'+asset+'”，'+def.effect+'。';
 const next=milestones.map((x,i)=>(i+1)+'. '+x.detail).join('；')+'。';
 const basis=[{name:'这份判断的依据',detail:'仅分析本次工作：'+d.focus.task+'\n主方向：'+classification+'\n机会依据：'+o.intent.evidence+'\n实际事例：'+d.focus.experience.evidence+'\n当前起点：'+stageLabel+'\n'+(b.stage===null?'不评成熟度':'参考六级中的L'+b.stage+'，仅本场景的线索')+'\n推进分工：'+b.route.action+'\n维护与复核：'+d.readiness.owner.evidence+'\n怎样检查：'+d.readiness.review.evidence+'\n业务指标：'+curve.metric+'（'+OUTCOME_DIRECTIONS[curve.direction]+'）\n当前依据：'+curve.baseline.evidence+'\n改善设想：'+curve.hypothesis+'\n怎样验证：'+curve.check+'\n曲线匹配：'+curve.basis+'\n'+curve.condition+'\n'+(d.previous_parameters?'保留了原版参数，新字段由本次补充。':'')},...nodes.map(n=>({name:n.label,detail:(n.state==='planned'?'建议建立的支持关系，不表示已经实现。':'已有描述中的积累或参与者。')+'\n'+(n.role==='source'?d.focus.experience.evidence:n.role==='target'?o.intent.evidence:n.role==='asset'?d.focus.experience.evidence:next)+'\n人工负责适用标准、例外和最终采用。'}))];
 const required=requiredQuestions(d);
 return {data,stage:b.stage,stageInfo:b.stageInfo,stageLabel,ruleComplete:b.ruleComplete,gaps:b.gaps,classification,headline,explanation,opportunityReason:o.intent.evidence,kind,graph,nodes,basis,next,milestones,route:b.route,curve,complete:required.length===0,required,migration:Boolean(d.previous_parameters||d.legacy_parameters),scopeNote:b.scopeNote,tentative,commercial:b.commercial};
}
function curveValue(id,t,preparation=0){t=Math.max(0,Math.min(1,t));if(id==='explore')return 0;if(id==='delayed'){const z=Math.max(0,Math.min(1,(t-Math.max(.25,preparation))/(1-Math.max(.25,preparation))));return .72*z*z*(3-2*z);}if(id==='staged'){let y=0;for(const start of [.12,.43,.73]){const z=Math.max(0,Math.min(1,(t-start)/.10));y+=.24*z*z*(3-2*z);}return y;}if(id==='fast')return .72*(1-Math.pow(1-t,3.5));return .72*t;}
function curveLevel(curve,t){if(curve.id==='explore')return .5;const value=curveValue(curve.id,t,curve.preparation);return curve.direction==='decrease'?1-value:value;}
const api={VERSION:'3.1',OUTCOME_DIRECTIONS,BASELINES,curveLevel,OPTIONS,FACT_LABELS,GUIDELINE_LABELS:V2.GUIDELINE_LABELS,STAGES:V2.STAGES,BUSINESS_TYPES:V2.BUSINESS_TYPES,MECHANISMS,InputError,blank,clone,validate,parse,migrateLegacy,requiredQuestions,diagnose,curveValue};if(typeof module!=='undefined'&&module.exports)module.exports=api;else host.GAIDNModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);
