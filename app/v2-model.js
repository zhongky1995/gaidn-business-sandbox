(function(host){
'use strict';
const Legacy=typeof module!=='undefined'&&module.exports?require('./legacy-model.js'):host.GAIDNLegacy;
const clone=x=>JSON.parse(JSON.stringify(x));
const f=(value='unknown',evidence='')=>({value,evidence});
const YES={yes:'已确认',no:'尚不具备',unknown:'尚不清楚'};
const OPTIONS={
 team_mode:{team:'团队经营',solo:'个人经营',unknown:'尚不清楚'},
 size_band:{micro:'50人以下',small:'50–500人参考档',medium:'500–5000人参考档',large:'5000人以上参考档',boundary:'处在相邻规模边界',undisclosed:'不披露人数',unknown:'尚不清楚'},
 coordination:{lead:'一个负责人可直接推进',team:'一个业务团队先做样板',cross:'多个部门共建、需要共用支持',group:'多个业务单元需要统筹',unknown:'尚不清楚'},
 domain:{management:'管理判断',production:'生产研发判断',business:'业务判断',organization:'组织协作判断',unknown:'暂未归类'},
 experience:{repeated:'有反复使用的实际经验',one_case:'目前有一个具体事例',none:'明确暂无可举出的积累',unknown:'尚未确认'},
 evidence_level:{described:'根据本次描述',excerpt:'依据所提供的脱敏片段'},
 record:{none:'主要在人脑中，尚未记录',principles:'有记录，条件与边界未写完整',guideline:'有明确的判断准则',unknown:'尚不清楚'},
 authority:YES,scope:YES,logic:YES,examples:YES,
 ai_use:{none:'这项工作尚未使用AI',manual:'人工把材料交给AI辅助',auto_untraced:'已接工作流，准则依据未能追溯',auto_traced:'已在真实工作流引用准则与版本',unknown:'尚不清楚'},
 feedback:{none:'尚无使用后的修订记录',partial:'有反馈，但未形成完整修订循环',closed:'有抽查、归因、负责人修订并再次使用的记录',unknown:'尚不清楚'},
 inheritance:{single:'仅在当前场景使用',multi:'在多个场景尝试继承',established:'多场景长期维护与继承已形成职责',unknown:'尚不清楚'},
 materials:{ready:'有当前可用、可核对的资料',scattered:'有记录，但比较零散',none:'目前没有可供使用的资料',unknown:'尚不清楚'},
 owner:{assigned:'已安排维护与复核责任人',none:'尚未安排',unknown:'尚不清楚'},
 review:{clear:'有明确的结果检查办法',none:'尚未确定检查办法',unknown:'尚不清楚'},
 frequency:{repeated:'同类工作反复发生',occasional:'目前偶尔发生',unknown:'尚不清楚'},
 rollout:{single:'先验证一项具体任务',phased:'已计划分环节或团队推广',unknown:'尚未确定'}
};
const GUIDELINE_LABELS={authority:'责任、效期与强制/参考属性',scope:'适用与排除情形',logic:'判断条件与例外处理',examples:'正面与反面例子'};
const FACT_LABELS={coordination:'本次怎样推进',experience:'已有经验',record:'经验留在哪里',ai_use:'AI现在怎样参与',feedback:'使用后的反馈与修订',inheritance:'跨场景继承',materials:'可用资料',owner:'维护与复核安排',review:'怎样检查结果',frequency:'发生频率',rollout:'推进计划',...GUIDELINE_LABELS};
const STAGES=[
 {name:'全在脑子里',display:'把拿手经验留下来',next:'形成第一条可核对的判断',output:'一条判断样例'},
 {name:'写了但没人干',display:'把已有记录写成准则',next:'让记录说明什么时候该怎样做',output:'一条完整准则'},
 {name:'写成准则了',display:'让公司标准进入AI工作',next:'在一项真实任务中引用适用准则与版本',output:'一次带依据的试用'},
 {name:'AI能自己调用',display:'让每次使用都留下改进依据',next:'留下采用、纠正与例外记录',output:'一份使用与纠正记录'},
 {name:'准则会自己进化',display:'让好做法持续变厚',next:'检查修订效果，再向相邻场景复用',output:'一份经复核的修订'},
 {name:'写准则成核心工种',display:'让能力继承成为组织日常',next:'检查跨场景的边界、维护成本与实际结果',output:'一份继承与适配记录'}
];
const BUSINESS_TYPES={...Object.fromEntries(Object.entries(Legacy.TYPES).map(([k,v])=>[k,v.name])),unknown:'经营类型暂不细分'};
class InputError extends Error{constructor(issues){super(issues.map(i=>i.message).join('；'));this.name='InputError';this.issues=issues;}}
function blank(){return {schema_version:'2.0',is_example:false,subject:{name:'',business:'',team_mode:'unknown',headcount:'',size_band:'unknown',business_type:'unknown'},organization:{coordination:f()},focus:{task:'',asset:'',domain:'unknown',experience:f(),evidence_level:'described'},memory:{record:f(),guideline:Object.fromEntries(Object.keys(GUIDELINE_LABELS).map(k=>[k,f()]))},practice:{ai_use:f(),feedback:f(),inheritance:f()},readiness:Object.fromEntries(['materials','owner','review','frequency','rollout'].map(k=>[k,f()]))};}
function validate(d){
 const issues=[],bad=(path,message)=>issues.push({path,message});
 const obj=(x,path,keys,optional=[])=>{if(!x||typeof x!=='object'||Array.isArray(x)){bad(path,path+'应是一组信息');return false;}for(const k of keys)if(!Object.hasOwn(x,k))bad(path+'.'+k,'缺少'+path+'.'+k);for(const k of Object.keys(x))if(!keys.includes(k)&&!optional.includes(k))bad(path+'.'+k,'不支持字段'+path+'.'+k);return true;};
 const str=(x,path,max,min=0)=>{if(typeof x!=='string'||Array.from(x.trim()).length<min||Array.from(x).length>max)bad(path,path+'需为'+min+'—'+max+'字的文字');};
 const choice=(x,path,values)=>{if(!Object.hasOwn(values,x)||typeof x!=='string')bad(path,path+'的选项不受支持');};
 const fact=(x,path,key)=>{if(obj(x,path,['value','evidence'])){choice(x.value,path+'.value',OPTIONS[key]);str(x.evidence,path+'.evidence',240);}};
 if(!obj(d,'参数',['schema_version','is_example','subject','organization','focus','memory','practice','readiness'],['legacy_parameters']))throw new InputError(issues);
 if(d.schema_version!=='2.0')bad('schema_version','请使用本页新版提示词整理参数');if(typeof d.is_example!=='boolean')bad('is_example','请说明是否为虚构示例');
 if(obj(d.subject,'subject',['name','business','team_mode','headcount','size_band','business_type'])){str(d.subject.name,'subject.name',40,1);str(d.subject.business,'subject.business',100,2);str(d.subject.headcount,'subject.headcount',40);for(const k of ['team_mode','size_band'])choice(d.subject[k],'subject.'+k,OPTIONS[k]);choice(d.subject.business_type,'subject.business_type',BUSINESS_TYPES);}
 if(obj(d.organization,'organization',['coordination']))fact(d.organization.coordination,'organization.coordination','coordination');
 if(obj(d.focus,'focus',['task','asset','domain','experience','evidence_level'])){str(d.focus.task,'focus.task',100);str(d.focus.asset,'focus.asset',12);choice(d.focus.domain,'focus.domain',OPTIONS.domain);choice(d.focus.evidence_level,'focus.evidence_level',OPTIONS.evidence_level);fact(d.focus.experience,'focus.experience','experience');}
 if(obj(d.memory,'memory',['record','guideline'])){fact(d.memory.record,'memory.record','record');if(obj(d.memory.guideline,'memory.guideline',Object.keys(GUIDELINE_LABELS)))for(const k of Object.keys(GUIDELINE_LABELS))fact(d.memory.guideline[k],'memory.guideline.'+k,k);}
 if(obj(d.practice,'practice',['ai_use','feedback','inheritance']))for(const k of ['ai_use','feedback','inheritance'])fact(d.practice[k],'practice.'+k,k);
 if(obj(d.readiness,'readiness',['materials','owner','review','frequency','rollout']))for(const k of ['materials','owner','review','frequency','rollout'])fact(d.readiness[k],'readiness.'+k,k);
 if(d.legacy_parameters){try{Legacy.validate(d.legacy_parameters);}catch{bad('legacy_parameters','保留的旧参数不完整，请重新导入原文件');}}
 if(issues.length)throw new InputError(issues);return clone(d);
}
function migrateLegacy(raw){
 const old=Legacy.validate(raw),d=blank();d.is_example=old.is_example;d.subject={...d.subject,...old.subject};const ids=Legacy.diagnose(old).ids;d.subject.business_type=ids.length===1?ids[0]:'unknown';
 const a=old.focus_asset===null?null:old.assets[old.focus_asset];d.focus.asset=a?a.label:'';d.focus.experience=f('unknown',a?a.evidence:'');
 for(const key of ['materials','owner'])d.readiness[key]=clone(old.readiness[key]);d.legacy_parameters=old;return validate(d);
}
function parse(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>160000)throw new InputError([{path:'input',message:'请导入不超过160 KB的参数文件'}]);let s=text.trim().replace(/^\uFEFF/,'');const blocks=Array.from(s.matchAll(/```(?:json)?\s*\n([\s\S]*?)```/gi));if(blocks.length>1)throw new InputError([{path:'input',message:'请只复制最终的一份JSON参数'}]);if(blocks.length===1)s=blocks[0][1];let d;try{d=JSON.parse(s);}catch{throw new InputError([{path:'input',message:'没有读到完整参数，请复制整段JSON或导入参数文件'}]);}return d?.schema_version==='1.0'?migrateLegacy(d):validate(d);
}
function requiredQuestions(d){
 const q=[],add=(path,message)=>q.push({path,message});
 if(!d.subject.name.trim())add('subject.name','请填写企业名称或化名。');if(d.subject.business.trim().length<2)add('subject.business','请明确本次主营业务。');
 if(d.focus.task.trim().length<2)add('focus.task','这次先看哪一项真实工作？例如客户变更、报价准备或质量检查。');
 if(d.focus.experience.value==='unknown')add('focus.experience','请给出一项实际判断的例子；确实暂无可列积累，也可以明确说明。');
 else if(['one_case','repeated'].includes(d.focus.experience.value)&&d.focus.experience.evidence.trim().length<8)add('focus.experience','请保留一个真实事例，说明什么情况下采取了什么不同做法。');
 if(d.focus.experience.value!=='none'&&d.focus.asset.trim().length<2)add('focus.asset','请为选定的具体积累取一个短名称，例如“需求变更经验”。');
 const core=[['organization','coordination','请确认本次由一个负责人、一个业务团队，还是多个部门/业务单元共同推进。'],['memory','record','请确认这项经验主要在人脑中、有普通记录，还是已有明确准则。'],['practice','ai_use','请确认这项工作目前是否使用AI，以及怎样使用。'],['readiness','materials','请确认资料是可用、零散，还是目前没有可用资料。'],['readiness','owner','请确认谁维护与复核，尚未安排也可以明确说明。'],['readiness','review','请确认怎样检查结果，尚未确定也可以明确说明。']];
 for(const [group,key,message] of core)if(d[group][key].value==='unknown')add(group+'.'+key,message);
 if(d.memory.record.value==='guideline')for(const k of Object.keys(GUIDELINE_LABELS))if(d.memory.guideline[k].value==='unknown')add('memory.guideline.'+k,'请核对这条准则是否写清“'+GUIDELINE_LABELS[k]+'”，未具备可以选“尚不具备”。');
 if(['none','principles'].includes(d.memory.record.value)&&Object.values(d.memory.guideline).every(f=>f.value==='yes'))add('memory.record','记录状态与准则四要素的确认有矛盾，请核对是否已经形成明确准则。');
 const groups=[['organization',d.organization],['memory',{record:d.memory.record}],['practice',d.practice],['readiness',d.readiness],['memory.guideline',d.memory.guideline],['focus',{experience:d.focus.experience}]];
 for(const [path,group] of groups)for(const [k,v] of Object.entries(group))if(v.value!=='unknown'&&v.evidence.trim().length<2&&!q.some(x=>x.path===path+'.'+k))add(path+'.'+k,'请为“'+FACT_LABELS[k]+'”补充一句事实依据。');
 return q;
}
function diagnose(raw){
 const data=validate(raw),d=data,v=(g,k)=>d[g][k].value;
 const hasExperience=['one_case','repeated'].includes(d.focus.experience.value),ruleKeys=Object.keys(GUIDELINE_LABELS),ruleComplete=d.memory.record.value==='guideline'&&ruleKeys.every(k=>d.memory.guideline[k].value==='yes');
 let stage=null;if(hasExperience&&d.memory.record.value!=='unknown'){stage=d.memory.record.value==='none'?0:ruleComplete?2:1;if(ruleComplete&&v('practice','ai_use')==='auto_traced'){stage=3;if(v('practice','feedback')==='closed'&&v('readiness','owner')==='assigned'){stage=4;if(v('practice','inheritance')==='established')stage=5;}}}
 const gaps=[];if(['auto_traced','auto_untraced'].includes(v('practice','ai_use'))&&!ruleComplete)gaps.push('已在用AI，先补齐公司判断标准');if(v('practice','ai_use')==='auto_untraced')gaps.push('先核对准则的引用与版本');if(v('practice','feedback')==='closed'&&v('readiness','owner')!=='assigned')gaps.push('修订记录已有，当前维护责任还需落实');
 const routeId={lead:'direct',team:'lighthouse',cross:'hub',group:'portfolio',unknown:'explore'}[v('organization','coordination')];
 const routes={direct:{name:d.subject.team_mode==='solo'||d.subject.size_band==='micro'?'老板带头，直接起步':'负责人带头，直接起步',action:'由负责人选一项小任务，明确标准并亲自复核。'},lighthouse:{name:'单点跑通，形成样板',action:'由业务负责人牵头，明确一位AI运营责任人，先跑通一项业务样板。'},hub:{name:'中心支持，业务共建',action:'共用支持维护方法、平台与治理，业务团队负责自己的准则与结果。'},portfolio:{name:'统一底座，多线推进',action:'由高层统筹共用支持，各业务单元分别承担准则维护和实际采用责任。'},explore:{name:'先明确一个推进单元',action:'先明确谁能承担这项工作的结果，再选择推进方式。'}};
 const route={id:routeId,...routes[routeId],context:d.subject.headcount||OPTIONS.size_band[d.subject.size_band],basis:d.organization.coordination.evidence};
 const asset=d.focus.asset||'一项真实工作',explore=stage===null,step=explore?{display:'先验证一个起点',next:'选一项真实任务，留下一个可检查的结果',output:'一个真实判断样例'}:STAGES[stage];
 let headline='从一项真实工作，开始留下公司的方法。';
 if(hasExperience){if(d.focus.experience.value==='one_case')headline='把“'+asset+'”的这次经验，变成可以核对的方法。';else if(stage===null||stage<2)headline='让'+asset+'，成为'+(d.subject.team_mode==='team'?'整个团队':'每一次交付')+'的底气。';else if(stage===2)headline='让'+asset+'，跟着每一次AI工作一起到场。';else if(stage===3)headline='把'+asset+'用起来，也把改进留下来。';else if(stage===4)headline='让'+asset+'，在一次次使用中变得更好。';else headline='让'+asset+'，成为'+(d.subject.team_mode==='team'?'团队持续继承':'能够持续继承')+'的能力。';}
 const recordText=stage===null?'先选一项实际工作':stage===0?'主要依赖老手经验':stage===1?'已有业务记录':stage===2?'准则已经明确':stage===3?'已按准则调用':stage===4?'修订循环已运行':'已有跨场景继承线索';
 let next;
 if(explore)next='从“'+d.focus.task+'”里选一次真实工作，记下当时的条件、处理方式与结果，再核对哪些判断值得留下。';
 else if(stage<2)next='先围绕“'+asset+'”整理一条判断：谁负责、何时适用或不适用、怎样判断及处理例外，再配上正反例；由负责人核对后，供AI辅助使用。';
 else if(stage===2)next='先在“'+d.focus.task+'”中让AI引用适用的准则与版本，说明判断依据，由负责人复核后再采用。';
 else if(stage===3)next='把“'+d.focus.task+'”中的采用、纠正与例外留成记录，定期抽查原因，由负责人决定是否修订准则。';
 else if(stage===4)next='核对“'+asset+'”修订后的使用结果，再向一个相邻场景复用；保留不适用情形和复核人。';
 else next='检查“'+asset+'”在不同场景的适用边界、维护职责和实际结果，让继承持续发生，也保留必要的人工判断。';
 if(gaps.length)next=gaps[0]+'。'+next;
 const insights=['先从一个实际判断里，留下老手使用的条件、取舍和例外。','已有记录是起点。补成具体条件和例外，才更容易被同事和AI继承。','标准已经写清，可以先让AI带着依据提供辅助。','调用已发生，接下来把实际采用、纠正和例外留成反馈。','修订循环已有基础，下一步验证相邻场景的适用性。','已有继承线索，继续核对不同场景的边界、维护成本和实际结果。'];
 const explanation=explore?'先验证一次真实交付，再看哪些判断值得留下。':(d.focus.experience.value==='one_case'?'单次事例先作线索。':'')+insights[stage];
 let curveId=explore?'explore':stage<2?'delayed':v('readiness','rollout')==='phased'?'linear':stage===2&&v('readiness','frequency')==='repeated'?'fast':'linear';
 const conditions=[];if(explore)conditions.push('一个可检查的真实任务');else if(!ruleComplete)conditions.push('补齐判断准则与边界');if(d.focus.experience.value==='one_case')conditions.push('验证同类情境');if(v('readiness','materials')!=='ready')conditions.push(v('readiness','materials')==='scattered'?'整理已有记录':'准备可核对的资料');if(v('readiness','owner')!=='assigned')conditions.push('明确维护与复核人');if(v('readiness','review')!=='clear')conditions.push('明确结果检查办法');if(gaps.length)conditions.push('校准引用与实际使用');if(v('readiness','rollout')==='unknown')conditions.push('选定先验证的一项任务');
 const conditional=conditions.length>0;const preparation=explore ? .42 : conditional ? (stage!==null&&stage<2 ? .32 : .2) : 0;
 const definitions={fast:{title:'先接入，再优化',mechanism:'明确准则进入重复任务',phases:['先接入一项任务','逐步优化']},linear:{title:'逐次验证，让改善累积',mechanism:v('readiness','rollout')==='phased'?'分环节或团队推广':'在使用和反馈中逐次改善',phases:['逐次验证','改善逐步累积']},delayed:{title:'先沉淀，再逐渐释放',mechanism:'先把经验写成准则，再通过复用释放价值',phases:['沉淀与试点','复用逐渐形成']},explore:{title:'先找到起点，再验证价值',mechanism:'先验证一项真实任务',phases:['明确一个任务','验证一个小成果']}};
 const def=definitions[curveId],curve={id:curveId,conditional,preparation,title:gaps.length?'先校准，再稳步推进':def.title,phases:conditional?['准备与验证',def.phases[1]]:def.phases,basis:'匹配依据：'+def.mechanism+'。',condition:conditional?'成立条件：'+Array.from(new Set(conditions)).join('、')+'；虚线为条件落实后的可能走向。':'以资料、准则适用性和人工复核持续可用为前提，沿这条路线验证效果。'};
 const aiAction=explore?'整理任务与实际结果':stage<2?'梳理条件与例外':stage===2?'引用准则与版本':stage===3?'整理反馈与异常':'查找适用准则与修订';
 const nodes=[{label:hasExperience?(d.focus.experience.value==='repeated'?'反复使用的经验':'一个实际事例'):'一个真实任务',action:'已有依据'},{label:aiAction,action:'AI可以参与'},{label:step.output,action:'下一份组织成果'}];
 const basis=[{name:'判断与推进依据',detail:'分析范围：仅本次选定场景。\n'+(stage===null?'探索路线':'场景线索：L'+stage+' · '+STAGES[stage].name)+'\n规模背景：'+route.context+'；'+OPTIONS.size_band[d.subject.size_band]+'\n'+OPTIONS.evidence_level[d.focus.evidence_level]+'。\n经验依据：'+(d.focus.experience.evidence||'尚未提供')+'\n记录状态：'+(d.memory.record.evidence||'尚未提供')+'\nAI参与：'+(d.practice.ai_use.evidence||'尚未提供')+'\n本次推进：'+(route.basis||'尚未确认')+'\n'+(gaps.length?'需要先校准：'+gaps.join('；'):'')},{name:nodes[0].label,detail:d.focus.experience.evidence||'请先选择真实任务，不从行业常识推定企业优势。'},{name:nodes[1].label,detail:next+'\n人工负责标准、例外授权及最终采用；工具使用不等于准则成熟。'},{name:nodes[2].label,detail:route.action+'\n检查办法：'+(d.readiness.review.evidence||'尚未明确')+'\n维护与复核：'+(d.readiness.owner.evidence||'尚未安排')}];
 return {data,stage,stageInfo:explore?null:STAGES[stage],stageLabel:recordText,classification:step.display,headline,explanation,next,route,nodes,basis,gaps,curve,ruleComplete,complete:!requiredQuestions(d).length,required:requiredQuestions(d),migration:Boolean(d.legacy_parameters),commercial:BUSINESS_TYPES[d.subject.business_type],scopeNote:stage===5?'仅有本次描述中的继承线索，不是全公司L5认证。':'仅针对本次工作场景；不代表整家公司评级。'};
}
function curveValue(id,t,preparation=0){return Legacy.curveValue(id,t,preparation);}
const api={VERSION:'2.0',OPTIONS,FACT_LABELS,GUIDELINE_LABELS,STAGES,BUSINESS_TYPES,InputError,blank,clone,validate,parse,migrateLegacy,requiredQuestions,diagnose,curveValue};if(typeof module!=='undefined'&&module.exports)module.exports=api;else host.GAIDNV2=api;
})(typeof globalThis!=='undefined'?globalThis:this);
