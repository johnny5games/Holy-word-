#!/usr/bin/env python3
"""Regenerates sw.js with the full precache list (run after changing any file)."""
import os, hashlib, json
root = os.path.dirname(os.path.abspath(__file__))
skip = {'sw.js', 'sw.template.js', 'make-sw.py', '.nojekyll', 'README.md'}
files, h = [], hashlib.sha256()
for d, _, fs in os.walk(root):
    if '/.git' in d: continue
    for f in sorted(fs):
        rel = os.path.relpath(os.path.join(d, f), root)
        if rel in skip or rel.startswith('.'): continue
        files.append(rel)
files.sort()
total = 0
for f in files:
    b = open(os.path.join(root, f), 'rb').read(); total += len(b); h.update(f.encode()); h.update(b)
ver = 'ghw-2.15-' + h.hexdigest()[:10]
tpl = open(os.path.join(root, 'sw.template.js')).read()
open(os.path.join(root, 'sw.js'), 'w').write(tpl.replace('__VERSION__', ver).replace('__FILES__', json.dumps(['./'] + files)).replace('__BYTES__', str(total)))
print(ver, len(files), 'files', total, 'bytes')
