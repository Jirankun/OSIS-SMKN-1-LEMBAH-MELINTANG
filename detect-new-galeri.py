#!/usr/bin/env python3
"""
Detect new gallery items from content/galeri.json (git diff HEAD~1 vs HEAD)
Output: /tmp/new-galeri.json
Usage: FORCE=true python3 detect-new-galeri.py
"""
import json, subprocess, sys, os

NEW_FILE = 'content/galeri.json'
OUT_FILE = '/tmp/new-galeri.json'
FORCE = os.environ.get('FORCE', 'false') == 'true'

def get_id(i):
    return str(i.get('id') or i.get('image') or i.get('judul') or i.get('title') or '')

# Load new version
try:
    with open(NEW_FILE) as f:
        nd = json.load(f)
    new = nd if isinstance(nd, list) else nd.get('galeri', nd.get('photos', []))
except:
    new = []

if not new:
    json.dump({'items':[],'count':0}, open(OUT_FILE,'w'))
    sys.exit(0)

# Load old version
old = []
if not FORCE:
    try:
        r = subprocess.run(['git','show','HEAD~1:content/galeri.json'],
            capture_output=True, text=True, timeout=10).stdout
        if r:
            parsed = json.loads(r)
            old = parsed if isinstance(parsed, list) else parsed.get('galeri', parsed.get('photos', []))
    except:
        pass

# Find new items by id/image
old_ids = {get_id(i) for i in old if get_id(i)}
items = [i for i in new if get_id(i) and get_id(i) not in old_ids]

if not items and len(new) > len(old):
    sorted_all = sorted([i for i in new if i.get('date') or i.get('tanggal')],
        key=lambda x: x.get('date') or x.get('tanggal'), reverse=True)
    if sorted_all: items = sorted_all[:len(new)-len(old)]

items.sort(key=lambda x: str(x.get('date') or x.get('tanggal','')), reverse=True)

result = [{
    'title': i.get('judul') or i.get('title', 'Foto Baru'),
    'image': i.get('image', ''),
    'date': i.get('date') or i.get('tanggal', ''),
} for i in items[:5]]

json.dump({'items':result,'count':len(result)}, open(OUT_FILE,'w'))
print(f"Found {len(result)} new gallery items")
