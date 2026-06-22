// ================================================
// HOME PAGE - Beranda
// ================================================

// ================================================
// SPLASH SCREEN HANDLER — Sequencing Animasi (optimized)
// Urutan (~3.5s): enter → shimmer → logo zoom → fade out
// Menggunakan time tracking untuk cleanup otomatis
// ================================================
function initSplashScreen() {
  const splash = document.getElementById('splashScreen');
  if (!splash) return;
  
  // Lock scroll selama splash aktif
  document.body.style.overflow = 'hidden';
  
  // Tampung semua timer ID untuk cleanup safety
  var timers = [];
  
  // Fase 1: Jeda awal
  timers.push(setTimeout(() => {
    // Fase 2: Efek shimmer
    splash.classList.add('shimmer-active');
    
    timers.push(setTimeout(() => {
      // Fase 3: Logo zoom in
      splash.classList.add('zoom-active');
      
      timers.push(setTimeout(() => {
        // Fase 4: Splash fade out
        splash.classList.add('fade-active');
        
        timers.push(setTimeout(() => {
          // Fase 5: Selesai — unlock scroll
          splash.style.display = 'none';
          document.body.style.overflow = '';
          
          // Cek preferensi reduced motion — langsung trigger semua
          const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          
          document.body.classList.add('anim-ready');
          loadAsyncContent();
          
          // Jeda untuk hero video (lebih pendek kalo reduced motion)
          timers.push(setTimeout(() => {
            initHeroVideoDelayed();
          }, prefersReducedMotion ? 100 : 1000));
          
          // Bersihin timer references — gak perlu di-clear karena udah kepanggil
          timers = [];
        }, 800));
      }, 400));
    }, 500));
  }, 1850));
  
  // Safety: fallback cleanup jika ada error di tengah splash
  // Setelah 10 detik, paksa splash hilang
  timers.push(setTimeout(function forceSplashEnd() {
    if (splash.style.display !== 'none') {
      splash.style.display = 'none';
      document.body.style.overflow = '';
      document.body.classList.add('anim-ready');
      loadAsyncContent();
      initHeroVideoDelayed();
    }
  }, 10000));
}

// ================================================
// CORE INIT
// ================================================
// Fungsi yang butuh fetch data — dipanggil SETELAH splash selesai
function loadAsyncContent() {
  loadHomeContent();
  loadGallery();
  loadTeamInti();
}

document.addEventListener('DOMContentLoaded', () => {
  // Cek dan bersihkan URL jika ada parameter ?file= yang tidak valid
  cleanInvalidFileUrl();
  // initSplashScreen(); // DISABLED - Splash screen dimatikan
  loadAsyncContent(); // Langsung load content tanpa splash
  renderNavbar();
  initConfig();
  renderFooter(4);
  initScrollObserverCustom();
  initBackToTop();
  initFullscreenPlayer();
  initLightboxGaleri();
  initLightboxModal();
});

function cleanInvalidFileUrl() {
  const params = new URLSearchParams(window.location.search);
  const fileParam = params.get('file');
  
  if (!fileParam) return;
  
  // Cek apakah file masih ada di posts-index.json
  fetch('content/posts-index.json')
    .then(res => res.json())
    .then(posts => {
      const fileExists = posts.some(p => p.filename === fileParam);
      if (!fileExists) {
        // File tidak ada, hapus parameter dari URL
        params.delete('file');
        const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
        window.history.replaceState({}, '', newUrl);
      }
    })
    .catch(() => {
      // Gagal fetch, hapus parameter untuk safety
      params.delete('file');
      const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
      window.history.replaceState({}, '', newUrl);
    });
}

// ================================================
// HERO BACKGROUND VIDEO — Load biasa, play langsung
// ================================================

// ================================================
// SCROLL PAUSE/RESUME — Stop video pas hero gak kelihatan
// ================================================
function initHeroScrollPause() {
  const hero = document.querySelector('.hero');
  const video = document.getElementById('heroVideo');
  if (!hero || !video) return;
  
  let wasPlaying = false;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting && video.classList.contains('video-visible')) {
        if (!video.paused) {
          wasPlaying = true;
          video.pause();
        }
      } else if (entry.isIntersecting && wasPlaying) {
        wasPlaying = false;
        video.play().catch(() => {});
      }
    });
  }, { threshold: 0.2 });
  
  observer.observe(hero);
}

