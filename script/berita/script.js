// ================================================
// BERITA PAGE - FULL WORKING SCRIPT (FIXED YOUTUBE)
// ================================================

let allBerita = [];
var _beritaRenderCount = 0;
var _beritaPageSize = 12;

// Inisialisasi pageSize dari config
(function() {
  if (typeof SITE_CONFIG !== 'undefined' && SITE_CONFIG.site && SITE_CONFIG.site.postsPerPage) {
    _beritaPageSize = SITE_CONFIG.site.postsPerPage;
  }
})();

// Helper: Resolve image path from page/berita/ depth
function resolvePageImage(path) {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('//') || path.startsWith('/') || path.startsWith('.')) {
    return path;
  }
  return `../../${path}`;
}

// Helper: Resolve image path to absolute URL for OG tags (from page/berita/ depth)
function resolveImageForOG(path) {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('//')) {
    return path;
  }
  const baseUrl = window.location.origin;
  // Handle relative paths like ../../img/...
  if (path.startsWith('../../')) {
    return baseUrl + '/' + path.replace('../../', '');
  }
  // Handle paths like img/...
  if (path.startsWith('img/')) {
    return baseUrl + '/' + path;
  }
  return baseUrl + '/' + path;
}

// Init
document.addEventListener('DOMContentLoaded', async () => {
  
  document.getElementById('year').textContent = new Date().getFullYear();
  
  renderNavbar();
  renderFooter(3);
  await loadBeritaIndex();
  initMenuHistoryClear(); // Reset history saat navigasi menu
  initSearchFilter();
  initScrollObserver();
  
  // Handle URL ?file=xxx.md
  const params = new URLSearchParams(window.location.search);
  const fileParam = params.get('file');
  if (fileParam) {
    // Validasi: cek apakah file masih ada di allBerita
    const fileExists = allBerita.some(item => item.filename === fileParam);
    if (!fileExists) {
      // File tidak ada di index, hapus parameter dan tampilkan list biasa
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
      return;
    }
    await loadMarkdownContent(fileParam);
    // Tandai item yang aktif berdasarkan filename dari URL
    setTimeout(() => {
      const activeItem = document.querySelector(`.berita-item[data-filename="${fileParam}"]`);
      if (activeItem) {
        document.querySelectorAll('.berita-item').forEach(i => i.classList.remove('active'));
        activeItem.classList.add('active');
      }
    }, 100);
  }
});

// Fungsi untuk membersihkan URL jika ada parameter ?file= yang tidak valid
function cleanInvalidFileUrl() {
  const params = new URLSearchParams(window.location.search);
  const fileParam = params.get('file');
  
  if (!fileParam) return;
  
  // Cek apakah file masih ada di allBerita
  const fileExists = allBerita.some(item => item.filename === fileParam);
  if (!fileExists) {
    // File tidak ada, hapus parameter dari URL
    params.delete('file');
    const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
    window.history.replaceState({}, '', newUrl);
  }
}

// Load Berita Index
async function loadBeritaIndex() {
  const list = document.getElementById('beritaList');
  if (!list) return;
  
  list.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--gray-400)">Loading...</div>';
  
  try {
    const rawData = await fetchJsonSilent('../../content/posts-index.json', 'index berita');
    
    if (!rawData) {
      list.innerHTML = emptyStateHTML('news', 'Belum ada berita. Tim jurnalistik akan segera mengisi konten terbaru!');
      return;
    }
    
    let posts = Array.isArray(rawData) ? rawData : [rawData];
    
    allBerita = posts
      .filter(p => p.type?.toLowerCase() === 'berita' && p.filename && p.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (!allBerita.length) {
      list.innerHTML = emptyStateHTML('news', 'Belum ada berita yang dipublikasikan. Pantau terus website ini!');
      return;
    }
    
    renderBeritaList(allBerita);
    
  } catch (err) {
    list.innerHTML = emptyStateHTML('error', 'Gagal memuat daftar berita.');
  }
}

