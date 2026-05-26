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
  
  // Validasi ekstensi file - HARUS .md
  if (!filename || !filename.toLowerCase().endsWith('.md')) {
    console.error('[Agenda] Invalid file extension:', filename);
    contentEl.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--danger)">
      <i class="fa-solid fa-file-circle-xmark" style="font-size:2rem;margin-bottom:0.5rem;display:block"></i>
      <p>File tidak valid. Hanya file (.md) yang diperbolehkan.</p>
    </div>`;
    return;
  }
  
  // Sanitasi filename untuk mencegah path traversal
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '');
  if (sanitizedFilename !== filename) {
    console.warn('[Agenda] Filename contained invalid characters, sanitized:', filename, '->', sanitizedFilename);
  }
  
  contentEl.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--gray-400)">Loading content...</div>';
  
  try {
    const filePath = `../../post/${sanitizedFilename}`;
    console.log('[Agenda] Fetching:', filePath);
    
    const res = await fetch(filePath);
    
    // Cek apakah file ditemukan
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('File tidak ditemukan (404). Pastikan nama file benar dan file ada di folder /post/');
      } else if (res.status >= 500) {
        throw new Error(`Server error (${res.status}). Coba lagi nanti.`);
      } else {
        throw new Error(`HTTP ${res.status}: Gagal mengambil file.`);
      }
    }
    
    const mdText = await res.text();
    
    // Validasi konten - pastikan ini adalah file markdown, bukan HTML
    const trimmedContent = mdText.trim().toLowerCase();
    if (trimmedContent.startsWith('<!doctype') || trimmedContent.startsWith('<html')) {
      console.error('[Agenda] File is HTML, not markdown:', sanitizedFilename);
      throw new Error('File yang diambil adalah HTML, bukan Markdown. Hanya file .md yang didukung.');
    }
    
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
    
    // ✅ YouTube Embed - Convert links to iframes
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;
    htmlContent = htmlContent.replace(youtubeRegex, (match, videoId) => {
      return `<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div>`;
    });
    
    // Remove any remaining YouTube links that were converted
    htmlContent = htmlContent.replace(/<p>.*?(https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)[^\s<]*).*?<\/p>/g, (match) => {
      return match.replace(/https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)[^\s<]*/g, '');
    });
    
    // Auto-wrap tables for mobile scroll
    htmlContent = htmlContent.replace(/<table\b[^>]*>/gi, '<div class="table-wrapper"><table>').replace(/<\/table>/gi, '</table></div>');
    
    // Fix image paths and add click-to-zoom
    const imgRegex = /<img\s+([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi;
    htmlContent = htmlContent.replace(imgRegex, (match, before, src, after) => {
      let fixedSrc = src;
      if (!src.startsWith('http') && !src.startsWith('/')) fixedSrc = `../../${src}`;
      return `<div class="img-wrapper" onclick="openLightbox('${fixedSrc}')"><img ${before}src="${fixedSrc}"${after}></div>`;
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
    contentEl.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--gray-400)">
      <i class="fa-solid fa-triangle-exclamation" style="font-size:2rem;margin-bottom:0.5rem;display:block"></i>
      <p><strong>Gagal memuat konten:</strong></p>
      <p style="color:var(--danger);font-size:0.9rem;margin-top:0.5rem">${err.message}</p>
      <p style="margin-top:1rem;font-size:0.85rem">Pastikan:</p>
      <ul style="text-align:left;display:inline-block;font-size:0.85rem;color:var(--gray-500)">
        <li>File berekstensi .md</li>
        <li>File ada di folder <code>/post/</code></li>
        <li>Nama file sesuai dengan yang terdaftar di index</li>
      </ul>
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

// ✅ Lightbox for images
function openLightbox(src) {
  const lightbox = document.createElement('div');
  lightbox.id = 'lightbox';
  lightbox.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);display:flex;justify-content:center;align-items:center;z-index:9999;opacity:0;transition:opacity 0.3s;';
  lightbox.innerHTML = `
    <span onclick="closeLightbox()" style="position:absolute;top:20px;right:30px;color:white;font-size:2.5rem;cursor:pointer;">&times;</span>
    <img src="${src}" style="max-width:90%;max-height:90%;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.5);">
  `;
  document.body.appendChild(lightbox);
  setTimeout(() => lightbox.style.opacity = '1', 10);
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    lightbox.style.opacity = '0';
    setTimeout(() => lightbox.remove(), 300);
  }
}

console.log('✅ Agenda script ready');
