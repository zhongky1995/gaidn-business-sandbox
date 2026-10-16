(function(host){
'use strict';
const f=(value,evidence)=>({value,evidence});
function sample(stage,info){
 const d={schema_version:'2.0',is_example:true,subject:{name:info[0],business:info[1],team_mode:'team',headcount:info[2],size_band:info[3],business_type:info[4]},organization:{coordination:f(info[5],info[6])},focus:{task:info[7],asset:info[8],domain:info[9],experience:f('repeated',info[10]),evidence_level:'described'},memory:{record:f(stage===0?'none':stage===1?'principles':'guideline',stage===0?'相关判断主要由老手口述，还没有相应记录':stage===1?'保留实际项目记录，但手册只有原则，没有写清适用边界':'已记录责任、效期、适用与排除条件、判断例外和正反例'),guideline:Object.fromEntries(['authority','scope','logic','examples'].map(k=>[k,stage<2?f('unknown',''):f('yes',{authority:'由业务负责人签定，标明版本、复核日期和必须遵守的范围',scope:'分别列出适用场景和不适用情形',logic:'记录具体判断条件，例外须由负责人确认',examples:'保留采用与拒绝该判断的正反事例'}[k])]))},practice:{ai_use:f(stage<2?'manual':stage===2?'manual':'auto_traced',stage<2?'AI目前只整理材料，由人负责业务判断':stage===2?'目前由负责人手工把准则交给AI进行辅助':'真实工作流会引用准则编号和版本，负责人抽查适用条件'),feedback:f(stage<4?'none':'closed',stage<4?'暂时没有完整的使用后修订实例':'保留了抽查发现问题、归因、负责人批准新版并重新使用的实际记录'),inheritance:f(stage===5?'established':'single',stage===5?'多个业务场景长期复用准则，维护和继承已成为指定岗位的稳定职责':'本次只分析当前业务场景')},readiness:{materials:f(stage===0?'none':stage===1?'scattered':'ready',stage===0?'尚未形成可供AI使用的判断记录':stage===1?'记录分散在不同项目复盘中':'相关准则和当前任务资料可查找并核对'),owner:f('assigned','业务负责人维护准则，另一位负责人复核AI输出'),review:f('clear','先比较负责人和AI对同一脱敏案例的判断，记录差异与采用情况'),frequency:f('repeated','同类工作在不同项目或订单中反复发生'),rollout:f(stage>=4?'phased':'single',stage>=4?'已计划先从一个相邻环节开始，逐段检查采用效果':'经营者决定先验证这一项任务')}};
 return d;
}
const entries=[
 ['memory','青禾制造 · 留下老师傅经验',0,['青禾制造','为品牌客户生产金属配件','约30人','micro','T1','lead','负责人可以直接带着一个班组验证','检查配件是否需要返工','返工判断经验','production','老师傅多次区分表面瑕疵与影响装配的缺陷，会采取不同返工处理，但目前主要靠口述']],
 ['project','远序软件 · 记录变成准则',1,['远序软件','为连锁企业定制业务系统','约80人','small','T4','team','由项目负责人带一个项目先做样板','判断客户需求变更怎样处理','需求变更经验','organization','资深负责人多次区分需要先澄清、另立工作项和可进入当前迭代的变更，留有复盘记录']],
 ['rule','拾木用品 · 准则进入AI任务',2,['拾木用品','销售家庭收纳用品并提供售后服务','约25人','micro','T1','lead','老板可直接带客服负责人验证','准备售后处理建议','售后处理经验','business','针对缺件、误用和产品缺陷有不同处理条件，已在多次售后中复核使用']],
 ['call','问川咨询 · 留下使用反馈',3,['问川咨询','为品牌提供门店选址分析','约120人','small','T3','team','一个业务团队可先完成样板','准备候选门店的比较依据','选址分析经验','business','不同品牌的客群、租金约束与经营目标需要不同判断，既有准则已在真实分析中被引用']],
 ['loop','有序仓配 · 修订后逐步复用',4,['有序仓配','为商家处理订单、分拣与发货','约900人','medium','T2','cross','需要班组与信息支持共同维护规范，各班组承担采用结果','处理仓配异常并完成交接','异常处理经验','production','不同缺件、错单和交接延误有明确处理条件，准则已有抽查与修订记录']],
 ['inherit','共研社 · 组织继承线索',5,['共研社','运营跨地区专业协作服务','约6000人','large','T6','group','多个业务单元需要共用支持，各自负责准则更新和结果','为新项目安排跨团队协作','协作判断经验','organization','多地团队曾按明确的能力、交付限制与历史反馈选择合作方式，长期保留适配和修订记录']]
];
const examples=entries.map(([id,name,stage,info])=>({id,name,data:sample(stage,info)}));
const explore=JSON.parse(JSON.stringify(examples[0].data));explore.subject={...explore.subject,name:'初见工作室',business:'开始尝试为小店制作内容',team_mode:'solo',headcount:'1人',business_type:'unknown'};explore.organization.coordination=f('lead','经营者本人可以选择一项任务并检查结果');explore.focus={task:'完成一次小店内容交付',asset:'',domain:'business',experience:f('none','刚开始尝试新业务，明确暂无可举出的经营判断积累'),evidence_level:'described'};explore.memory.record=f('none','目前没有该业务的经验记录');explore.practice.ai_use=f('none','这项工作还未用AI');explore.readiness.owner=f('none','尚未安排维护和复核责任人');explore.readiness.review=f('none','尚未选定检查结果的方法');examples.push({id:'explore',name:'初见工作室 · 先验证一个起点',data:explore});
const tools=JSON.parse(JSON.stringify(examples[0].data));tools.subject={...tools.subject,name:'桥合服务',headcount:'约100人',size_band:'small',business_type:'T5'};tools.organization.coordination=f('team','先由一个业务团队验证');tools.practice.ai_use=f('auto_untraced','Agent已串接工具，但不能指出采用哪条公司准则或版本');examples.push({id:'tools',name:'桥合服务 · 已用AI，标准待补',data:tools});
if(typeof module!=='undefined'&&module.exports)module.exports=examples;else host.GAIDNExamples=examples;
})(typeof globalThis!=='undefined'?globalThis:this);
