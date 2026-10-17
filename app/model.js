(function(host){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
class InputError extends Error{constructor(issues){super(issues.map(x=>x.message).join('；'));this.issues=issues;}}
const MECHANISMS={
 knowledge:{name:'知识资产优势',shape:'聚合星核',meaning:'经营价值来自可共用的产品、客户或行业知识；AI优先把这些积累组织成共同依据。'},
 process:{name:'流程运营优势',shape:'连续环流',meaning:'经营价值来自稳定做法与交付标准；AI优先让标准和反馈贯通经营环节。'},
 expert:{name:'专家经验优势',shape:'经验辐射',meaning:'经营价值来自少数人的专业判断；AI优先帮助经验留下依据，让团队有条件调用。'},
 project:{name:'项目资产优势',shape:'项目星团',meaning:'经营价值来自已交付的成果、模块或方法；AI优先帮助识别适用边界并复用积累。'},
 matching:{name:'资源连接优势',shape:'双核引力',meaning:'经营价值来自两端资源与适配判断；AI优先帮助整理条件和反馈，提高连接质量。'},
 network:{name:'协作网络优势',shape:'多中心星网',meaning:'经营价值来自品牌、伙伴和终端之间的协作；AI优先帮助各方共用方法与经营反馈。'}
};
const MECHANISM_OPTIONS={unknown:'待确认 · 选择最值得先拥抱 AI 的优势',...Object.fromEntries(Object.entries(MECHANISMS).map(([k,v])=>[k,v.name]))};
const READINESS={
 unknown:{name:'待确认 · 选择最符合实际的一项'},
 usable:{name:'现有资料与方法可用，仍有重复准备',model:'fast',condition:'已有可核实、能使用的积累和适用边界；重复准备占用团队精力，尚未充分组织为AI应用。'},
 learning:{name:'已有 AI 使用与反馈，持续校准经营做法',model:'steady',condition:'AI已用于实际业务，存在人工检查、真实反馈和修订；改进需要持续积累。'},
 building:{name:'核心积累尚待整理，先建设可复用能力',model:'delayed',condition:'已有真实经验或成果，但资料分散、经验隐性或方法未整理；先组织积累，再检验复用。'},
 connecting:{name:'已有可检查的好做法，需多方逐段连通',model:'network',condition:'至少一处做法有实际记录、检查和反馈；经营依赖多个环节或参与方，新连接仍要逐段验证。'}
};
const READINESS_OPTIONS=Object.fromEntries(Object.entries(READINESS).map(([k,v])=>[k,v.name]));
const phases=['开始应用','形成稳定能力','扩大经营应用'];
const MODELS={
 fast:{name:'快速释放型',tag:'先提升，再趋稳',subtitle:'减少重复消耗，让同样团队接住更多业务。',explain:'现有积累已可使用，先减少重复消耗；\n后续提升取决于业务边界与应用深度。'},
 steady:{name:'稳步增益型',tag:'小改进，持续积累',subtitle:'持续改进，让同样团队逐步接住更多业务。',explain:'改进随着应用、反馈和修订逐步积累；\n同等团队承担业务的能力有机会持续提升。'},
 delayed:{name:'蓄势跃迁型',tag:'先建设，后释放',subtitle:'先把能力建起来，再打开经营空间。',explain:'前期先组织经验、资料和方法；\n形成可复用能力后，经营价值才可能加快释放。'},
 network:{name:'协同放大型',tag:'连通一处，放大一段',subtitle:'把关键经营环节接起来，逐步承担更多业务。',explain:'相关环节需要逐段连通并稳定协作；\n每段条件成立后，整体承接能力才有机会提高。'}
};
for(const m of Object.values(MODELS))Object.assign(m,{metric:'同等团队与时间下，可稳定承担的业务量',phases:clone(phases)});
// Chinese-width units bound copy to the approved poster. Never silently truncate.
const units=s=>[...String(s)].reduce((n,c)=>n+(c.charCodeAt(0)<128?.55:1),0);
const LIMITS={'company.name':18,'company.business':20,'company.customers':14,'company.income':30,diagnosis:62,priority:28,first:30};
const LABELS={'company.name':'企业名称','company.business':'主营业务','company.customers':'主要客户','company.income':'收入来源',evidence:'积累的事实依据',rationale:'经营基础的判断依据',diagnosis:'整体诊断',priority:'AI 优先方向',first:'起步例子'};
function blank(){return {schema_version:'5.0',is_example:false,company:{name:'',business:'',customers:'',income:''},mechanism:'unknown',assets:[],evidence:'',readiness:'unknown',rationale:'',headline:[],diagnosis:'',priority:'',first:'',assumptions:[]};}
const DEFAULTS={
 knowledge:{assets:['产品与业务知识','客户问题线索','经营触点'],headline:['把懂业务的本事，','变成企业共用的能力。'],priority:'把业务知识组织成团队可调用的共同依据'},
 process:{assets:['经营做法','交付环节','反馈线索'],headline:['让做事的好方法，','成为企业接住业务的底气。'],priority:'让经营做法与反馈形成可持续改进的依据'},
 expert:{assets:['专业判断线索','业务经验','团队应用'],headline:['让少数人的经验，','有机会成为整家公司的本事。'],priority:'组织专业判断的依据，让团队能够复用'},
 project:{assets:['交付成果线索','业务场景','复用机会'],headline:['让每次交付留下的东西，','继续为下一次生意出力。'],priority:'把项目成果组织成可展示、可匹配的业务资产'},
 matching:{assets:['适配判断线索','需求一端','供给一端'],headline:['连接资源的价值，','在于更懂怎样配得上。'],priority:'把需求、供给与反馈组织成可更新的适配依据'},
 network:{assets:['共同方法线索','协作伙伴','终端反馈'],headline:['让一处的好做法，','成为更多人做成事的条件。'],priority:'让方法、协作和反馈成为多方共用的经营依据'}
};
function normalize(raw){
 const d=blank(),notes=[],assumptions=[];
 const str=(o,k)=>typeof o?.[k]==='string'?o[k].trim():'';
 const co=typeof raw.company==='string'?{name:raw.company,business:raw.business,customers:raw.customers,income:raw.income}:raw.company;
 if(typeof raw.company==='string')notes.push('企业名称已读入，业务资料保留');
 for(const k of Object.keys(d.company))d.company[k]=str(co,k);
 for(const k of ['evidence','rationale','diagnosis','priority','first'])d[k]=str(raw,k);
 d.is_example=raw.is_example===true;if(raw.is_example!==undefined&&typeof raw.is_example!=='boolean'){d.is_example=true;notes.push('示例标识格式不明确，暂按示例展示');}
 const mechAliases=Object.fromEntries(Object.entries(MECHANISMS).flatMap(([k,v])=>[[k,k],[v.name,k]]));
 Object.assign(mechAliases,{'知识资产':'knowledge','流程运营':'process','专家经验':'expert','项目资产':'project','资源连接':'matching','协作网络':'network'});
 const pathAliases={usable:'usable',learning:'learning',building:'building',connecting:'connecting',fast:'usable',steady:'learning',delayed:'building',network:'connecting','快速释放型':'usable','稳步增益型':'learning','蓄势跃迁型':'building','协同放大型':'connecting'};
 const mk=str(raw,'mechanism'),rk=str(raw,'readiness')||str(raw,'model');d.mechanism=mechAliases[mk]||mechAliases[mk.toLowerCase()]||'unknown';d.readiness=pathAliases[rk]||'unknown';
 if(mk&&mk!=='unknown'&&d.mechanism!==mk)notes.push('优势名称已转换为页面识别格式');
 if(rk&&rk!=='unknown'&&d.readiness!==rk)notes.push('经营情景名称已转换为页面识别格式');
 const list=v=>Array.isArray(v)?v.filter(x=>typeof x==='string').map(x=>x.trim()).filter(Boolean):typeof v==='string'?v.split(/[、,，\r\n]/).map(x=>x.trim()).filter(Boolean):[];
 d.assets=list(raw.assets);if(d.assets.length>3){d.assets=d.assets.slice(0,3);notes.push('主图采用前三项线索，完整列表保留在原输入中');}d.headline=Array.isArray(raw.headline)?raw.headline.filter(x=>typeof x==='string'&&x.trim()).map(x=>x.trim()):typeof raw.headline==='string'?raw.headline.split(/[\r\n|｜]/).map(x=>x.trim()).filter(Boolean):[];
 d.assumptions=list(raw.assumptions);const add=x=>assumptions.push(x);
 // Optional business facts remain unknown. Suggested copy is not evidence of assets.
 if(!d.company.name)d.company.name='我的企业';
 const def=DEFAULTS[d.mechanism];
 if(def&&d.company.business){
  if(d.assets.length<3){const used=[...d.assets];d.assets=[...used,...def.assets.filter(v=>!used.includes(v))].slice(0,3);add('部分优势线索由页面按类型补作建议，尚未确认企业已拥有。');}
  if(!d.headline.length){d.headline=clone(def.headline);add('标题由页面补作方向性建议。');}
  if(!d.priority){d.priority=def.priority;add('AI方向按所选优势提出，实际条件仍待核实。');}
  if(!d.diagnosis){d.diagnosis='可从'+MECHANISMS[d.mechanism].name+'寻找机会，优先让业务积累成为团队共用的依据。具体优势与适用条件仍待确认。';add('诊断为初步机会判断，不能当作已经验证的企业优势。');}
  if(d.readiness==='unknown'){d.readiness='building';d.rationale=d.rationale||'经营基础尚未说明，先以“组织积累、验证复用”的情景探索，不代表已具备条件。';add('经营基础未说明，暂以先建设、后释放的条件情景探索；不是对当前成熟度的认定。');}
  if(!d.evidence){d.evidence='用户业务描述：'+d.company.business+'。其余优势及路径为建议，尚未逐项核实。';add('目前仅有业务描述，优势线索需要进一步确认。');}
  if(!d.rationale){d.rationale='根据业务描述暂作'+MODELS[READINESS[d.readiness].model].name+'情景建议，适用条件需核实。';add('经营情景由描述初步推断，尚未核实适用条件。');}
 }
 d.assumptions=[...new Set([...d.assumptions,...(assumptions.length?['页面补全的候选线索、文案或路径属于建议，尚未认定为企业已具备的优势。']:[]),...assumptions.filter(v=>v.startsWith('经营基础未说明'))])];
 for(const k of ['previous_parameters','original_parameters'])if(raw[k]&&typeof raw[k]==='object')d[k]=clone(raw[k]);
 const known=new Set([...Object.keys(d),'import_notes','model']);const extra=Object.keys(raw).filter(k=>!known.has(k));if(extra.length)notes.push('其他资料保存在原输入中，不改变固定曲线');
 const preserve=notes.length>0||assumptions.length>0;if(Array.isArray(raw.import_notes))notes.unshift(...raw.import_notes.filter(v=>typeof v==='string'));
 if(notes.length)d.import_notes=[...new Set(notes)];if(preserve&&!d.original_parameters)d.original_parameters=clone(raw);
 return d;
}
function migrate(raw){
 const d=blank(),s=v=>typeof v==='string'?v:'';
 d.is_example=raw.is_example===true;d.company.name=s(raw.company?.name||raw.subject?.name||raw.name);d.company.business=s(raw.company?.business||raw.subject?.business||raw.business);
 d.first=s(raw.work?.task||raw.focus?.task);d.evidence=s(raw.work?.evidence||raw.focus?.experience?.evidence);
 d.previous_parameters=clone(raw);d.import_notes=['旧参数完整保留。新版诊断企业整体，原单项任务仅作起步线索；请补充客户、收入、企业积累与经营基础。旧曲线不自动转换。'];return d;
}
function extractObject(text){
 // Find a single balanced JSON object without interpreting prose or executing code.
 const candidates=[];let start=-1,depth=0,string=false,escape=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(start<0){if(c==='{'){start=i;depth=1;}continue;}if(string){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')string=false;continue;}if(c==='"')string=true;else if(c==='{')depth++;else if(c==='}'&&--depth===0){candidates.push(text.slice(start,i+1));start=-1;}}
 if(candidates.length!==1)throw new Error('需要单份JSON');return candidates[0];
}
function parse(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>320000)throw new InputError([{path:'input',message:'参数文本请控制在320 KB内'}]);
 const blocks=[...text.matchAll(/```(?:json)?\s*\n?([\s\S]*?)```/g)];if(blocks.length>1)throw new InputError([{path:'input',message:'请一次导入一份参数，当前有多个代码框'}]);
 let raw;const body=(blocks.length?blocks[0][1]:text).trim();try{try{raw=JSON.parse(body);}catch{raw=JSON.parse(extractObject(body));}}catch{throw new InputError([{path:'input',message:'没有读到完整参数。点“复制修正要求”让 AI 重排即可，已有草稿仍保留'}]);}
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new InputError([{path:'input',message:'请导入一份JSON参数对象'}]);
 if(raw.version?.startsWith?.('GAIDN-')&&raw.enterprise){
  const d=blank();d.company.name=typeof raw.enterprise.name==='string'?raw.enterprise.name:'';d.company.business=typeof raw.enterprise.business==='string'?raw.enterprise.business:'';d.first=raw.focus_work?.work_name||'';d.evidence=raw.focus_work?.real_example||'';d.previous_parameters=clone(raw);d.import_notes=['这份来自旧版单项工作模板。业务与原输入已保留，请点“复制升级提示词”，让 AI 回到整家企业重新提出优势与机会；不会把获客不顺的经历自动视为专家优势。'];return d;
 }
 if(['1.0','2.0','3.0','3.1','4.0'].includes(raw.schema_version))return migrate(raw);
 if(!['5.0','5.1',undefined].includes(raw.schema_version))throw new InputError([{path:'schema_version',message:'请使用本页新版提示词；旧版参数也可导入保留'}]);
 if(!raw.company)throw new InputError([{path:'company',message:'参数中还没有业务资料，请点“复制修正要求”交给 AI 整理'}]);
 return normalize(raw);
}
function requiredQuestions(raw){
 const d=normalize(raw),q=[];
 if(!d.company.business.trim())q.push({path:'company.business',message:'说一句你们做什么生意即可'});
 if(!MECHANISMS[d.mechanism])q.push({path:'mechanism',message:'AI还未给出企业优势类型，可点“复制升级提示词”重做，或在下方补选'});
 for(const [k,v] of Object.entries(d.company))if(v.length>2400)q.push({path:'company.'+k,message:'这段资料超过2400字，请保留业务摘要'});
 for(const k of ['evidence','rationale','diagnosis','priority','first'])if(d[k].length>6000)q.push({path:k,message:'内容过长，请让 AI 保留6000字以内摘要'});
 return q;
}
function validate(d){const issues=requiredQuestions(d);if(issues.length)throw new InputError(issues);return normalize(d);}
function diagnose(raw){
 const d=normalize(raw),required=requiredQuestions(d),kind=d.mechanism,def=MECHANISMS[kind],id=READINESS[d.readiness]?.model;
 if(!def||!id)throw new InputError(required);
 const curve={id,...clone(MODELS[id])},nodes=d.assets.map((label,i)=>({id:'asset'+i,label,primary:i===0}));
 const basis=[{name:'这份判断的依据',detail:'企业：'+d.company.name+'\n主营：'+d.company.business+'\n客户：'+(d.company.customers||'未提供，不影响初步探索')+'\n收入：'+(d.company.income||'未提供，不影响初步探索')+'\n\n用户资料与判断依据：\n'+d.evidence+(d.assumptions.length?'\n\nAI联想及待确认：\n'+d.assumptions.join('\n'):'')+'\n\n优先优势：'+def.name+'\n'+def.meaning+'\n\n经营基础：'+READINESS[d.readiness].name+'\n适用条件：'+READINESS[d.readiness].condition+'\n选择依据：'+d.rationale+'\n\n情景：'+curve.name+'。统一比较同等团队与时间下可稳定承担的业务量，不预测营收、日期或增长率。'},...nodes.map((n,i)=>({name:n.label,detail:(i===0?'这是本次最值得先与 AI 结合的企业积累。':'这是支持优先方向的企业积累。')+'\n'+d.evidence+'\n\n建议方向：'+d.priority+'\n图形显示积累的组织方式，亮度、大小和连线不表示测量分数或已实现效果。'}))];
 return {data:d,kind,nodes,classification:def.name,headline:d.headline,curve,basis,required,complete:!required.length};
}
function curveLevel(curve,t){t=Math.max(0,Math.min(1,t));const id=typeof curve==='string'?curve:curve.id;if(id==='fast')return .74*(1-(1-t)**4);if(id==='steady')return .74*t;if(id==='delayed'){const z=Math.max(0,Math.min(1,(t-.32)/.68));return .74*z*z*(3-2*z);}if(id==='network')return [.12,.43,.73].reduce((n,start)=>{const z=Math.max(0,Math.min(1,(t-start)/.12));return n+.74/3*z*z*(3-2*z);},0);throw new Error('未确认经营情景');}
const api={VERSION:'5.1',clone,InputError,MECHANISMS,MECHANISM_OPTIONS,READINESS,READINESS_OPTIONS,MODELS,LIMITS,units,blank,normalize,parse,requiredQuestions,validate,diagnose,curveLevel};if(typeof module!=='undefined'&&module.exports)module.exports=api;else host.GAIDNModel=api;
})(globalThis);
