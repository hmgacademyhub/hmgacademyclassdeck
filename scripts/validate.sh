#!/usr/bin/env bash
# HMG CLASS DECK — pre-deploy validation (run: bash scripts/validate.sh)
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== JS syntax =="
for f in js/*.js sw.js relay/no-obs-social-relay/controller/server.js; do
  node --check "$f"
done

echo "== Inline HTML script syntax =="
python3 - <<'PY2'
from pathlib import Path
from bs4 import BeautifulSoup
import subprocess, tempfile
for html in Path('.').glob('*.html'):
    soup = BeautifulSoup(html.read_text(encoding='utf-8', errors='ignore'), 'html.parser')
    for index, script in enumerate(soup.find_all('script')):
        if script.get('src') or script.get('type') == 'application/ld+json':
            continue
        code = script.string or script.get_text()
        if not code.strip():
            continue
        with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as out:
            out.write(code)
            name = out.name
        try:
            subprocess.run(['node', '--check', name], check=True, capture_output=True, text=True)
        except subprocess.CalledProcessError as exc:
            print(f'{html} inline script {index} failed:\n{exc.stderr}')
            raise SystemExit(1)
print('ALL INLINE SCRIPTS PASSED ✔')
PY2

echo "== JSON =="
for f in manifest.json manifest.webmanifest version.json revoked.json vercel.json relay/no-obs-social-relay/controller/package.json; do
  node -e "JSON.parse(require('fs').readFileSync('$f'))"
done

echo "== Local HTML/service-worker references =="
python3 - <<'PY'
from pathlib import Path
import re

errors = []
for html in Path('.').glob('*.html'):
    text = html.read_text(encoding='utf-8', errors='ignore')
    for value in re.findall(r'\b(?:src|href)="([^"]+)"', text):
        value = value.split('#', 1)[0].split('?', 1)[0]
        if not value or value.startswith(('http://', 'https://', 'mailto:', 'tel:', 'data:', '#')):
            continue
        if not Path(value).exists():
            errors.append(f'{html}: missing {value}')

sw = Path('sw.js').read_text(encoding='utf-8')
for value in re.findall(r'"(\./[^" ]+)"', sw):
    if not Path(value[2:]).exists():
        errors.append(f'sw.js: missing {value}')

for manifest in ('manifest.json', 'manifest.webmanifest'):
    data = __import__('json').loads(Path(manifest).read_text())
    for icon in data.get('icons', []):
        if not Path(icon['src']).exists(): errors.append(f'{manifest}: missing {icon["src"]}')
    for shot in data.get('screenshots', []):
        if not Path(shot['src']).exists(): errors.append(f'{manifest}: missing {shot["src"]}')

if errors:
    print('\n'.join('MISSING: ' + e for e in errors))
    raise SystemExit(1)
print('ALL CHECKS PASSED ✔')
PY

echo "== RTC behavior tests =="
node scripts/test-rtc.mjs
node scripts/test-worker.mjs

echo "== Toolkit data =="
node <<'NODE'
const fs = require('fs'), vm = require('vm');
const context = { console };
vm.createContext(context);
for (const file of ['js/toolkit-data.js', 'js/toolkit-data2.js', 'js/toolkit-data3.js']) {
  const source = fs.readFileSync(file, 'utf8').replace(/\bconst\b/g, 'var');
  vm.runInContext(source, context, { filename: file });
}
if (context.TK_CARDS.length !== 181) throw new Error(`Expected 181 reference cards, found ${context.TK_CARDS.length}`);
console.log(`181 reference cards loaded ✔`);
NODE

echo "ALL CHECKS PASSED ✔"
