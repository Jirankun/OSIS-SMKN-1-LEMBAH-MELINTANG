#!/usr/bin/env python3
"""
Script untuk generate posts-index.json dari file markdown di folder post/
Dijalankan secara otomatis oleh GitHub Actions saat ada push ke repository
"""

import os
import json
import re
from datetime import datetime

# Konfigurasi path
POST_FOLDER = "post"
OUTPUT_FILE = "content/posts-index.json"

def extract_frontmatter(content):
    """Extract data dari frontmatter YAML di file markdown"""
    frontmatter = {}
    
    # Pattern untuk menangkap konten antara ---
    pattern = r"^---\n(.*?)\n---"
    match = re.search(pattern, content, re.DOTALL)
    
    if match:
        yaml_content = match.group(1)
        lines = yaml_content.split('\n')
        
        for line in lines:
            if ':' in line:
                key, value = line.split(':', 1)
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                frontmatter[key] = value
    
    return frontmatter

def get_all_markdown_files():
    """Ambil semua file .md dari folder post/"""
    if not os.path.exists(POST_FOLDER):
        print(f"[Warning] Folder {POST_FOLDER} tidak ditemukan.")
        return []
    
    files = []
    for filename in os.listdir(POST_FOLDER):
        if filename.endswith('.md'):
            filepath = os.path.join(POST_FOLDER, filename)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                frontmatter = extract_frontmatter(content)
                
                # Tambahkan filename ke data
                frontmatter['filename'] = filename
                
                # Ambil tanggal dari filename jika tidak ada di frontmatter
                if 'date' not in frontmatter:
                    date_match = re.match(r'(\d{4}-\d{2}-\d{2})', filename)
                    if date_match:
                        frontmatter['date'] = date_match.group(1)
                
                files.append(frontmatter)
                
            except Exception as e:
                print(f"[Error] Gagal membaca file {filename}: {e}")
    
    # Sort berdasarkan tanggal (terbaru dulu)
    files.sort(key=lambda x: x.get('date', ''), reverse=True)
    
    return files

def main():
    print("[Info] Memulai generate posts-index.json...")
    
    # Pastikan folder content ada
    os.makedirs("content", exist_ok=True)
    
    # Ambil semua file markdown
    posts = get_all_markdown_files()
    
    if not posts:
        print("[Warning] Tidak ada file markdown ditemukan di folder post/")
        # Tetap buat file kosong agar tidak error
        posts = []
    
    # Tulis ke JSON
    try:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(posts, f, indent=2, ensure_ascii=False)
        
        print(f"[Success] Berhasil generate {OUTPUT_FILE} dengan {len(posts)} postingan.")
        
    except Exception as e:
        print(f"[Error] Gagal menulis file {OUTPUT_FILE}: {e}")
        raise

if __name__ == "__main__":
    main()
