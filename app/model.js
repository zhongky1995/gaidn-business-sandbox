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
function blank(){return {schema_version:'5.0',is_example:false,company:{name:'',business:'',customers:'',income:''},mechanism:'unknown',assets:[],evidence:'',readiness:'unknown',rationale:'',headline:[],diagnosis:'',priority:'',first:''};}
function normalize(raw){
 const d=blank(),notes=[];
 const str=(obj,k,path)=>{if(obj?.[k]===undefined)return '';if(typeof obj[k]!=='string'){notes.push(path+'格式需确认');return '';}return obj[k].trim();};
 if(raw.company!==undefined&&(!raw.company||typeof raw.company!=='object'||Array.isArray(raw.company)))notes.push('企业资料格式需确认');
 for(const k of Object.keys(d.company))d.company[k]=str(raw.company,k,'company.'+k);
 for(const k of ['evidence','rationale','diagnosis','priority','first'])d[k]=str(raw,k,k);
 d.is_example=raw.is_example===true;if(raw.is_example!==undefined&&typeof raw.is_example!=='boolean'){d.is_example=true;notes.push('示例标识格式不明确，暂按示例展示');}
 for(const [k,values] of [['mechanism',MECHANISM_OPTIONS],['readiness',READINESS_OPTIONS]]){if(raw[k]!==undefined){if(Object.hasOwn(values,raw[k]))d[k]=raw[k];else notes.push(k+'未识别，请在本页选择');}}
 for(const k of ['assets','headline'])if(raw[k]!==undefined){if(Array.isArray(raw[k])&&raw[k].every(v=>typeof v==='string'))d[k]=raw[k].map(v=>v.trim());else notes.push(k+'需填写文字列表');}
 for(const k of ['previous_parameters','original_parameters'])if(raw[k]&&typeof raw[k]==='object')d[k]=clone(raw[k]);
 const known=new Set([...Object.keys(d),'import_notes']);const extra=Object.keys(raw).filter(k=>!known.has(k));if(extra.length)notes.push('其他字段仅在原参数中保存，不改变固定曲线：'+extra.join('、'));
 const preserve=notes.length>0;if(Array.isArray(raw.import_notes))notes.unshift(...raw.import_notes.filter(v=>typeof v==='string'));
 if(notes.length){d.import_notes=[...new Set(notes)];if(preserve&&!d.original_parameters)d.original_parameters=clone(raw);}
 return d;
}
function migrate(raw){
 const d=blank(),s=v=>typeof v==='string'?v:'';
 d.is_example=raw.is_example===true;d.company.name=s(raw.company?.name||raw.subject?.name||raw.name);d.company.business=s(raw.company?.business||raw.subject?.business||raw.business);
 d.first=s(raw.work?.task||raw.focus?.task);d.evidence=s(raw.work?.evidence||raw.focus?.experience?.evidence);
 d.previous_parameters=clone(raw);d.import_notes=['旧参数完整保留。新版诊断企业整体，原单项任务仅作起步线索；请补充客户、收入、企业积累与经营基础。旧曲线不自动转换。'];return d;
}
function parse(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>320000)throw new InputError([{path:'input',message:'参数文本请控制在320 KB内'}]);
 const blocks=[...text.matchAll(/```(?:json)?\s*\n?([\s\S]*?)```/g)];if(blocks.length>1)throw new InputError([{path:'input',message:'请一次导入一份参数，当前有多个代码框'}]);
 let raw;try{raw=JSON.parse((blocks.length?blocks[0][1]:text).trim());}catch{throw new InputError([{path:'input',message:'JSON格式不完整，原输入仍保留；可修改后重试或直接填写'}]);}
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new InputError([{path:'input',message:'请导入一份JSON参数对象'}]);
 if(['1.0','2.0','3.0','3.1','4.0'].includes(raw.schema_version))return migrate(raw);
 if(raw.schema_version!=='5.0'&&!(raw.schema_version===undefined&&raw.company))throw new InputError([{path:'schema_version',message:'请使用本页提示词返回schema5.0；旧版1.0至4.0可导入补齐'}]);
 return normalize(raw);
}
function requiredQuestions(d){
 const q=[],bad=(path,message)=>q.push({path,message}),get=path=>path.split('.').reduce((o,k)=>o?.[k],d);
 for(const [path,limit] of Object.entries(LIMITS)){const v=get(path)||'';if(units(v)>limit||/[\r\n]/.test(v))bad(path,'请将'+LABELS[path]+'精简为一段、约'+limit+'字以内，原输入仍保留');}
 for(const path of ['company.name','company.business','company.customers','company.income','diagnosis','priority'])if(!get(path)?.trim())bad(path,'请补充'+LABELS[path]);
 if(units(d.company.business+' · '+d.company.customers)>36)bad('company.business','主营业务与客户合计请再精简，便于海报展示');
 for(const k of ['evidence','rationale'])if(d[k].trim().length<8||d[k].length>1200)bad(k,'请用8—1200字说明'+LABELS[k]+'，可如实写待核实部分');
 if(!MECHANISMS[d.mechanism])bad('mechanism','请选择最值得先拥抱 AI 的企业优势');
 if(!READINESS[d.readiness]?.model)bad('readiness','请确认经营基础，页面会自动匹配固定曲线');
 if(d.assets.length!==3||d.assets.some(x=>!x||units(x)>8||/[\r\n]/.test(x)))bad('assets','请给出三项真实积累，每项约8字以内，最值得先用 AI 的放第一项');
 if(d.headline.length!==2||d.headline.some(x=>!x||units(x)>15||/[\r\n]/.test(x)))bad('headline','请写两行结论，每行约15字以内，指出积累怎样成为企业能力');
 return q;
}
function validate(d){const issues=requiredQuestions(d);if(issues.length)throw new InputError(issues);return clone(d);}
function diagnose(raw){
 const d=clone(raw),required=requiredQuestions(d),kind=d.mechanism,def=MECHANISMS[kind],id=READINESS[d.readiness]?.model;
 if(!def||!id)throw new InputError(required);
 const curve={id,...clone(MODELS[id])},nodes=d.assets.map((label,i)=>({id:'asset'+i,label,primary:i===0}));
 const basis=[{name:'这份判断的依据',detail:'企业：'+d.company.name+'\n主营：'+d.company.business+'\n客户：'+d.company.customers+'\n收入：'+d.company.income+'\n\n企业积累：\n'+d.evidence+'\n\n优先优势：'+def.name+'\n'+def.meaning+'\n\n经营基础：'+READINESS[d.readiness].name+'\n适用条件：'+READINESS[d.readiness].condition+'\n选择依据：'+d.rationale+'\n\n情景：'+curve.name+'。统一比较同等团队与时间下可稳定承担的业务量，不预测营收、日期或增长率。'},...nodes.map((n,i)=>({name:n.label,detail:(i===0?'这是本次最值得先与 AI 结合的企业积累。':'这是支持优先方向的企业积累。')+'\n'+d.evidence+'\n\n建议方向：'+d.priority+'\n图形显示积累的组织方式，亮度、大小和连线不表示测量分数或已实现效果。'}))];
 return {data:d,kind,nodes,classification:def.name,headline:d.headline,curve,basis,required,complete:!required.length};
}
function curveLevel(curve,t){t=Math.max(0,Math.min(1,t));const id=typeof curve==='string'?curve:curve.id;if(id==='fast')return .74*(1-(1-t)**4);if(id==='steady')return .74*t;if(id==='delayed'){const z=Math.max(0,Math.min(1,(t-.32)/.68));return .74*z*z*(3-2*z);}if(id==='network')return [.12,.43,.73].reduce((n,start)=>{const z=Math.max(0,Math.min(1,(t-start)/.12));return n+.74/3*z*z*(3-2*z);},0);throw new Error('未确认经营情景');}
const api={VERSION:'5.0',clone,InputError,MECHANISMS,MECHANISM_OPTIONS,READINESS,READINESS_OPTIONS,MODELS,LIMITS,units,blank,normalize,parse,requiredQuestions,validate,diagnose,curveLevel};if(typeof module!=='undefined'&&module.exports)module.exports=api;else host.GAIDNModel=api;
})(globalThis);
