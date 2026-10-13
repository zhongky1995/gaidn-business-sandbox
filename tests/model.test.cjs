const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('../app/model.js'),examples=require('../app/examples.js');
const sample=id=>M.clone(examples.find(e=>e.id===id).data);
for(const [example,type,curve] of [['product','T1','fast'],['service','T2','linear'],['advice','T3','delayed'],['project','T4','delayed'],['matching','T5','fast'],['network','T6','linear']]){
 test(example+'：按经营事实识别类型与变化机制',()=>{const r=M.diagnose(sample(example));assert.deepEqual(r.ids,[type]);assert.equal(r.curve.id,curve);assert.equal(r.conflicts.length,0);});
}
test('未知事实不填零、不强制分型或画增长曲线',()=>{const r=M.diagnose(sample('unknown'));assert.deepEqual(r.ids,[]);assert.equal(r.complete,false);assert.equal(r.curve,null);assert.equal(r.assets.length,0);assert.equal(r.headlineReady,false);});
test('组合业务保留两种逻辑，无构成百分比',()=>{const r=M.diagnose(sample('mixed'));assert.deepEqual(r.ids,['T3','T4']);assert.equal(r.complete,true);assert.equal('score' in r,false);});
test('行业、公司名或订阅收费不能覆盖经营事实',()=>{const d=sample('product');d.subject.name='AI平台顾问会员网络';d.subject.business='按月收取费用提供标准模板';assert.deepEqual(M.diagnose(d).ids,['T1']);});
test('供给名单不把定制交付变成撮合',()=>{const d=sample('project');d.subject.business='有很多合作供应商的定制项目公司';assert.deepEqual(M.diagnose(d).ids,['T4']);});
test('只改尺寸的明确方法不能硬归定制项目',()=>{const d=sample('project');d.business_modes[0].delivery_method={value:'repeatable',evidence:'只按既定款式改尺寸'};assert.ok(M.diagnose(d).conflicts.length);});
test('交换角色与购买结果矛盾时阻止确定结论',()=>{const d=sample('matching');d.business_modes[0].exchange_role={value:'not_core',evidence:'只由公司单向交付'};assert.ok(M.diagnose(d).conflicts.length);assert.equal(M.diagnose(d).curve,null);});
test('同一类型随资料条件变化，建议与曲线改变',()=>{const d=sample('project');d.readiness.materials={value:'none',evidence:'没有留下相关资料'};const r=M.diagnose(d);assert.deepEqual(r.ids,['T4']);assert.equal(r.stage,'record');assert.equal(r.curve,null);assert.ok(r.assets.every(a=>a.preparation==='先记录经验'));assert.match(r.next,/先把.*记录成一个可核对的样例/);});
for(const value of ['none','unknown'])test('缺少复核负责人时不画曲线：'+value,()=>{const d=sample('product');d.readiness.owner={value,evidence:value==='none'?'没有安排复核人员':''};assert.equal(M.diagnose(d).curve,null);});
test('只有未整理的经验，不当作可直接供AI检索的材料',()=>{const d=sample('project');d.assets[0].status='experience_only';const r=M.diagnose(d);assert.equal(r.stage,'record');assert.equal(r.curve,null);});
test('无积累不因类型自动填优势或金句',()=>{const d=sample('project');d.assets=[];d.focus_asset=null;const r=M.diagnose(d);assert.deepEqual(r.ids,['T4']);assert.equal(r.assets.length,0);assert.equal(r.curve,null);assert.equal(r.headlineReady,false);});
test('单人经营的建议不虚构团队',()=>{const r=M.diagnose(sample('advice'));assert.ok(r.next.includes('由你核对'));assert.ok(!r.next.includes('团队'));});
test('一组事实未知时，保留已识别类型及待补充状态',()=>{const d=sample('mixed');d.business_modes[1].customer_result={value:'unknown',evidence:''};const r=M.diagnose(d);assert.deepEqual(r.ids,['T3']);assert.equal(r.complete,false);assert.equal(r.curve,null);});
test('接受单个JSON代码框，但拒绝多个候选参数',()=>{const raw=JSON.stringify(sample('project'));assert.equal(M.parse('这是参数\n```json\n'+raw+'\n```').subject.name,'远序软件');assert.throws(()=>M.parse('```json\n'+raw+'\n```\n```json\n'+raw+'\n```'),M.InputError);});
for(const [name,mutate] of [
 ['错误版本',d=>d.schema_version='2.0'],['越界首做项',d=>d.focus_asset=4],['伪造附加评分',d=>d.score=99],['已知值缺少依据',d=>d.readiness.owner.evidence=''],['错误枚举',d=>d.assets[0].kind='toString'],['重复积累',d=>d.assets[1].kind=d.assets[0].kind],['名称过长',d=>d.subject.name='长'.repeat(41)],['空名称',d=>d.subject.name=' '],['错误示例标记',d=>d.is_example='false']
])test('参数校验：'+name,()=>{const d=sample('project');mutate(d);assert.throws(()=>M.validate(d),M.InputError);});
test('三种示意曲线有相同端点且保持有限、单调',()=>{for(const id of ['fast','linear','delayed']){assert.equal(M.curveValue(id,0),0);assert.equal(M.curveValue(id,1),1);let prev=0;for(let i=0;i<=100;i++){const v=M.curveValue(id,i/100);assert.ok(Number.isFinite(v)&&v>=prev&&v<=1);prev=v;}}});
test('改变首做积累只改变机会表达，不改变经营类型',()=>{const d=sample('project');d.focus_asset=1;const r=M.diagnose(d);assert.deepEqual(r.ids,['T4']);assert.ok(r.next.includes('比对相似客户'));});
