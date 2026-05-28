// ================================================
// HOME PAGE - Beranda
// ================================================

// ================================================
// SPLASH SCREEN HANDLER
// ================================================
function initSplashScreen() {
  const splash = document.getElementById('splashScreen');
  if (!splash) return;
  
  // Splash akan otomatis hilang setelah animasi CSS selesai (4s delay + 1s fade out)
  // Kita tambahkan cleanup untuk memastikan elemen dihapus dari DOM
  setTimeout(() => {
    if (splash) {
      splash.style.display = 'none';
      // Optional: hapus dari DOM setelah animasi selesai
      // splash.remove();
    }
  }, 5200); // Total durasi: 4s delay + 1s fade + buffer 0.2s
}

// ================================================
// CORE INIT
// ================================================
document.addEventListener('DOMContentLoaded', () => {
  initSplashScreen();
  initNotificationPopup();
  renderNavbar();
  initConfig();
  renderFooter(4);
  loadHomeContent();
  loadGallery();
  loadTeamInti();
  initScrollObserverCustom();
  initBackToTop();
  initLightboxGaleri();
  initLightboxModal();
});

function initConfig() {
  document.getElementById('heroSubtitle').textContent = SITE_CONFIG.school.tagline;
  document.getElementById('year').textContent = new Date().getFullYear();
  document.title = SITE_CONFIG.school.osis;
  
  const heroBg = document.getElementById('heroBg');
  const heroVideo = document.getElementById('heroVideo');
  const heroSource = heroVideo?.querySelector('source');
  
  // Reset dulu, bre
  heroBg.classList.remove('video-active');
  
  // Cek tipe media, bre
  if (SITE_CONFIG.school.heroType === 'video' && SITE_CONFIG.school.heroBg) {
    // MODE VIDEO, JING! 🎬
    if (heroSource) {
      heroSource.src = SITE_CONFIG.school.heroBg;
      heroVideo.load();
      heroVideo.play().catch(err => {
        // Fallback ke image kalo autoplay diblokir browser
        heroBg.style.backgroundImage = `url('${SITE_CONFIG.school.heroBg.replace('.mp4', '.jpeg')}')`;
      });
    }
    heroBg.classList.add('video-active');
  } else {
    heroBg.classList.remove('video-active'); // ← WAJIB, bre!
    // MODE IMAGE DEFAULT, BRE! 🖼️
    if (SITE_CONFIG.school.heroBg) {
      heroBg.style.backgroundImage = `url('${SITE_CONFIG.school.heroBg}')`;
    }
    // Pause video kalo ada, biar gak makan resource
    if (heroVideo) {
      heroVideo.pause();
      heroVideo.removeAttribute('src');
    }
  }
}

// ================================================
// FETCH CONTENT - Home (posts-index.json), Gallery & Team Inti
// ================================================

function filterRecentPosts(posts) {
  const now = new Date();
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(now.getMonth() - 2);
  
  return posts.filter(post => {
    if (!post.date) return false;
    const postDate = new Date(post.date);
    return !isNaN(postDate.getTime()) && postDate >= twoMonthsAgo;
  });
}

async function loadHomeContent() {
  const grid = document.getElementById('newsGrid');
  grid.innerHTML = `
    <div class="empty-state empty-state--loading">
      <i class="fa-solid fa-circle-notch fa-spin"></i>
      <p>Memuat berita terbaru...</p>
    </div>
  `;
  
  try {
    const rawData = await fetchJsonSilent('content/posts-index.json', 'index berita');
    
    if (!rawData) {
      grid.innerHTML = emptyStateHTML('news', 'Belum ada berita terbaru. Pantau terus website ini untuk informasi terbaru dari OSIS!');
      return;
    }

    let posts = Array.isArray(rawData) ? rawData : (rawData.posts || rawData.data || [rawData]);
    posts = posts.filter(p => p.filename && p.date);

    if (posts.length === 0) {
      grid.innerHTML = emptyStateHTML('news', 'Belum ada berita yang dipublikasikan. Tim jurnalistik akan segera mengisi konten terbaru!');
      return;
    }

    const recentPosts = filterRecentPosts(posts);
    
    if (recentPosts.length === 0) {
      grid.innerHTML = emptyStateHTML('news', 'Belum ada berita dalam 2 bulan terakhir. Kunjungi halaman Berita untuk melihat semua artikel.');
      return;
    }

    recentPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
    const latest = recentPosts.slice(0, 6);

    renderNewsCards(latest);
    initNewsFilter();
  } catch (err) {
    grid.innerHTML = emptyStateHTML('error', 'Gagal memuat berita. Silakan refresh halaman.');
  }
}

