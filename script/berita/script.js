// ================================================
// BERITA PAGE - FULL WORKING SCRIPT
// ================================================
console.log('✅ Berita script loaded');

const SITE_CONFIG = {
  school: {
    name: "SMKN 1 LEMBAH MELINTANG",
    osis: "OSIS SMKN 1 LEMBAH MELINTANG",
    tagline: "Unggul dalam Prestasi, Berkarakter Mulia",
    logo: "../../img/asset/logo.webp",
  },
  nav: [
    { label: "Beranda", href: "../../index.html", icon: "fa-solid fa-house" },
    { label: "Berita", href: "index.html", icon: "fa-solid fa-newspaper" },
    { label: "Pengumuman", href: "../pengumuman/index.html", icon: "fa-solid fa-bullhorn" },
    { label: "Agenda", href: "../agenda/index.html", icon: "fa-solid fa-calendar-days" },
    { label: "Galeri", href: "../galeri/index.html", icon: "fa-solid fa-images" },
    { label: "Anggota dan Divisi", href: "../profil_osis/index.html", icon: "fa-solid fa-users" },
    { label: "Kontak", href: "../../index.html#kontak", icon: "fa-solid fa-envelope" },
  ]
};

let allBerita = [];

// Helper: Format tanggal Indonesia
function formatDateID(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('id-ID', { 
    day: 'numeric', month: 'long', year: 'numeric' 
  });
}

/**
 * Fetch JSON dengan error handling silent (hanya log di console)
 */
async function fetchJsonSilent(url, description = 'data') {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`[Fetch] Gagal mengambil ${description} dari ${url}:`, err.message);
    return null;
  }
}

// Init
document.addEventListener('DOMContentLoaded', async () => {
  console.log('✅ DOMContentLoaded');
  
  document.getElementById('year').textContent = new Date().getFullYear();
  
  initNavbar();
  renderStaticSections();
  await loadBeritaIndex();
  initSearchFilter();
  
  // Handle URL ?file=xxx.md
  const params = new URLSearchParams(window.location.search);
  const fileParam = params.get('file');
  if (fileParam) {
    console.log('📄 Loading from URL:', fileParam);
    await loadMarkdownContent(fileParam);
  }
});

// Navbar
function initNavbar() {
  const linksContainer = document.getElementById('navLinks');
  const mobile = document.getElementById('mobileMenu');
  const ham = document.getElementById('hamburger');
  const nav = document.getElementById('navbar');
  
  const currentPath = window.location.pathname.replace(/\/+/g, '/').toLowerCase();
  const isRoot = !currentPath.includes('/page/');
  
  const isLinkActive = (href) => {
    if (href.includes('#')) return isRoot && window.location.hash === href;
    if (href === '#' || (href.includes('index.html') && !href.includes('/page/'))) return isRoot;
    const match = href.match(/\/([^\/]+)\/index\.html$/);
    if (match) return currentPath.includes(`/${match[1].toLowerCase()}/`);
    return false;
  };
  
  if (linksContainer) {
    linksContainer.innerHTML = SITE_CONFIG.nav.map(l => {
      const activeClass = isLinkActive(l.href) ? ' active' : '';
      return `<a href="${l.href}" class="navbar__link${activeClass}"><i class="${l.icon}"></i> ${l.label}</a>`;
    }).join('');
  }
  
  if (mobile) {
    mobile.innerHTML = SITE_CONFIG.nav.map(l => {
      const activeClass = isLinkActive(l.href) ? ' active' : '';
      return `<a href="${l.href}" class="navbar__mobile-link${activeClass}"><i class="${l.icon}"></i> ${l.label}</a>`;
    }).join('');
  }
  
  if (nav) {
    window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 50));
  }
  
  if (ham && mobile) {
    ham.addEventListener('click', () => {
      const isOpen = ham.classList.toggle('open');
      mobile.classList.toggle('open');
      ham.setAttribute('aria-expanded', isOpen);
    });
    mobile.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        ham.classList.remove('open');
        mobile.classList.remove('open');
      });
    });
  }
}

// Footer
function renderStaticSections() {
  const footerBrand = document.getElementById('footerBrand');
  const footerDesc = document.getElementById('footerDesc');
  const footerLinks = document.getElementById('footerLinks');
  
  if (footerBrand) footerBrand.textContent = SITE_CONFIG.school.osis;
  if (footerDesc) footerDesc.textContent = SITE_CONFIG.school.tagline;
  if (footerLinks) {
    footerLinks.innerHTML = SITE_CONFIG.nav.slice(0, 3).map(n => 
      `<li><a href="${n.href}" class="footer__link">${n.label}</a></li>`
    ).join('');
  }
}

// Load Berita Index
async function loadBeritaIndex() {
  console.log('🔧 Loading berita index...');
  const list = document.getElementById('beritaList');
  if (!list) return;
  
  list.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--gray-400)">Loading...</div>';
  
  try {
    const rawData = await fetchJsonSilent('../../content/posts-index.json', 'index berita');
    
    if (!rawData) {
      list.style.display = 'none';
      console.log('[Berita] Tidak ada data berita.');
      return;
    }
    
    let posts = Array.isArray(rawData) ? rawData : [rawData];
    
    allBerita = posts
      .filter(p => p.type?.toLowerCase() === 'berita' && p.filename && p.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (!allBerita.length) {
      list.style.display = 'none';
      console.log('[Berita] Tidak ada berita untuk ditampilkan.');
      return;
    }
    
    renderBeritaList(allBerita);
    
  } catch (err) {
    console.error('[Berita] Error:', err);
    list.style.display = 'none';
  }
}

