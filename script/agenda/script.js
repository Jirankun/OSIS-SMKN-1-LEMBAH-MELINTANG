// ================================================
// AGENDA PAGE SCRIPT
// ================================================
console.log('✅ Agenda script loaded');

const SITE_CONFIG = {
  school: {
    name: "SMKN 1 LEMBAH MELINTANG",
    osis: "OSIS SMKN 1 LEMBAH MELINTANG",
    tagline: "Unggul dalam Prestasi, Berkarakter Mulia",
    logo: "../../img/asset/logo.webp",
  },
  nav: [
    { label: "Beranda", href: "../../index.html", icon: "fa-solid fa-house" },
    { label: "Berita", href: "../berita/index.html", icon: "fa-solid fa-newspaper" },
    { label: "Pengumuman", href: "../pengumuman/index.html", icon: "fa-solid fa-bullhorn" },
    { label: "Agenda", href: "index.html", icon: "fa-solid fa-calendar-days" },
    { label: "Galeri", href: "../galeri/index.html", icon: "fa-solid fa-images" },
    { label: "Anggota dan Divisi", href: "../profil_osis/index.html", icon: "fa-solid fa-users" },
    { label: "Kontak", href: "../../index.html#kontak", icon: "fa-solid fa-envelope" },
  ]
};

let allAgenda = [];

// Helper: Format tanggal Indonesia
function formatDateID(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('id-ID', { 
    day: 'numeric', month: 'long', year: 'numeric' 
  });
}

// Init
document.addEventListener('DOMContentLoaded', async () => {
  console.log('✅ DOMContentLoaded');
  
  document.getElementById('year').textContent = new Date().getFullYear();
  
  initNavbar();
  renderStaticSections();
  await loadAgendaIndex();
  initSearchFilter();
  
  // Handle deep link: ?file=xxx.md
  const params = new URLSearchParams(window.location.search);
  const fileParam = params.get('file');
  if (fileParam) {
    console.log('📅 Loading from URL:', fileParam);
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
  
  if (nav) window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 50));
  if (ham && mobile) {
    ham.addEventListener('click', () => {
      const isOpen = ham.classList.toggle('open');
      mobile.classList.toggle('open');
      ham.setAttribute('aria-expanded', isOpen);
    });
    mobile.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => { ham.classList.remove('open'); mobile.classList.remove('open'); });
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

// Load Agenda Index
async function loadAgendaIndex() {
  console.log('🔧 Loading agenda index...');
  const list = document.getElementById('agendaList');
  if (!list) return;
  
  list.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--gray-400)">Loading...</div>';
  
  try {
    const res = await fetch('../../content/posts-index.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const rawData = await res.json();
    let posts = Array.isArray(rawData) ? rawData : [rawData];
    
    // ✅ Filter hanya type agenda
    allAgenda = posts
      .filter(p => p.type?.toLowerCase() === 'agenda' && p.filename && p.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (!allAgenda.length) {
      list.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--gray-400)">Belum ada agenda yang dijadwalkan.</div>';
      return;
    }
    
    renderAgendaList(allAgenda);
    
  } catch (err) {
    console.error('❌ Error:', err);
    list.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--danger)">Gagal memuat data agenda.</div>`;
  }
}

// Render List
function renderAgendaList(items) {
  const list = document.getElementById('agendaList');
  if (!list) return;
  
  list.innerHTML = items.map((item, i) => `
    <div class="agenda-item" data-filename="${item.filename}" style="animation-delay:${i * 30}ms">
      <div class="agenda-item__content">
        <div class="agenda-item__title">${item.title || 'Tanpa Judul'}</div>
        <div class="agenda-item__meta">
          <span><i class="fa-regular fa-calendar"></i> ${formatDateID(item.date)}</span>
          <span>•</span>
          <span>${item.author || 'Admin'}</span>
        </div>
      </div>
    </div>
  `).join('');
  
  list.querySelectorAll('.agenda-item').forEach(el => {
    el.addEventListener('click', async () => {
      const filename = el.dataset.filename;
      list.querySelectorAll('.agenda-item').forEach(i => i.classList.remove('active'));
      el.classList.add('active');
      
      await loadMarkdownContent(filename);
      const newUrl = `?file=${encodeURIComponent(filename)}`;
      window.history.pushState({ file: filename }, '', newUrl);
    });
  });
}

// Load & Render Markdown (No Video, Table Optimized)
async function loadMarkdownContent(filename) {
  console.log('🔧 Loading markdown:', filename);
  const contentEl = document.getElementById('agendaContent');
  if (!contentEl) return;
  
  contentEl.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--gray-400)">Loading content...</div>';
  
  try {
    const res = await fetch(`../../post/${filename}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
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
    let htmlContent = marked.parse(body, { breaks: true, gfm: true });
    
    // ✅ Auto-wrap tables for mobile scroll
    htmlContent = htmlContent.replace(/<table\b[^>]*>/gi, '<div class="table-wrapper"><table>').replace(/<\/table>/gi, '</table></div>');
    
    // ✅ Fix image paths
    const imgRegex = /<img\s+([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi;
    htmlContent = htmlContent.replace(imgRegex, (match, before, src, after) => {
      let fixedSrc = src;
      if (!src.startsWith('http') && !src.startsWith('/')) fixedSrc = `../../${src}`;
      return `<div class="img-wrapper"><img ${before}src="${fixedSrc}"${after}></div>`;
    });
    
    // Render layout
    contentEl.innerHTML = `
      <div style="border-bottom:2px solid var(--gray-100);padding-bottom:1.5rem;margin-bottom:2rem">
        <h1 style="font-family:var(--font-display);font-size:1.8rem;color:var(--gray-900);margin-bottom:0.75rem;line-height:1.3">${frontmatter.title || 'Tanpa Judul'}</h1>
        <div style="display:flex;gap:1.5rem;flex-wrap:wrap;color:var(--gray-500);font-size:0.85rem">
          <span style="display:flex;align-items:center;gap:0.4rem"><i class="fa-regular fa-calendar" style="color:var(--primary)"></i>${formatDateID(frontmatter.date)}</span>
          <span style="display:flex;align-items:center;gap:0.4rem"><i class="fa-solid fa-user" style="color:var(--primary)"></i>${frontmatter.author || 'Admin'}</span>
        </div>
      </div>
      <div class="agenda-body">${htmlContent}</div>
    `;
    
    console.log('✅ Content rendered successfully');
    
  } catch (err) {
    console.error('❌ Error loading markdown:', err);
    contentEl.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--danger)">
      <i class="fa-solid fa-triangle-exclamation" style="font-size:2rem;margin-bottom:0.5rem;display:block"></i>
      <p>Gagal memuat konten: ${err.message}</p>
    </div>`;
  }
}

// Search
function initSearchFilter() {
  const searchInput = document.getElementById('agendaSearch');
  if (!searchInput) return;
  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    const filtered = allAgenda.filter(item => 
      (item.title?.toLowerCase() || '').includes(term) ||
      (item.author?.toLowerCase() || '').includes(term)
    );
    renderAgendaList(filtered);
  });
}

// Back to Top
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.style.display = window.scrollY > 400 ? 'flex' : 'none';
  });
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

console.log('✅ Agenda script ready');