function renderNewsCards(items) {
  const grid = document.getElementById('newsGrid');
  if (!grid) return;

  grid.innerHTML = items.map((item, i) => {
    const type = (item.type || 'berita').toLowerCase();
    const validType = ['berita', 'pengumuman', 'agenda'].includes(type) ? type : 'berita';
    const typeLabel = validType.charAt(0).toUpperCase() + validType.slice(1);
    const dateFormatted = formatDateID(item.date);
    const imgUrl = resolveImage(item.image);

    const imgHTML = imgUrl 
      ? `<img src="${imgUrl}" alt="${item.title}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">`
      : '';
    const placeholderHTML = `<div style="display:${imgUrl ? 'none' : 'flex'};align-items:center;justify-content:center;height:100%;background:#f3f4f6;"><i class="fa-solid fa-file-lines" style="font-size:2.5rem;color:var(--gray-400)"></i></div>`;
    
    const postLink = `page/${validType}/index.html?file=${encodeURIComponent(item.filename || '')}`;

    return `
      <article class="card anim-stagger" data-category="${validType}" style="animation-delay:${i * 50}ms">
        <div style="position:relative;width:100%;height:180px;overflow:hidden;background:#f3f4f6;">
          ${imgHTML}
          ${placeholderHTML}
        </div>
        <div class="card__body">
          <span class="card__category card__category--${validType}">${typeLabel}</span>
          <h3 class="card__title">${item.title || 'Tanpa Judul'}</h3>
          <div class="card__meta">
            <span class="card__date"><i class="fa-regular fa-calendar"></i> ${dateFormatted}</span>
            <span style="color:var(--gray-400);font-size:0.7rem"><i class="fa-solid fa-user" style="margin-right:0.2rem"></i>${item.author || 'Admin'}</span>
          </div>
          <a href="${postLink}" class="card__read-more" style="margin-top:0.75rem;display:inline-block">Baca <i class="fa-solid fa-arrow-right"></i></a>
        </div>
      </article>
    `;
  }).join('');
}

async function loadGallery() {
  const grid = document.getElementById('galeriGrid');
  grid.innerHTML = `
    <div class="empty-state empty-state--loading">
      <i class="fa-solid fa-circle-notch fa-spin"></i>
      <p>Memuat galeri...</p>
    </div>
  `;
  try {
    const data = await fetchJsonSilent('content/galeri.json', 'galeri');
    
    if (!data) {
      grid.innerHTML = emptyStateHTML('gallery', 'Belum ada foto galeri. Dokumentasi kegiatan akan segera ditambahkan!');
      return;
    }
    
    let items = data.galeri || (Array.isArray(data) ? data : []);

    if (!items.length) {
      grid.innerHTML = emptyStateHTML('gallery', 'Belum ada foto yang diunggah.');
      return;
    }

    if (items[0]?.date) items.sort((a, b) => new Date(b.date) - new Date(a.date));
    const limited = items.slice(0, 3);

    grid.innerHTML = limited.map((item, i) => `
      <div class="galeri-item" style="animation: fadeUp 0.5s ${i * 0.1}s ease both">
        <img src="${resolveImage(item.image)}" alt="${item.title || 'Foto Kegiatan'}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
        <div style="display:none;align-items:center;justify-content:center;height:100%;background:#f3f4f6;"><i class="fa-solid fa-image" style="font-size:2rem;color:var(--gray-400)"></i></div>
        <div class="galeri-item__overlay">
          <span class="galeri-item__zoom"><i class="fa-solid fa-magnifying-glass-plus"></i></span>
        </div>
      </div>
    `).join('');
  } catch (err) {
    grid.innerHTML = emptyStateHTML('error', 'Gagal memuat galeri.');
  }
}
async function loadTeamInti() {
  const grid = document.getElementById('pengurusGrid');
  grid.innerHTML = `
    <div class="empty-state empty-state--loading">
      <i class="fa-solid fa-circle-notch fa-spin"></i>
      <p>Memuat pengurus inti...</p>
    </div>
  `;
  try {
    const data = await fetchJsonSilent('content/team_1.json', 'pengurus inti');

    if (!data) {
      grid.innerHTML = emptyStateHTML('users', 'Data pengurus inti belum tersedia.');
      return;
    }

    const members = data.team || (Array.isArray(data) ? data : []);

    if (!members.length) {
      grid.innerHTML = emptyStateHTML('users', 'Belum ada data pengurus inti.');
      return;
    }

    grid.innerHTML = members.map((m, i) => {
      const imgUrl = resolveImage(m.image);
      const displayName = m.name || 'Tanpa Nama';
      const displayRole = m.role || 'Anggota';
      
      return `
        <div class="pengurus-card ${i === 0 ? 'pengurus-card--ketua' : ''} fade-up" style="cursor: pointer;" onclick="openLightboxModal('${imgUrl}', '${displayName.replace(/'/g, "\\'")}', '${displayRole.replace(/'/g, "\\'")}')">
          <img src="${imgUrl}" alt="${displayName}" class="pengurus-card__photo" onerror="this.src='https://via.placeholder.com/80?text=No+Img'">
          <div class="pengurus-card__name">${displayName}</div>
          <span class="pengurus-card__jabatan">${displayRole}</span>
        </div>
      `;
    }).join('');
  } catch (err) {
    grid.innerHTML = emptyStateHTML('error', 'Gagal memuat pengurus inti.');
  }
}