// Render List
function renderBeritaList(items) {
  const list = document.getElementById('beritaList');
  if (!list) return;
  
  list.innerHTML = items.map((item, i) => {
    const imgUrl = item.image;
    const thumbHTML = imgUrl 
      ? `<img src="../../${imgUrl}" alt="${item.title}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">`
      : '';
    const placeholderHTML = `<div style="width:100%;height:100%;display:${imgUrl ? 'none' : 'flex'};align-items:center;justify-content:center;background:var(--gray-100);color:var(--gray-400)"><i class="fa-solid fa-file-lines"></i></div>`;
    
    return `
      <div class="berita-item" data-filename="${item.filename}" style="animation-delay:${i * 30}ms;cursor:pointer;background:var(--white);border-radius:var(--radius);padding:1rem;border:2px solid transparent;transition:var(--transition);display:flex;gap:0.75rem;align-items:flex-start">
        <div style="flex-shrink:0;width:60px;height:60px;border-radius:var(--radius);overflow:hidden;background:var(--gray-100)">
          ${thumbHTML}
          ${placeholderHTML}
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-size:0.9rem;font-weight:700;color:var(--gray-800);margin-bottom:0.25rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.4">${item.title || 'Tanpa Judul'}</div>
          <div style="font-size:0.72rem;color:var(--gray-400);display:flex;align-items:center;gap:0.5rem">
            <span><i class="fa-regular fa-calendar"></i> ${formatDateID(item.date)}</span>
            <span>•</span>
            <span>${item.author || 'Admin'}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  list.querySelectorAll('.berita-item').forEach(el => {
    el.addEventListener('click', async () => {
      const filename = el.dataset.filename;
      list.querySelectorAll('.berita-item').forEach(i => i.style.borderColor = 'transparent');
      el.style.borderColor = 'var(--primary)';
      
      await loadMarkdownContent(filename);
      const newUrl = `?file=${encodeURIComponent(filename)}`;
      window.history.pushState({ file: filename }, '', newUrl);
    });
  });
}

// Load & Render Markdown dengan Marked.js + YouTube Embed + Image Centering
async function loadMarkdownContent(filename) {
  console.log('🔧 Loading markdown:', filename);
  const contentEl = document.getElementById('beritaContent');
  if (!contentEl) return;
  
  contentEl.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--gray-400)">Loading content...</div>';
  
  try {
    const res = await fetch(`../../post/${filename}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    
    const mdText = await res.text();
    
    if (typeof marked === 'undefined') throw new Error('marked.js not loaded');
    
    // Parse frontmatter
    const match = mdText.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/m);
    let frontmatter = {};
    let body = mdText;
    
    if (match) {
      const [, yaml, content] = match;
      body = content;
      yaml.split('\n').forEach(line => {
        const kv = line.match(/^(\w+):\s*(.*)/);
        if (kv) frontmatter[kv[1].toLowerCase()] = kv[2].trim().replace(/^["']|["']$/g, '');
      });
    }
    
    // Render markdown
    let htmlContent = marked.parse(body);
    
    // ✅ AUTO EMBED YOUTUBE
    const ytRegex = /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;
    htmlContent = htmlContent.replace(ytRegex, (_, id) => `
      <div class="video-wrapper">
        <iframe src="https://www.youtube.com/embed/${id}" title="YouTube video" allowfullscreen loading="lazy"></iframe>
      </div>
    `);
    
    // ✅ WRAP IMAGES & FIX PATHS
    const imgRegex = /<img\s+([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi;
    htmlContent = htmlContent.replace(imgRegex, (match, before, src, after) => {
      let fixedSrc = src;
      if (!src.startsWith('http') && !src.startsWith('/')) fixedSrc = `../../${src}`;
      return `<div class="img-wrapper"><img ${before}src="${fixedSrc}"${after}></div>`;
    });
    
    // Render layout: Frontmatter DI LUAR, Content DI DALAM
    contentEl.innerHTML = `
      <div style="border-bottom:2px solid var(--gray-100);padding-bottom:1.5rem;margin-bottom:2rem">
        <h1 style="font-family:var(--font-display);font-size:1.8rem;color:var(--gray-900);margin-bottom:0.75rem;line-height:1.3">${frontmatter.title || 'Tanpa Judul'}</h1>
        <div style="display:flex;gap:1.5rem;flex-wrap:wrap;color:var(--gray-500);font-size:0.85rem">
          <span style="display:flex;align-items:center;gap:0.4rem"><i class="fa-regular fa-calendar" style="color:var(--primary)"></i>${formatDateID(frontmatter.date)}</span>
          <span style="display:flex;align-items:center;gap:0.4rem"><i class="fa-solid fa-user" style="color:var(--primary)"></i>${frontmatter.author || 'Admin'}</span>
        </div>
        ${frontmatter.image ? `<img src="../../${frontmatter.image}" alt="${frontmatter.title}" style="width:100%;max-height:400px;object-fit:cover;border-radius:var(--radius);margin-top:1rem;box-shadow:var(--shadow)" onerror="this.style.display='none'">` : ''}
      </div>
      <div class="markdown-body">${htmlContent}</div>
    `;
    
    console.log('✅ Content rendered successfully');
    
  } catch (err) {
    console.error('[Berita] Error loading markdown:', err);
    contentEl.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--gray-400)">
      <i class="fa-solid fa-file-circle-xmark" style="font-size:2rem;margin-bottom:0.5rem;display:block"></i>
      <p>Konten tidak ditemukan atau telah dihapus.</p>
    </div>`;
  }
}

// Search
function initSearchFilter() {
  const searchInput = document.getElementById('newsSearch');
  if (!searchInput) return;
  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    const filtered = allBerita.filter(item => 
      (item.title?.toLowerCase() || '').includes(term) ||
      (item.author?.toLowerCase() || '').includes(term)
    );
    renderBeritaList(filtered);
  });
}

console.log('✅ Script ready');