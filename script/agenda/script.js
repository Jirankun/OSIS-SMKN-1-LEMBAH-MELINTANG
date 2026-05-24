// ================================================
// AGENDA PAGE SCRIPT
// ================================================
console.log('✅ Agenda script loaded');

let allAgenda = [];

// Init
document.addEventListener('DOMContentLoaded', async () => {
  console.log('✅ DOMContentLoaded');
  
  document.getElementById('year').textContent = new Date().getFullYear();
  
  renderNavbar();
  renderFooter(3);
  await loadAgendaIndex();
  initSearchFilter();
  initBackToTop();
  initScrollObserver();
  
  // Handle deep link: ?file=xxx.md
  const params = new URLSearchParams(window.location.search);
  const fileParam = params.get('file');
  if (fileParam) {
    console.log('📅 Loading from URL:', fileParam);
    await loadMarkdownContent(fileParam);
  }
});

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
    
    allAgenda = posts
      .filter(p => p.type?.toLowerCase() === 'agenda' && p.filename && p.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (!allAgenda.length) {
      list.innerHTML = emptyStateHTML('calendar', 'Belum ada agenda yang dijadwalkan.');
      return;
    }
    
    renderAgendaList(allAgenda);
    
  } catch (err) {
    console.error('❌ Error:', err);
    list.innerHTML = emptyStateHTML('error', 'Gagal memuat data agenda.');
  }
}

// Render List
function renderAgendaList(items) {
  const list = document.getElementById('agendaList');
  if (!list) return;
  
  list.innerHTML = items.map((item, i) => `
    <div class="agenda-item anim-stagger" data-filename="${item.filename}" style="animation-delay:${i * 50}ms">
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

// Load & Render Markdown
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
    
    // Auto-wrap tables for mobile scroll
    htmlContent = htmlContent.replace(/<table\b[^>]*>/gi, '<div class="table-wrapper"><table>').replace(/<\/table>/gi, '</table></div>');
    
    // Fix image paths
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
    const list = document.getElementById('agendaList');
    if (filtered.length === 0 && term && list) {
      list.innerHTML = emptyStateHTML('search', `Pencarian "${e.target.value}" tidak ditemukan. Coba kata kunci lain.`);
    }
  });
}

console.log('✅ Agenda script ready');
