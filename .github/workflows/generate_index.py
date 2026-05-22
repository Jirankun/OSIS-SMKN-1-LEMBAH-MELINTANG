#!/usr/bin/env python3
"""
Script untuk generate posts-index.json dari file markdown di folder post/
Dijalankan otomatis oleh GitHub Actions saat ada perubahan di folder post/
"""

import os
import json
import re
from pathlib import Path

# Konfigurasi path
POST_FOLDER = "post"
OUTPUT_FILE = "content/posts-index.json"

def extract_frontmatter(content):
    """Extract data dari frontmatter YAML"""
    frontmatter = {}
    
    # Regex untuk mengambil frontmatter
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
    if not match:
        return frontmatter
    
    yaml_content = match.group(1)
    
    # Parse manual YAML sederhana
    for line in yaml_content.split('\n'):
        if ':' in line:
            key, value = line.split(':', 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            frontmatter[key] = value
    
    return frontmatter

def scan_posts():
    """Scan semua file .md di folder post/"""
    posts = []
    post_path = Path(POST_FOLDER)
    
    if not post_path.exists():
        print(f"[Info] Folder {POST_FOLDER} tidak ditemukan, membuat folder kosong...")
        post_path.mkdir(parents=True, exist_ok=True)
        return posts
    
    # Ambil semua file .md
    md_files = sorted(post_path.glob("*.md"), reverse=True)
    
    for md_file in md_files:
        try:
            with open(md_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            frontmatter = extract_frontmatter(content)
            
            # Hanya tambahkan jika punya title dan date
            if 'title' in frontmatter and 'date' in frontmatter:
                post_data = {
                    "filename": md_file.name,
                    "title": frontmatter.get('title', 'Tanpa Judul'),
                    "type": frontmatter.get('type', 'berita'),
                    "date": frontmatter.get('date', ''),
                    "author": frontmatter.get('author', 'Admin'),
                    "image": frontmatter.get('image', '')
                }
                posts.append(post_data)
                print(f"[OK] Ditambahkan: {md_file.name}")
            else:
                print(f"[Skip] {md_file.name} - Tidak ada title atau date di frontmatter")
                
        except Exception as e:
            print(f"[Error] Gagal membaca {md_file.name}: {str(e)}")
    
    return posts

def save_posts(posts):
    """Simpan hasil scan ke JSON"""
    # Pastikan folder content ada
    output_path = Path(OUTPUT_FILE)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(posts, f, indent=2, ensure_ascii=False)
    
    print(f"[Success] Tersimpan {len(posts)} postingan ke {OUTPUT_FILE}")

def main():
    print("=" * 50)
    print("Memulai generate posts-index.json...")
    print("=" * 50)
    
    posts = scan_posts()
    save_posts(posts)
    
    print("=" * 50)
    print("Selesai!")
    print("=" * 50)

if __name__ == "__main__":
    main()