// Render List
function renderBeritaList(items) {
  const list = document.getElementById('beritaList');
  if (!list) return;
  _beritaRenderCount = _beritaPageSize;
  renderBeritaListPage(items);
}

// Render terbatas (paginated)
function renderBeritaListPage(items) {
  const list = document.getElementById('beritaList');
  if (!list) return;

  var count = Math.min(_beritaRenderCount, items.length);
  var visibleItems = items.slice(0, count);
  var hasMore = count < items.length;

  // Dapatkan filename yang sedang aktif dari URL
  const params = new URLSearchParams(window.location.search);
  const activeFile = params.get('file');

  list.innerHTML = visibleItems.map((item, i) => {
    const imgUrl = resolvePageImage(item.image);
    const isActive = item.filename === activeFile ? 'active' : '';
    const thumbHTML = imgUrl 
      ? `<img src="${imgUrl}" alt="${item.title}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">`
      : '';
    const placeholderHTML = `<div style="width:100%;height:100%;display:${imgUrl ? 'none' : 'flex'};align-items:center;justify-content:center;background:var(--gray-100);color:var(--gray-400)"><i class="fa-solid fa-file-lines"></i></div>`;
    
    return `
      <div class="berita-item ${isActive} anim-stagger" data-filename="${item.filename}" style="animation-delay:${i * 50}ms;cursor:pointer;background:var(--white);border-radius:var(--radius);padding:1rem;border:2px solid transparent;transition:var(--transition);display:flex;gap:0.75rem;align-items:flex-start">
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

  // Load More button
  var wrapper = list.parentElement.querySelector('.load-more-wrapper');
  if (!wrapper) {
    wrapper = document.createElement('div');
    wrapper.className = 'load-more-wrapper';
    list.parentElement.appendChild(wrapper);
  }
  
  if (hasMore) {
    wrapper.innerHTML = '<button class="load-more-btn" onclick="loadMoreBerita()"><i class="fa-solid fa-arrow-down"></i> Tampilkan Lebih Banyak (' + (items.length - count) + ' tersisa)</button>';
  } else {
    wrapper.innerHTML = '';
  }
  
  list.querySelectorAll('.berita-item').forEach(el => {
    el.addEventListener('click', async () => {
      const filename = el.dataset.filename;
      // Hapus active dari semua item, lalu tambahkan ke yang diklik
      list.querySelectorAll('.berita-item').forEach(i => i.classList.remove('active'));
      el.classList.add('active');
      
      await loadMarkdownContent(filename);
      const newUrl = `?file=${encodeURIComponent(filename)}`;
      window.history.pushState({ file: filename }, '', newUrl);
    });
  });
}

function loadMoreBerita() {
  _beritaRenderCount += _beritaPageSize;
  // Dapatkan filtered items
  const searchInput = document.getElementById('newsSearch');
  const term = searchInput ? searchInput.value.toLowerCase().trim() : '';
  var filtered = allBerita;
  if (term) {
    filtered = allBerita.filter(item => 
      (item.title?.toLowerCase() || '').includes(term) ||
      (item.author?.toLowerCase() || '').includes(term)
    );
  }
  renderBeritaListPage(filtered);
}

// Load & Render Markdown dengan Marked.js + YouTube Embed + Image Centering
async function loadMarkdownContent(filename) {
  const contentEl = document.getElementById('beritaContent');
  if (!contentEl) return;
  
  // Validasi: cek apakah file masih ada di allBerita
  const fileExists = allBerita.some(item => item.filename === filename);
  if (!fileExists) {
    contentEl.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--gray-400)">
      <i class="fa-solid fa-file-circle-xmark" style="font-size:2rem;margin-bottom:0.5rem;display:block"></i>
      <p>Berita tidak ditemukan atau telah dihapus.</p>
    </div>`;
    // Hapus parameter ?file= dari URL karena file tidak valid
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, '', cleanUrl);
    return;
  }
  
  // Validasi ekstensi file - HARUS .md
  if (!filename || !filename.toLowerCase().endsWith('.md')) {
    contentEl.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--danger)">
      <i class="fa-solid fa-file-circle-xmark" style="font-size:2rem;margin-bottom:0.5rem;display:block"></i>
      <p>File tidak valid. Hanya file (.md) yang diperbolehkan.</p>
    </div>`;
    return;
  }
  
  // Sanitasi filename untuk mencegah path traversal
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '');
  if (sanitizedFilename !== filename) {
  }
  
  contentEl.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--gray-400)">Loading content...</div>';
  
  try {
    const filePath = `../../post/${sanitizedFilename}`;
    
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
      throw new Error('File yang diambil adalah HTML, bukan Markdown. Hanya file .md yang didukung.');
    }
    
    if (typeof marked === 'undefined') throw new Error('marked.js not loaded');
    
    // Parse frontmatter DULUAN
    const fmMatch = mdText.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/m);
    let frontmatter = {};
    let body = mdText;
    
    if (fmMatch) {
      const [, yaml, content] = fmMatch;
      body = content; // body sekarang hanya isi konten tanpa frontmatter
      yaml.split('\n').forEach(line => {
        const kv = line.match(/^(\w+):\s*(.*)/);
        if (kv) frontmatter[kv[1].toLowerCase()] = kv[2].trim().replace(/^["']|["']$/g, '');
      });
    }
    
    // Render markdown DULU
    let htmlContent = marked.parse(body, {
      breaks: true,
      gfm: true,
      smartypants: false
    });
    
    // Replace YouTube LINK (<a> tag) SETELAH marked.parse()
    // marked.js mengubah URL YouTube menjadi <a href="...">...</a>
    const ytLinkRegex = /<a\s+(?:[^>]*?\s+)?href=["']https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})[^"']*["'][^>]*>(.*?)<\/a>/gi;
    htmlContent = htmlContent.replace(ytLinkRegex, (match, videoId, linkText) => {
      return `<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/${videoId}" title="YouTube video" allowfullscreen loading="lazy"></iframe></div>`;
    });
    
    // Wrap images & fix paths
    const imgRegex = /<img\s+([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi;
    htmlContent = htmlContent.replace(imgRegex, (match, before, src, after) => {
      let fixedSrc = src;
      if (!src.startsWith('http') && !src.startsWith('/')) fixedSrc = `../../${src}`;
      return `<div class="img-wrapper"><img ${before}src="${fixedSrc}"${after}></div>`;
    });
    
    // Hapus sisa link YouTube yang mungkin masih nempel (fallback jika regex utama gagal)
    htmlContent = htmlContent.replace(/<a[^>]*?href=["']https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}[^"']*["'][^>]*?>[^<]*?<\/a>/gi, '');
    
    // ✅ Wrap tables for mobile horizontal scroll (overflow protection)
    htmlContent = htmlContent.replace(/<table\b[^>]*>/gi, '<div class="table-wrapper"><table>').replace(/<\/table>/gi, '<\/table><\/div>');
    
    // Render layout
    contentEl.innerHTML = `
      <div style="border-bottom:2px solid var(--gray-100);padding-bottom:1.5rem;margin-bottom:2rem">
        <h2 style="font-family:var(--font-display);font-size:1.8rem;color:var(--gray-900);margin-bottom:0.75rem;line-height:1.3">${frontmatter.title || 'Tanpa Judul'}</h2>
        <div style="display:flex;gap:1.5rem;flex-wrap:wrap;color:var(--gray-500);font-size:0.85rem">
          <span style="display:flex;align-items:center;gap:0.4rem"><i class="fa-regular fa-calendar" style="color:var(--primary)"></i>${formatDateID(frontmatter.date)}</span>
          <span style="display:flex;align-items:center;gap:0.4rem"><i class="fa-solid fa-user" style="color:var(--primary)"></i>${frontmatter.author || 'Admin'}</span>
        </div>
        ${frontmatter.image ? `<img src="${resolvePageImage(frontmatter.image)}" alt="${frontmatter.title}" style="width:100%;max-height:400px;object-fit:cover;border-radius:var(--radius);margin-top:1rem;box-shadow:var(--shadow)" onerror="this.style.display='none'">` : ''}
      </div>
      <div class="markdown-body">${htmlContent}</div>
    `;
    
    // ✅ Update Open Graph tags dynamically dengan judul, deskripsi, DAN GAMBAR dari MD
    const ogDescription = frontmatter.description || body.substring(0, 160).replace(/[#*`]/g, '').trim();
    const ogImage = frontmatter.image ? resolveImageForOG(frontmatter.image) : null; // Resolve gambar ke absolute URL
    if (typeof updateOpenGraphTags === 'function') {
      updateOpenGraphTags(frontmatter.title, ogDescription, ogImage);
    }
    
    // ✅ TAMBAHKAN CANONICAL URL & STRUCTURED DATA SAAT KONTEN DIMUAT
    // Ini backup jika script di head belum selesai load
    const pubDate = frontmatter.date || new Date().toISOString().split('T')[0];
    const authorName = frontmatter.author || 'Admin OSIS';
    const canonicalUrl = window.location.href.split('?')[0] + '?file=' + encodeURIComponent(filename);
    
    // Tambah canonical link jika belum ada
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);
    
    // Structured data untuk SEO
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": frontmatter.title || 'Tanpa Judul',
      "description": ogDescription,
      "datePublished": pubDate,
      "dateModified": pubDate,
      "author": {
        "@type": "Person",
        "name": authorName
      },
      "publisher": {
        "@type": "Organization",
        "name": "OSIS SMKN 1 LEMBAH MELINTANG",
        "logo": {
          "@type": "ImageObject",
          "url": resolvePageImage('img/asset/logo.webp')
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": canonicalUrl
      },
      "url": canonicalUrl
    };
    
    const oldScript = document.getElementById('news-article-schema');
    if (oldScript) oldScript.remove();
    
    const schemaScript = document.createElement('script');
    schemaScript.type = 'application/ld+json';
    schemaScript.id = 'news-article-schema';
    schemaScript.textContent = JSON.stringify(structuredData);
    document.head.appendChild(schemaScript);
    
    // Update title browser
    document.title = (frontmatter.title || 'Berita') + ' - Berita OSIS SMKN 1 LEMBAH MELINTANG';
    
    // Init lightbox untuk gambar di konten
    initContentLightbox();
    
    
  } catch (err) {
    contentEl.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--gray-400)">
      <i class="fa-solid fa-file-circle-xmark" style="font-size:2rem;margin-bottom:0.5rem;display:block"></i>
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
  const searchInput = document.getElementById('newsSearch');
  if (!searchInput) return;
  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    const filtered = allBerita.filter(item => 
      (item.title?.toLowerCase() || '').includes(term) ||
      (item.author?.toLowerCase() || '').includes(term)
    );
    renderBeritaList(filtered);
    const list = document.getElementById('beritaList');
    if (filtered.length === 0 && term && list) {
      list.innerHTML = emptyStateHTML('search', 'Pencarian "' + e.target.value + '" tidak ditemukan. Coba kata kunci lain.');
    }
  });
}

// Lightbox untuk gambar di konten Berita
function initContentLightbox() {
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightboxImg');
  const contentEl = document.getElementById('beritaContent');
  if (!lb || !lbImg || !contentEl) return;

  // Delegate click pada img-wrapper di dalam markdown-body
  const markdownBody = contentEl.querySelector('.markdown-body');
  if (!markdownBody) return;

  markdownBody.addEventListener('click', (e) => {
    const imgWrapper = e.target.closest('.img-wrapper');
    if (!imgWrapper) return;
    const img = imgWrapper.querySelector('img');
    if (img && img.src) {
      lbImg.src = img.src;
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  });

  const close = () => { 
    lb.classList.remove('open'); 
    document.body.style.overflow = '';
  };
  
  document.getElementById('lightboxClose')?.addEventListener('click', close);
  lb.addEventListener('click', e => { if(e.target === lb) close(); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape') close(); });
}

