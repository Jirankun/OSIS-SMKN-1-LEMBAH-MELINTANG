#!/usr/bin/env python3
"""
Update sitemap.xml with the latest modification date.
Uses the most recent commit date from git history.
"""

import subprocess
import xml.etree.ElementTree as ET
from datetime import datetime
import os

def get_latest_commit_date():
    """Get the latest commit date from git."""
    try:
        result = subprocess.run(
            ['git', 'log', '-1', '--format=%ci'],
            capture_output=True,
            text=True,
            check=True
        )
        commit_date_str = result.stdout.strip()
        # Parse git date format: "2025-06-11 14:30:00 +0000"
        dt = datetime.strptime(commit_date_str.split()[0], '%Y-%m-%d')
        return dt.strftime('%Y-%m-%d')
    except subprocess.CalledProcessError:
        # Fallback to current date if git command fails
        return datetime.now().strftime('%Y-%m-%d')

def update_sitemap(sitemap_path='sitemap.xml'):
    """Update sitemap.xml with the latest modification date."""
    
    # Get latest date
    lastmod_date = get_latest_commit_date()
    
    # Read and parse existing sitemap
    with open(sitemap_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple string replacement to preserve original format
    import re
    # Check if lastmod exists
    if '<lastmod>' in content:
        # Update existing lastmod
        content = re.sub(
            r'<lastmod>[0-9]{4}-[0-9]{2}-[0-9]{2}</lastmod>',
            f'<lastmod>{lastmod_date}</lastmod>',
            content
        )
    else:
        # Add lastmod after loc tag
        content = content.replace(
            '</loc>',
            f'</loc>\n    <lastmod>{lastmod_date}</lastmod>'
        )
    
    # Write back
    with open(sitemap_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Updated sitemap.xml with lastmod: {lastmod_date}")

if __name__ == '__main__':
    # Change to script directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)) or '.')
    update_sitemap()
