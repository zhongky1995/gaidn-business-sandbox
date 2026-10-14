(function (host) {
  'use strict';
  const schemas = {
    sandbox_step_view: {step: ['start','review','result'], input_origin: ['none','example','user']},
    prompt_copy: {status: ['success','manual_copy']},
    skill_download: {},
    parameter_import: {input_method: ['paste','file','example'], input_origin: ['none','example','user'], status: ['success','failure'], error_code: ['invalid_parameters','file_size','file_read']},
    diagnosis_generate: {input_origin: ['example','user'], status: ['success','failure'], result_status: ['complete','pending','invalid']},
    diagnosis_edit: {input_origin: ['example','user']},
    review_edit: {input_origin: ['example','user']},
    result_image_generate: {input_origin: ['example','user'], status: ['success','failure']},
    result_image_download: {input_origin: ['example','user']},
    parameters_download: {input_origin: ['example','user']},
    repair_copy: {status: ['success','manual_copy']},
    share: {method: ['native'], content_type: ['diagnosis_image'], input_origin: ['example','user'], status: ['success','cancelled','failure']}
  };
  function create(win, config) {
    let enabled = false;
    const noop = () => false;
    const api = {track: noop, enabled: false};
    try {
      if (!/^G-[A-Z0-9]{6,20}$/.test(config.measurement_id || '')) return api;
      if (win.location.protocol !== 'https:' || win.location.origin !== config.origin || win.location.pathname !== config.pathname) return api;
      const pageLocation = config.origin + config.pathname;
      let referrer = '';
      try {referrer = new URL(win.document.referrer).origin + '/';} catch {}
      const debug = new URLSearchParams(win.location.search).get('ga_debug') === '1';
      win.dataLayer = win.dataLayer || [];
      const tag = function () {win.dataLayer.push(arguments);};
      win.gtag = tag;
      const base = {page_location: pageLocation, page_referrer: referrer, page_title: 'GAIDN · 企业 AI 经营沙盘', send_to: config.measurement_id};
      if (debug) base.debug_mode = true;
      tag('js', new Date());
      tag('config', config.measurement_id, {...base, send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, cookie_path: config.pathname, cookie_flags: 'SameSite=Lax;Secure'});
      tag('event', 'page_view', {...base});
      const script = win.document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(config.measurement_id);
      // A blocked or failed tag never changes the sandbox's working state.
      script.onerror = noop;
      win.document.head.append(script);
      enabled = true;
      api.enabled = true;
      api.track = (name, input = {}) => {
        try {
          if (!enabled || !Object.hasOwn(schemas, name)) return false;
          const safe = {...base, event_version: '1'};
          for (const [key, values] of Object.entries(schemas[name])) {
            if (typeof input[key] === 'string' && values.includes(input[key])) safe[key] = input[key];
          }
          tag('event', name, safe);
          if (debug && win.console) win.console.info('GAIDN analytics:', name, JSON.stringify(safe));
          return true;
        } catch {return false;}
      };
    } catch {}
    return api;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {create};
  else {
    let config = {};
    try {config = JSON.parse(host.document.querySelector('#analytics-config').textContent);} catch {}
    host.GAIDNAnalytics = create(host, config);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