// ================================================
// HANDLE VIDEO PLAY SUCCESS
// ================================================
function handleHeroPlaySuccess(heroVideo, heroBg) {
  heroVideo.onerror = null;
  heroVideo.style.opacity = '1';
  heroVideo.classList.add('video-visible');
  heroBg.classList.add('video-active');
  initHeroScrollPause();
}

// ================================================
// FALLBACK HERO KE GRADIENT
// ================================================
function fallbackHeroToGradient() {
  if (fallbackHeroToGradient._done) return;
  fallbackHeroToGradient._done = true;
  
  const bg = document.getElementById('heroBg');
  const video = document.getElementById('heroVideo');
  const progress = document.getElementById('heroProgress');
  
  if (bg) {
    bg.style.backgroundImage = 'none';
    bg.classList.remove('video-active');
  }
  if (video) {
    video.pause();
    video.removeAttribute('src');
    video.load();
    video.style.opacity = '0';
    video.classList.remove('video-visible');
  }
  if (progress) {
    progress.classList.remove('active');
    const bar = progress.querySelector('.hero__progress-bar');
    if (bar) bar.style.width = '0%';
  }
}

// ================================================
// HERO VIDEO — Load biasa, play langsung
// ================================================
// Source di-set & di-load() saat initConfig (selama splash).
// Pas fungsi ini dipanggil (~5.5s setelah load), tinggal play.
// Gak pakai canplay / readyState — langsung play aja.
// Kalo gagal (autoplay block / video broken) → fallback gradient.
function initHeroVideoDelayed() {
  const heroVideo = document.getElementById('heroVideo');
  const heroBg = document.getElementById('heroBg');
  const progress = document.getElementById('heroProgress');
  const progressBar = progress?.querySelector('.hero__progress-bar');
  
  if (!heroVideo || !SITE_CONFIG.school.heroBg || SITE_CONFIG.school.heroType !== 'video') return;
  if (fallbackHeroToGradient._done) return;

  // Munculin progress bar
  progress?.classList.add('active');
  
  // Update progress dari buffer
  function updateProgress() {
    if (!progressBar) return;
    if (heroVideo.buffered.length > 0) {
      const buffered = heroVideo.buffered.end(heroVideo.buffered.length - 1);
      const duration = heroVideo.duration || 1;
      const pct = Math.min((buffered / duration) * 100, 100);
      progressBar.style.width = pct + '%';
      if (pct >= 95) {
        progress?.classList.remove('active');
      }
    }
  }
  heroVideo.addEventListener('progress', updateProgress);
  
  // Langsung play — video udah di-load dari splash
  heroVideo.play()
    .then(() => {
      handleHeroPlaySuccess(heroVideo, heroBg);
      // Sembunyiin progress bar 3 detik setelah play
      setTimeout(() => {
        progress?.classList.remove('active');
      }, 3000);
    })
    .catch(() => {
      fallbackHeroToGradient();
    });
}

// ================================================
// INIT CONFIG — Siapin hero, video/image
// ================================================
function initConfig() {
  document.getElementById('heroSubtitle').textContent = SITE_CONFIG.school.tagline;
  document.getElementById('year').textContent = new Date().getFullYear();
  document.title = SITE_CONFIG.school.osis;
  
  const heroBg = document.getElementById('heroBg');
  const heroVideo = document.getElementById('heroVideo');
  const heroSource = heroVideo?.querySelector('source');
  const fullscreenBtn = document.getElementById('heroFullscreenBtn');
  
  // Sembunyiin tombol fullscreen player kalo bukan mode video
  if (fullscreenBtn) {
    fullscreenBtn.style.display = SITE_CONFIG.school.heroType === 'video' ? '' : 'none';
  }
  
  // Reset state
  heroBg.style.backgroundImage = 'none';
  heroBg.classList.remove('video-active');
  
  // Video mulai dalam keadaan hidden → fade-in nanti
  if (heroVideo) {
    heroVideo.style.opacity = '0';
    heroVideo.classList.remove('video-visible');
  }
  
  // Kalau heroBg kosong → gradient aja
  if (!SITE_CONFIG.school.heroBg) return;
  
  if (SITE_CONFIG.school.heroType === 'video') {
    // ======== MODE VIDEO 🎬 — Cuma prepare, gak play dulu ========
    if (heroSource && heroVideo) {
      heroSource.src = SITE_CONFIG.school.heroBg;
      
      // Error handler kalo video gagal total
      heroVideo.onerror = () => {
        console.log('Video hero gagal dimuat, fallback ke gradient');
        fallbackHeroToGradient();
      };
      
      heroVideo.load(); // Loading di background selama splash
    }
  } else {
    // ======== MODE IMAGE 🖼️ — Langsung tampilkan ========
    heroBg.style.backgroundImage = `url('${SITE_CONFIG.school.heroBg}')`;
    heroBg.classList.remove('video-active');
    
    if (heroVideo) {
      heroVideo.pause();
      heroVideo.removeAttribute('src');
      heroVideo.onerror = null;
    }
    
    // Deteksi gambar broken
    if (SITE_CONFIG.school.heroBg.match(/\.(jpe?g|png|gif|webp|svg|avif|bmp)/i)) {
      const img = new Image();
      img.onerror = () => {
        console.log('Gambar hero gagal dimuat, fallback ke gradient');
        heroBg.style.backgroundImage = 'none';
      };
      img.src = SITE_CONFIG.school.heroBg;
    }
  }
}

