#!/usr/bin/env python3
"""
Script untuk generate posts-index.json dari file markdown di folder post/
Dijalankan otomatis oleh GitHub Actions saat ada perubahan di folder post/

Alur:
  1. Scan semua file .md di folder post/
  2. Extract frontmatter (metadata) + body (konten markdown tanpa frontmatter)
  3. Generate description dari body (strip markdown syntax)
  4. Simpan semua ke content/posts-index.json
"""

import os
import json
import re
from pathlib import Path

# Konfigurasi path
POST_FOLDER = "post"
OUTPUT_FILE = "content/posts-index.json"


def extract_frontmatter(content):
    """Extract metadata dari frontmatter YAML"""
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


def extract_body(content):
    """
    Extract body markdown (tanpa frontmatter).
    Jika tidak ada frontmatter, seluruh konten dianggap body.
    """
    match = re.match(r'^---\s*\n.*?\n---\s*\n', content, re.DOTALL)
    if match:
        return content[match.end():]
    return content


def generate_description(body):
    """
    Generate SEO description dari body markdown.
    - Strip markdown syntax: # * ` [] >
    - Strip HTML tags
    - Strip URLs
    - Normalize whitespace
    - Limit 160 karakter
    """
    text = body
    # Hapus markdown image: ![alt](url)
    text = re.sub(r'!\[.*?\]\(.*?\)', '', text)
    # Hapus markdown link: [text](url)
    text = re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', text)
    # Hapus markdown formatting
    text = re.sub(r'[#*`>_~]', '', text)
    # Hapus HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Hapus URLs bare
    text = re.sub(r'https?://\S+', '', text)
    # Hapus garis pemisah
    text = re.sub(r'^[-*_]{3,}\s*$', '', text, flags=re.MULTILINE)
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    # Limit 160 chars, potong di akhir kata jika perlu
    if len(text) > 160:
        text = text[:157].rsplit(' ', 1)[0] + '...'
    return text[:160] if text else ''


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
            body = extract_body(content)
            description = frontmatter.get(
                'description',
                generate_description(body)
            )
            
            # Hanya tambahkan jika punya title dan date
            if 'title' in frontmatter and 'date' in frontmatter:
                post_data = {
                    "filename": md_file.name,
                    "title": frontmatter.get('title', 'Tanpa Judul'),
                    "type": frontmatter.get('type', 'berita'),
                    "date": frontmatter.get('date', ''),
                    "author": frontmatter.get('author', 'Admin'),
                    "image": frontmatter.get('image', ''),
                    "description": description,
                    "body": body.strip()
                }
                posts.append(post_data)
                print(f"[OK] Ditambahkan: {md_file.name} ({len(body)} chars)")
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
    
    print(f"Total: {len(posts)} postingan")
    print("=" * 50)
    print("Selesai!")
    print("=" * 50)


if __name__ == "__main__":
    main()
