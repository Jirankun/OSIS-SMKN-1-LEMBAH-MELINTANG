#!/usr/bin/env python3
"""
Send push notifications to worker for new content.
Reads from /tmp/new-posts.json or /tmp/new-galeri.json (set via MODE env).
Usage: MODE=posts python3 send-push.py
       MODE=galeri python3 send-push.py
"""
import json, subprocess, os, sys

mode = os.environ.get('MODE', 'posts')
file_map = {'posts': '/tmp/new-posts.json', 'galeri': '/tmp/new-galeri.json'}
infile = file_map.get(mode, '/tmp/new-posts.json')

worker_url = os.environ.get('WORKER_URL', '').rstrip('/')
api_key = os.environ.get('API_KEY', '')

if not worker_url:
    print("ERROR: WORKER_URL not set"); sys.exit(1)
if not api_key:
    print("ERROR: API_KEY not set"); sys.exit(1)
if not os.path.isfile(infile):
    print(f"No data file: {infile}"); sys.exit(0)

with open(infile) as f:
    data = json.load(f)

items = data.get('items', [])
if not items:
    print("No items to send"); sys.exit(0)

for item in items:
    if mode == 'posts':
        t = item.get('title', 'Postingan Baru')
        tp = item.get('type', 'berita')
        tl = tp[0].upper() + tp[1:] if tp else 'Postingan'
        title = f"{tl} Baru - {t}"
        body = f"Klik untuk membaca {tp} terbaru dari OSIS SMKN 1 Lembah Melintang"
        notif_type = tp
    else:
        t = item.get('title', 'Foto Baru')
        title = f"Foto Baru di Galeri - {t}"
        body = "Klik untuk melihat foto terbaru di galeri OSIS SMKN 1 Lembah Melintang"
        notif_type = 'galeri'

    payload = json.dumps({
        'title': title,
        'body': body,
        'type': notif_type,
    })

    result = subprocess.run(
        ['curl', '-sL', '-X', 'POST', worker_url,
         '-H', 'Content-Type: application/json',
         '-H', f'Authorization: Bearer {api_key}',
         '-d', payload],
        capture_output=True, text=True, timeout=30
    )

    if result.returncode != 0:
        print(f"FAILED: {title}")
        print(f"  Stderr: {result.stderr.strip()}")
        sys.exit(1)

    print(f"Sent: {title}")
    if result.stdout:
        print(f"  Response: {result.stdout.strip()}")
