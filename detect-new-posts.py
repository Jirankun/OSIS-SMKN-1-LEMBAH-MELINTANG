#!/usr/bin/env python3
"""
Detect new posts from content/posts-index.json (git diff HEAD~1 vs HEAD)
Output: /tmp/new-posts.json
Usage: FORCE=true python3 detect-new-posts.py
"""
import json, subprocess, sys, os

NEW_FILE = 'content/posts-index.json'
OUT_FILE = '/tmp/new-posts.json'
FORCE = os.environ.get('FORCE', 'false') == 'true'

# Load new version
try:
    with open(NEW_FILE) as f:
        nd = json.load(f)
    new = nd if isinstance(nd, list) else nd.get('posts', [])
except:
    new = []

if not new:
    json.dump({'items':[],'count':0}, open(OUT_FILE,'w'))
    sys.exit(0)

# Load old version
old = []
if not FORCE:
    try:
        r = subprocess.run(['git','show','HEAD~1:content/posts-index.json'],
            capture_output=True, text=True, timeout=10).stdout
        if r:
            parsed = json.loads(r)
            old = parsed if isinstance(parsed, list) else parsed.get('posts', [])
    except:
        pass

# Find new items by filename
old_files = {p.get('filename') for p in old if p.get('filename')}
items = [p for p in new if p.get('filename') and p.get('filename') not in old_files]

if not items and len(new) > len(old):
    sorted_all = sorted([p for p in new if p.get('date')], key=lambda x: x['date'], reverse=True)
    if sorted_all: items = sorted_all[:len(new)-len(old)]

items.sort(key=lambda x: str(x.get('date','')), reverse=True)

result = [{
    'title': i.get('title','Postingan Baru'),
    'type': i.get('type','berita'),
    'filename': i.get('filename',''),
    'date': i.get('date',''),
} for i in items[:5]]

json.dump({'items':result,'count':len(result)}, open(OUT_FILE,'w'))
print(f"Found {len(result)} new posts")
