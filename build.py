#!/usr/bin/env python3
"""Bundle the offline app; all files stay local and require no runtime dependencies."""
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
APP = ROOT / 'app'
source = (APP / 'shell.html').read_text()
analytics_config = json.loads((APP / 'analytics-config.json').read_text())
if analytics_config['measurement_id'] and not re.fullmatch(r'G-[A-Z0-9]{6,20}', analytics_config['measurement_id']):
    raise ValueError('Invalid GA4 measurement ID')
replacements = {'APP_STYLES': (APP / 'styles.css').read_text(), 'SKILL_CONTENT': json.dumps((APP / 'skill.txt').read_text(), ensure_ascii=False).replace('<', '\\u003c')}
replacements['ANALYTICS_CONFIG'] = json.dumps(analytics_config, ensure_ascii=False).replace('<', '\\u003c')
for marker, name in [('APP_ANALYTICS', 'analytics.js'), ('APP_LEGACY', 'legacy-model.js'), ('APP_MODEL', 'model.js'), ('APP_EXAMPLES', 'examples.js'), ('APP_POSTER', 'poster.js'), ('APP_UI', 'ui.js')]:
    replacements[marker] = (APP / name).read_text().replace('</script', '<\\/script')
for marker, value in replacements.items():
    needle = '/* ' + marker + ' */'
    if source.count(needle) != 1:
        raise RuntimeError('Missing or duplicated build marker: ' + marker)
    source = source.replace(needle, value)
dist = ROOT / 'dist'
dist.mkdir(exist_ok=True)
out = dist / 'index.html'
out.write_text(source)
manifest = {'version': '2.0.0', 'parameter_schema_version': '2.0', 'html_sha256': hashlib.sha256(out.read_bytes()).hexdigest(), 'skill_sha256': hashlib.sha256((APP / 'skill.txt').read_bytes()).hexdigest(), 'bytes': out.stat().st_size, 'analytics_measurement_id': analytics_config['measurement_id']}
(dist / 'build-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(str(out))
print('Standalone HTML:', out.stat().st_size, 'bytes')
