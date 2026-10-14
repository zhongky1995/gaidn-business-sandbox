(function (host) {
  'use strict';
  const TYPES = {
    T1: {name:'标准产品型', family:'价值链', description:'以规格与用途明确、可以反复交付的产品创造价值'},
    T2: {name:'流程服务型', family:'价值链', description:'按相对明确的方法，替客户完成任务或持续提供服务'},
    T3: {name:'专业顾问型', family:'价值工坊', description:'通过专业判断，为复杂问题提供解释与行动建议'},
    T4: {name:'定制项目型', family:'价值工坊', description:'通过针对性设计与协作，交付具体的定制成果'},
    T5: {name:'交易撮合型', family:'价值网络', description:'通过理解供需与建立信任，促成具体交易'},
    T6: {name:'协作平台型', family:'价值网络', description:'通过持续的多方交流与合作，让参与者获得价值'}
  };
  const ASSETS = {
    product_knowledge:{name:'产品知识', action:'AI 产品问答', verb:'查找准确的产品信息', headline:'让产品背后的积累，走进每一次服务。'},
    repeatable_method:{name:'稳定做法', action:'AI 执行辅助', verb:'准备任务步骤与异常提示', headline:'让稳定的做法，成为每一次交付的底气。'},
    professional_cases:{name:'专业案例', action:'AI 证据检索', verb:'查找相关案例与分析依据', headline:'让已有经验，进入下一次关键判断。'},
    reusable_modules:{name:'交付模块', action:'AI 模块推荐', verb:'查找相似需求与可用模块', headline:'让每个项目，成为下一次交付的起点。'},
    customer_context:{name:'客户经验', action:'AI 需求比对', verb:'比对相似客户的需求与反馈', headline:'让懂客户的经验，服务下一次判断。'},
    delivery_records:{name:'交付记录', action:'AI 验收辅助', verb:'整理历史验收要求与检查项', headline:'让交付留下的经验，继续为下一次交付出力。'},
    supply_demand:{name:'供需信息', action:'AI 匹配辅助', verb:'筛选候选对象并说明匹配理由', headline:'让对供需的理解，促成更合适的连接。'},
    cooperation_records:{name:'合作记录', action:'AI 协作发现', verb:'查找可参与协作的能力与历史反馈', headline:'让每一次合作，为下一次连接留下线索。'}
  };
  const OPTIONS = {
    customer_result:{product:'明确的产品或内容',execution:'完成既定任务或服务',advice:'判断与行动建议',custom_result:'定制成果',transaction:'促成一笔交易',ongoing_network:'持续的多方交流与合作',unknown:'尚不清楚'},
    delivery_method:{repeatable:'接单前方法基本明确',diagnostic:'需要重新诊断、设计或迭代',unknown:'尚不清楚'},
    exchange_role:{core:'参与者之间的交换构成主要价值',not_core:'主要是我方为客户交付',unknown:'尚不清楚'},
    materials:{ready:'有可核对、可使用的资料',scattered:'有记录，但比较零散',none:'尚未留存',unknown:'尚不清楚'},
    owner:{assigned:'有人负责维护和复核',none:'尚未安排负责人',unknown:'尚不清楚'},
    standard_task:{yes:'有清楚且重复的任务',no:'目前没有',unknown:'尚不清楚'},
    repeated_need:{yes:'同类需求反复出现',no:'各次需求差异很大',unknown:'尚不清楚'},
    reuse_basis:{yes:'有可以跨次使用的做法或资料',no:'尚未发现复用基础',unknown:'尚不清楚'},
    rollout:{single_task:'先接入一项明确任务',phased:'已计划分环节推进',unknown:'尚未确定'},
    team_mode:{team:'团队经营',solo:'个人经营',unknown:'尚不清楚'},
    asset_status:{documented:'有可核对的材料',experience_only:'有实际经验，尚未整理成资料'}
  };
  const MODE_LABELS={customer_result:'客户主要购买什么',delivery_method:'怎样完成交付',exchange_role:'谁与谁交换价值'};
  const READY_LABELS={materials:'资料准备',owner:'维护与复核',standard_task:'重复任务',repeated_need:'同类需求',reuse_basis:'复用基础',rollout:'推进方式'};
  const VERSION='1.0';
  const clone=x=>JSON.parse(JSON.stringify(x));
  class InputError extends Error {constructor(issues){super(issues.map(i=>i.message).join('；'));this.name='InputError';this.issues=issues;}}
  function validate(input) {
    const issues=[];
    const bad=(path,message)=>issues.push({path,message});
    const obj=(x,path,keys)=>{
      if(!x||typeof x!=='object'||Array.isArray(x)){bad(path,path+' 应是一组信息');return false;}
      for(const key of keys)if(!Object.hasOwn(x,key))bad(path+'.'+key,'缺少 '+path+'.'+key);
      for(const key of Object.keys(x))if(!keys.includes(key))bad(path+'.'+key,'暂不支持字段 '+path+'.'+key+'，请按当前提示词重新整理');
      return true;
    };
    const str=(x,path,min,max)=>{if(typeof x!=='string'||x.trim().length<min||Array.from(x).length>max)bad(path,path+' 需为 '+min+'—'+max+' 字的文字');};
    const choice=(x,path,options)=>{if(typeof x!=='string'||!Object.hasOwn(options,x))bad(path,path+' 的选项不受支持');};
    const fact=(x,path,options)=>{if(!obj(x,path,['value','evidence']))return;choice(x.value,path+'.value',options);str(x.evidence,path+'.evidence',x.value==='unknown'?0:2,220);};
    if(!obj(input,'参数',['schema_version','is_example','subject','business_modes','assets','focus_asset','readiness']))throw new InputError(issues);
    if(input.schema_version!==VERSION)bad('schema_version','参数版本不匹配，请使用本页最新提示词');
    if(typeof input.is_example!=='boolean')bad('is_example','请说明是否为虚构示例（true 或 false）');
    if(obj(input.subject,'subject',['name','business','team_mode'])){
      str(input.subject.name,'subject.name',1,40);str(input.subject.business,'subject.business',2,100);choice(input.subject.team_mode,'subject.team_mode',OPTIONS.team_mode);
    }
    if(!Array.isArray(input.business_modes)||input.business_modes.length<1||input.business_modes.length>2)bad('business_modes','请分析一项主营业务，最多保留两种不可分的经营逻辑');
    else input.business_modes.forEach((m,i)=>{if(obj(m,'business_modes.'+i,Object.keys(MODE_LABELS)))for(const k of Object.keys(MODE_LABELS))fact(m[k],'business_modes.'+i+'.'+k,OPTIONS[k]);});
    if(!Array.isArray(input.assets)||input.assets.length>3)bad('assets','已有积累最多三项；没有依据时可以留空');
    else {
      const seen=new Set();
      input.assets.forEach((a,i)=>{const p='assets.'+i;if(!obj(a,p,['kind','label','evidence','status']))return;choice(a.kind,p+'.kind',ASSETS);str(a.label,p+'.label',2,10);str(a.evidence,p+'.evidence',8,180);choice(a.status,p+'.status',OPTIONS.asset_status);if(seen.has(a.kind))bad(p+'.kind','同一种积累请合并为一项');seen.add(a.kind);});
    }
    if(input.focus_asset!==null&&(!Number.isInteger(input.focus_asset)||input.focus_asset<0||!Array.isArray(input.assets)||input.focus_asset>=input.assets.length))bad('focus_asset','起步积累必须指向已有条目，或设为 null');
    if(Array.isArray(input.assets)&&input.assets.length>0&&input.focus_asset===null)bad('focus_asset','请指定一项最值得先用起来的积累');
    if(obj(input.readiness,'readiness',Object.keys(READY_LABELS)))for(const k of Object.keys(READY_LABELS))fact(input.readiness[k],'readiness.'+k,OPTIONS[k]);
    if(issues.length)throw new InputError(issues);
    return clone(input);
  }
  function parse(text){
    if(typeof text!=='string'||new TextEncoder().encode(text).length>80000)throw new InputError([{path:'input',message:'参数内容过长，请导入不超过 80 KB 的参数'}]);
    let s=text.trim().replace(/^\uFEFF/,'');
    const fences=Array.from(s.matchAll(/```(?:json)?\s*\n([\s\S]*?)```/gi));
    if(fences.length===1)s=fences[0][1].trim();
    else if(fences.length>1)throw new InputError([{path:'input',message:'找到了多段代码，请只复制最终那一份参数'}]);
    let data;try{data=JSON.parse(s);}catch{throw new InputError([{path:'input',message:'没有读到完整参数。请复制大模型给出的整段 JSON，或导入参数文件'}]);}
    return validate(data);
  }
  function classifyMode(m){
    const c=m.customer_result.value,d=m.delivery_method.value,e=m.exchange_role.value;
    if(e==='core'){
      if(c==='transaction')return {id:'T5'};
      if(c==='ongoing_network')return {id:'T6'};
      if(c==='unknown')return {pending:'还需明确客户主要购买的是具体匹配，还是持续的多方连接'};
      return {conflict:'参与者之间的交换被标为主要价值，但客户购买结果并非撮合或持续网络；请核对这两项'};
    }
    if(c==='transaction'||c==='ongoing_network'){
      return e==='unknown'?{pending:'还需核实参与者之间的交换是否构成主要价值'}:{conflict:'客户购买撮合或持续网络，但价值交换被标为我方单向交付；请核对'};
    }
    if(e==='unknown')return {pending:'还需明确是我方交付，还是促成参与者之间的交换'};
    if(c==='unknown'||d==='unknown')return {pending:'还需明确客户购买结果与交付方法'};
    if(d==='repeatable'&&c==='product')return {id:'T1'};
    if(d==='repeatable'&&c==='execution')return {id:'T2'};
    if(d==='diagnostic'&&c==='advice')return {id:'T3'};
    if(d==='diagnostic'&&c==='custom_result')return {id:'T4'};
    return {conflict:'购买结果与交付方法不匹配；例如定制成果应包含实质性的诊断或设计，请核对'};
  }
  function diagnose(raw){
    const data=validate(raw),modes=data.business_modes.map(classifyMode);
    const ids=Array.from(new Set(modes.map(m=>m.id).filter(Boolean)));
    const conflicts=modes.map((m,i)=>m.conflict?{path:'business_modes.'+i,message:m.conflict}:null).filter(Boolean);
    const pending=modes.map(m=>m.pending).filter(Boolean),complete=!conflicts.length&&!pending.length;
    const v={};for(const [k,f] of Object.entries(data.readiness))v[k]=f.value;
    const focus=data.focus_asset===null?null:data.assets[data.focus_asset];
    const who=data.subject.team_mode==='solo'?'你':data.subject.team_mode==='team'?'团队':'负责人';
    let stage='clarify';
    if(focus){if(v.materials==='none'||focus.status==='experience_only')stage='record';else if(v.materials==='scattered')stage='organize';else if(v.owner==='none')stage='owner';else if(v.materials==='ready'&&v.owner==='assigned')stage='use';}
    const assetNodes=data.assets.map(a=>({...a,action:ASSETS[a.kind].action,preparation:a.status==='experience_only'||v.materials==='none'?'先记录经验':v.materials==='scattered'?'先整理资料':v.owner!=='assigned'?'先明确复核':v.materials==='ready'?'可在复核下试用':'先核对资料'}));
    const typeNames=ids.map(id=>TYPES[id].name);
    let headline='从一项真实业务，找到 AI 可以接上的地方。';
    const headlineReady=Boolean(focus&&complete&&v.repeated_need==='yes'&&v.reuse_basis==='yes');
    if(headlineReady)headline=ASSETS[focus.kind].headline;
    else if(focus&&complete)headline='把已有的积累，变成下一步的起点。';
    const classification=complete?typeNames.join(' × '):ids.length?typeNames.join(' × ')+' · 仍待补充':'经营类型待补充';
    let explanation=complete?(ids.length===1?'你'+TYPES[ids[0]].description+'。':'这项业务同时包含'+typeNames.join('与')+'的逻辑。'):'现有信息还不足以确定经营类型，先保留可以核对的积累。';
    explanation+=focus?'可以从“'+focus.label+'”入手，探索 AI 如何参与下一次工作。':'补充一个典型订单与一项真实积累，再明确 AI 的起步方向。';
    let next='先补充一个典型订单：客户为什么付费、你怎样交付，以及留下了什么可核对的经验。';
    if(focus){
      const verb=ASSETS[focus.kind].verb;
      if(stage==='record')next='先把“'+focus.label+'”记录成一个可核对的样例，再尝试让 AI '+verb+'。';
      if(stage==='organize')next='先围绕一次常见任务整理“'+focus.label+'”，再让 AI '+verb+'，由'+who+'核对适用性。';
      if(stage==='owner')next='先确定谁维护“'+focus.label+'”、谁复核结果，再试用 AI '+verb+'。';
      if(stage==='use')next='先让 AI '+verb+'，由'+who+'核对、执行，再把结果与修正记录留下来。';
      if(stage==='clarify')next='先核实“'+focus.label+'”能否查到、由谁复核，再尝试让 AI '+verb+'。';
    }
    const curves={
      fast:{title:'先释放，再优化',preparedTitle:'先准备，再释放',mechanism:'先接入明确的重复任务，较早释放效率，再逐步优化',phases:['接入明确任务','逐步趋稳']},
      linear:{title:'一步一步，让改善累积',preparedTitle:'先试点，再逐步推广',mechanism:'分环节接入，让改善随着采用逐步累积',phases:['分批接入','持续改善']},
      delayed:{title:'先积累，再加速',preparedTitle:'先沉淀，再加速复用',mechanism:'先沉淀案例与做法，再通过复用逐步释放价值',phases:['整理与磨合','复用逐渐形成']},
      explore:{title:'先找到起点，再验证价值',preparedTitle:'先找到起点，再验证价值',mechanism:'先明确一项主营任务，再验证一个小成果',phases:['明确主营任务','小范围验证']}
    };
    let curve=null;
    if(!conflicts.length){
      const defaults={T1:'fast',T2:'linear',T3:'delayed',T4:'delayed',T5:'fast',T6:'linear'};
      const routes=ids.map(id=>defaults[id]);
      let id=routes.includes('delayed')?'delayed':routes.includes('linear')?'linear':routes.length?'fast':'explore';
      let source=ids.length?'type':'exploration';
      if(complete&&focus?.status==='documented'&&v.owner==='assigned'){
        if(v.materials==='ready'&&v.standard_task==='yes'&&v.rollout==='single_task'){id='fast';source='conditions';}
        else if(v.materials==='ready'&&v.rollout==='phased'){id='linear';source='conditions';}
        else if(['ready','scattered'].includes(v.materials)&&v.repeated_need==='yes'&&v.reuse_basis==='yes'){id='delayed';source='conditions';}
      }
      const requirements=[];
      if(!complete)requirements.push('主营交付逻辑');
      if(!focus)requirements.push('一项真实积累');
      if(v.materials!=='ready'||focus?.status==='experience_only')requirements.push(v.materials==='scattered'?'整理已有资料':'可核对的资料');
      if(v.owner!=='assigned')requirements.push('维护与复核安排');
      if(id==='fast'&&v.standard_task!=='yes')requirements.push('一项明确的重复任务');
      if(id==='linear'&&v.rollout!=='phased')requirements.push('分环节推进安排');
      if(id==='delayed'&&v.repeated_need!=='yes')requirements.push('同类需求验证');
      if(id==='delayed'&&v.reuse_basis!=='yes')requirements.push('可复用做法');
      const conditional=Boolean(requirements.length),definition=curves[id];
      const preparation=conditional&&id!=='explore'?(v.materials==='none'||v.owner==='none'||focus?.status==='experience_only' ? .32 : .2):0;
      const basis=source==='conditions'?'匹配依据：已确认的起步条件支持'+definition.mechanism+'。':source==='type'?'匹配依据：'+typeNames.join(' × ')+'，按“'+definition.mechanism+'”示意。':'经营逻辑待确认，先展示从明确任务到小范围验证的起步路线。';
      const condition=conditional?'准备与验证：'+requirements.join('、')+'。虚线示意这些条件逐步落实后的可能走向。':'在资料、人工复核与交付质量保持可用的前提下，沿这条路径验证改善；曲线不是收益承诺。';
      curve={id,source,conditional,preparation,basis,condition,title:conditional?definition.preparedTitle:definition.title,phases:conditional&&id!=='explore'?['准备与试点',definition.phases[1]]:definition.phases};
    }
    return {data,ids,typeNames,classification,complete,conflicts,pending,headline,headlineReady,explanation,next,stage,assets:assetNodes,curve,focus,required:requiredQuestions(data)};
  }
  function requiredQuestions(data){
    const questions=[];
    if(!data.subject.name.trim())questions.push({path:'subject.name',message:'请填写企业或经营者名称，也可以用化名。'});
    if(data.subject.business.trim().length<2)questions.push({path:'subject.business',message:'请用一句话明确这次分析的主营业务。'});
    data.business_modes.forEach((m,i)=>{
      const result=classifyMode(m);
      if(result.pending||result.conflict)questions.push({path:'business_modes.'+i,message:result.pending||result.conflict});
      for(const [key,label] of Object.entries(MODE_LABELS))if(m[key].value!=='unknown'&&m[key].evidence.trim().length<2)questions.push({path:'business_modes.'+i+'.'+key,message:'请为“'+label+'”补充一句实际依据。'});
    });
    for(const [key,question] of [['materials','请确认资料状态：有可用资料、有零散记录，还是尚未留存？'],['owner','请确认复核安排：已有负责人（也可以是你自己），还是尚未安排？']]){
      const fact=data.readiness[key];
      if(fact.value==='unknown')questions.push({path:'readiness.'+key,message:question});
      else if(fact.evidence.trim().length<2)questions.push({path:'readiness.'+key,message:'请为“'+READY_LABELS[key]+'”补充一句实际依据。'});
    }
    for(const key of Object.keys(READY_LABELS).filter(k=>!['materials','owner'].includes(k)))if(data.readiness[key].value!=='unknown'&&data.readiness[key].evidence.trim().length<2)questions.push({path:'readiness.'+key,message:'请为“'+READY_LABELS[key]+'”补充一句实际依据，尚未确定时可以保留未知。'});
    data.assets.forEach((asset,i)=>{
      if(asset.label.trim().length<2)questions.push({path:'assets.'+i+'.label',message:'请为这项真实积累填写一个清楚的名称。'});
      if(asset.evidence.trim().length<8)questions.push({path:'assets.'+i+'.evidence',message:'请为“'+(asset.label||'这项积累')+'”补充一个真实发生过的例子。'});
    });
    return questions;
  }
  function curveValue(id,t,preparation=0){
    t=Math.max(0,Math.min(1,t));
    if(id==='explore'){const z=Math.max(0,(t-.42)/.58);return .55*z*z*(3-2*z);}
    const start=Math.max(0,Math.min(.6,preparation));t=Math.max(0,(t-start)/(1-start));
    if(id==='fast')return 1-Math.pow(1-t,4);if(id==='linear')return t;const z=Math.max(0,Math.min(1,(t-.24)/.68));return z*z*(3-2*z);
  }
  const api={TYPES,ASSETS,OPTIONS,MODE_LABELS,READY_LABELS,VERSION,InputError,parse,validate,diagnose,requiredQuestions,curveValue,clone};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else host.GAIDNModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);