// ================================================
// FULLSCREEN VIDEO PLAYER (Sutro) — Pojok Kanan Atas Hero
// ================================================
function initFullscreenPlayer() {
  const btn = document.getElementById('heroFullscreenBtn');
  const player = document.getElementById('fullscreenPlayer');
  const container = player?.querySelector('.fullscreen-player__container');
  const closeBtn = document.getElementById('fullscreenClose');
  const heroVideo = document.getElementById('heroVideo');

  if (!btn || !player || !closeBtn) return;

  // Cari video element di dalam Sutro player (pake id biar pasti)
  const sutroVideo = document.getElementById('sutroVideo');

  // Set source Sutro video dari config
  if (sutroVideo && SITE_CONFIG.school.heroBg) {
    sutroVideo.src = SITE_CONFIG.school.heroBg;
  }

  // Set aspect-ratio container sesuai dimensi asli video
  function adjustContainerAspect() {
    if (!container || !sutroVideo || !sutroVideo.videoWidth || !sutroVideo.videoHeight) return;
    const ratio = sutroVideo.videoWidth / sutroVideo.videoHeight;
    container.style.aspectRatio = `${sutroVideo.videoWidth} / ${sutroVideo.videoHeight}`;
  }

  // Buka
  btn.addEventListener('click', () => {
    // Pause hero video
    if (heroVideo && !heroVideo.paused) {
      heroVideo.pause();
    }

    // Sesuaikan container ke rasio video (kalo udah siap)
    if (sutroVideo?.videoWidth && sutroVideo?.videoHeight) {
      adjustContainerAspect();
    } else if (sutroVideo) {
      sutroVideo.addEventListener('loadedmetadata', adjustContainerAspect, { once: true });
    }

    // Show player
    player.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Play sutro video
    if (sutroVideo) {
      sutroVideo.currentTime = 0;
      sutroVideo.play().catch(() => {});
    }
  });

  // Tutup
  function closePlayer() {
    if (!player.classList.contains('active')) return;

    player.classList.remove('active');
    document.body.style.overflow = '';

    // Pause sutro video
    if (sutroVideo) {
      sutroVideo.pause();
    }

    // Resume hero video kalo sebelumnya lagi play (cek class bukan src)
    if (heroVideo && heroVideo.classList.contains('video-visible')) {
      heroVideo.play().catch(() => {});
    }
  }

  closeBtn.addEventListener('click', closePlayer);

  // Click backdrop (area luar player container) tutup juga
  player.addEventListener('click', (e) => {
    if (e.target === player) closePlayer();
  });

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePlayer();
  });
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

    renderNewsCards(latest, posts);
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
    const limited = items.slice(0, 4);

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
// SCROLL OBSERVER (Kustom untuk Home) + cleanup
// ================================================
var _homeScrollObserver = null;
function initScrollObserverCustom() {
  if (!('IntersectionObserver' in window)) return;
  _homeScrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if(e.isIntersecting) {
        e.target.classList.add('fade-up');
        _homeScrollObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
  document.querySelectorAll('.card, .pengurus-card').forEach(el => _homeScrollObserver.observe(el));
}

// Cleanup observer saat page unload
window.addEventListener('beforeunload', function() {
  if (_homeScrollObserver) {
    _homeScrollObserver.disconnect();
    _homeScrollObserver = null;
  }
});
