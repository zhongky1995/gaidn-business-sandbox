const test=require('node:test'),assert=require('node:assert/strict');
const {create}=require('../app/analytics.js');
const config={measurement_id:'G-R3SEBYCRSR',origin:'https://zhongky1995.github.io',pathname:'/gaidn-business-sandbox/'};
function setup(overrides={}){
 const scripts=[];
 const win={location:{protocol:'https:',origin:config.origin,pathname:config.pathname,search:''},document:{referrer:'https://example.com/private/customer?email=private@example.com',createElement:()=>({}),head:{append:s=>scripts.push(s)}},console:{info(){}}};
 if(overrides.location)Object.assign(win.location,overrides.location);
 if(overrides.document)Object.assign(win.document,overrides.document);
 if(overrides.dataLayer)win.dataLayer=overrides.dataLayer;
 const api=create(win,overrides.config||config);
 return {win,api,scripts,events:()=>Array.from(win.dataLayer||[],a=>Array.from(a)).filter(a=>a[0]==='event')};
}
test('production initializes one page view and async tag with real destination',()=>{
 const s=setup();assert.equal(s.api.enabled,true);assert.equal(s.scripts.length,1);assert.equal(s.scripts[0].async,true);assert.match(s.scripts[0].src,/id=G-R3SEBYCRSR$/);assert.equal(s.events().filter(e=>e[1]==='page_view').length,1);
 const c=Array.from(s.win.dataLayer[1]);assert.equal(c[0],'config');assert.equal(c[2].send_page_view,false);assert.equal(c[2].allow_google_signals,false);assert.equal(c[2].allow_ad_personalization_signals,false);
});
test('offline, localhost, wrong origin and other project paths do not send statistics',()=>{
 for(const location of [{protocol:'file:'},{protocol:'http:',origin:'http://localhost:8767'},{origin:'https://other.example'},{pathname:'/different-project/'}]){const s=setup({location});assert.equal(s.api.enabled,false);assert.equal(s.scripts.length,0);assert.deepEqual(s.events(),[]);assert.equal(s.api.track('skill_download'),false);}
});
test('empty and malformed measurement IDs fail closed',()=>{
 for(const id of ['', 'G-','G-INVALID<script>','UA-123']){const s=setup({config:{...config,measurement_id:id}});assert.equal(s.api.enabled,false);assert.deepEqual(s.events(),[]);}
});
test('URL query, fragment and referrer paths never enter event parameters',()=>{
 const s=setup({location:{search:'?company=secret&email=private%40example.com#secret'}});s.api.track('diagnosis_generate',{input_origin:'user',status:'success',result_status:'complete'});
 for(const e of s.events()){assert.equal(e[2].page_location,config.origin+config.pathname);assert.equal(e[2].page_referrer,'https://example.com/');assert.ok(!JSON.stringify(e).includes('private'));assert.ok(!JSON.stringify(e).includes('secret'));}
});
test('event and parameter whitelists discard business text, names, files, objects and invalid enum values',()=>{
 const s=setup();assert.equal(s.api.track('company_secret',{name:'Sensitive company'}),false);
 s.api.track('parameter_import',{input_method:'file',input_origin:'user',status:'success',company_name:'Sensitive company',evidence:'Secret evidence',filename:'客户.xlsx',parameters:{secret:1},error_code:'Secret error',step:'Secret step'});
 const e=s.events().at(-1);assert.equal(e[1],'parameter_import');assert.equal(e[2].input_method,'file');assert.equal(e[2].input_origin,'user');assert.equal(e[2].status,'success');for(const k of ['company_name','evidence','filename','parameters','error_code','step'])assert.equal(Object.hasOwn(e[2],k),false);
});
test('input origin and outcome distinguish examples, real inputs, pending and failed results',()=>{
 const s=setup();for(const p of [{input_origin:'example',status:'success',result_status:'complete'},{input_origin:'user',status:'success',result_status:'pending'},{input_origin:'user',status:'failure',result_status:'invalid'}]){s.api.track('diagnosis_generate',p);const q=s.events().at(-1)[2];for(const [k,v] of Object.entries(p))assert.equal(q[k],v);}
});
test('debug mode must be explicit and is absent from normal visits',()=>{
 assert.equal(Object.hasOwn(setup().events()[0][2],'debug_mode'),false);assert.equal(setup({location:{search:'?ga_debug=1'}}).events()[0][2].debug_mode,true);
});
test('tag and tracking failures never throw into application flows',()=>{
 const s=setup();assert.doesNotThrow(()=>s.scripts[0].onerror());assert.doesNotThrow(()=>s.api.track('prompt_copy',null));s.win.dataLayer.push=()=>{throw Error('blocked')};assert.doesNotThrow(()=>s.api.track('skill_download'));assert.equal(s.api.track('skill_download'),false);
 const failed=setup({document:{head:{append(){throw Error('blocked')}}}});assert.equal(failed.api.enabled,false);assert.doesNotThrow(()=>failed.api.track('skill_download'));
});
test('existing data layer is preserved and unknown referrer is safely empty',()=>{
 const s=setup({dataLayer:[['prior']],document:{referrer:'invalid private text'}});assert.deepEqual(s.win.dataLayer[0],['prior']);assert.equal(s.events()[0][2].page_referrer,'');
});
test('only explicitly configured deployment aliases enable analytics; actual URL remains stripped of private queries',()=>{
 const alias='https://sandbox.example.test',cfg={...config,additional_origins:[alias]};const s=setup({config:cfg,location:{origin:alias,search:'?company=secret'}});assert.equal(s.api.enabled,true);assert.equal(s.events()[0][2].page_location,alias+config.pathname);assert.ok(!JSON.stringify(s.events()).includes('secret'));
 assert.equal(setup({config:cfg,location:{origin:'https://unlisted.example.test'}}).api.enabled,false);assert.equal(setup({config:cfg,location:{origin:alias,pathname:'/other'}}).api.enabled,false);
});
