import os, json, re

POSTS_DIR = "post"
OUTPUT    = "content/posts-index.json"

def parse_frontmatter(text):
    match = re.match(r"^---\s*\n(.*?)\n---", text, re.DOTALL)
    if not match:
        return {}
    fm = {}
    for line in match.group(1).splitlines():
        if ":" in line:
            key, _, val = line.partition(":")
            fm[key.strip()] = val.strip().strip('"\'')
    return fm

posts = []
for filename in sorted(os.listdir(POSTS_DIR), reverse=True):
    if not filename.endswith(".md"):
        continue
    with open(os.path.join(POSTS_DIR, filename), encoding="utf-8") as f:
        fm = parse_frontmatter(f.read())
    posts.append({
        "filename": filename,
        "title":    fm.get("title", ""),
        "type":     fm.get("type", ""),
        "date":     fm.get("date", ""),
        "author":   fm.get("author", ""),
        "image":    fm.get("image", ""),
    })

os.makedirs("content", exist_ok=True)
with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(posts, f, ensure_ascii=False, indent=2)

print(f"✅ {len(posts)} posts → {OUTPUT}")