// ================================================
// SEARCH & FILTER
// ================================================
function initNewsFilter() {
  const searchInput = document.getElementById('newsSearch');
  const container = document.getElementById('berita');
  if (!searchInput || !container) return;
  
  const newInput = searchInput.cloneNode(true);
  searchInput.parentNode.replaceChild(newInput, searchInput);

  const applyFilter = () => {
    const term = newInput.value.toLowerCase().trim();
    const activeTabEl = container.querySelector('.filter-tab.active');
    const activeTab = activeTabEl ? activeTabEl.dataset.filter : 'all';
    
    const cards = container.querySelectorAll('#newsGrid .card');
    let visibleCount = 0;
    cards.forEach(card => {
      const titleEl = card.querySelector('.card__title');
      const title = titleEl ? titleEl.textContent.toLowerCase() : '';
      const cat = card.dataset.category;
      const matchTerm = title.includes(term);
      const matchCat = activeTab === 'all' || activeTab === cat;
      const show = matchTerm && matchCat;
      card.style.display = show ? '' : 'none';
      if (show) visibleCount++;
    });

    // Show/hide search not found
    const grid = document.getElementById('newsGrid');
    let notFound = grid.parentElement.querySelector('.empty-state--search');
    if (visibleCount === 0 && cards.length > 0) {
      if (!notFound) {
        notFound = document.createElement('div');
        notFound.innerHTML = emptyStateHTML('search', 'Pencarian tidak ditemukan. Coba kata kunci lain.');
        grid.parentElement.insertBefore(notFound, grid.nextElementSibling);
      }
      notFound.style.display = '';
    } else if (notFound) {
      notFound.style.display = 'none';
    }
  };

  newInput.addEventListener('input', applyFilter);
  container.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      container.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      e.currentTarget.classList.add('active');
      applyFilter();
    });
  });
}

// ================================================
// LIGHTBOX GALERI (untuk foto kegiatan)
// ================================================
function initLightboxGaleri() {
  const lb = document.getElementById('lightboxGaleri');
  const lbImg = document.getElementById('lightboxImg');
  const grid = document.getElementById('galeriGrid');
  if (!lb || !lbImg || !grid) return;

  grid.addEventListener('click', (e) => {
    const item = e.target.closest('.galeri-item');
    if (!item) return;
    const img = item.querySelector('img');
    if (img && img.src && img.style.display !== 'none') {
      lbImg.src = img.src;
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  });
  const close = () => { lb.classList.remove('open'); document.body.style.overflow = ''; };
  document.getElementById('lightboxClose').addEventListener('click', close);
  lb.addEventListener('click', e => { if(e.target === lb) close(); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape') close(); });
}

// ================================================
// LIGHTBOX MODAL (untuk pengurus inti)
// ================================================
let lightboxModal = null;
let lightboxImage = null;
let lightboxName = null;
let lightboxRole = null;

function initLightboxModal() {
  lightboxModal = document.getElementById('lightboxModal');
  lightboxImage = document.getElementById('lightboxImage');
  lightboxName = document.getElementById('lightboxName');
  lightboxRole = document.getElementById('lightboxRole');
  
  if (!lightboxModal) return;
  
  // Close button
  const closeBtn = lightboxModal.querySelector('.lightbox-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeLightboxModal());
  }
  
  // Backdrop click
  const backdrop = lightboxModal.querySelector('.lightbox-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', () => closeLightboxModal());
  }
  
  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightboxModal.classList.contains('active')) {
      closeLightboxModal();
    }
  });
}

function openLightboxModal(imageSrc, name, role) {
  if (!lightboxModal) initLightboxModal();
  if (!lightboxModal) return;
  
  lightboxImage.src = imageSrc;
  lightboxImage.alt = name;
  lightboxName.textContent = name;
  lightboxRole.textContent = role;
  
  // Remove closing class if exists
  lightboxModal.classList.remove('closing');
  
  // Show modal
  lightboxModal.classList.add('active');
  lightboxModal.setAttribute('aria-hidden', 'false');
  
  // Prevent body scroll
  document.body.style.overflow = 'hidden';
}

function closeLightboxModal() {
  if (!lightboxModal) return;
  
  // Add closing animation
  lightboxModal.classList.add('closing');
  
  // Wait for animation to finish
  setTimeout(() => {
    lightboxModal.classList.remove('active', 'closing');
    lightboxModal.setAttribute('aria-hidden', 'true');
    
    // Restore body scroll
    document.body.style.overflow = '';
  }, 300);
}

// ================================================
// SCROLL OBSERVER (Kustom untuk Home)
// ================================================
function initScrollObserverCustom() {
  if (!('IntersectionObserver' in window)) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if(e.isIntersecting) {
        e.target.classList.add('fade-up');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
  document.querySelectorAll('.card, .pengurus-card').forEach(el => obs.observe(el));
}
