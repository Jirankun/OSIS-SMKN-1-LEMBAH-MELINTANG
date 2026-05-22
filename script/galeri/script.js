// ================================================
// KONFIGURASI SITE
// ================================================
const SITE_CONFIG = {
  school: {
    name: "SMKN 1 LEMBAH MELINTANG",
    short: "SMKN 1 LM",
    osis: "OSIS SMKN 1 LEMBAH MELINTANG",
    tagline: "Unggul dalam Prestasi, Berkarakter Mulia",
    address: "Jl. Pendidikan No. 1, Lembah Melintang, Pasaman Barat, Sumatera Barat",
    phone: "+62-XXX-XXXX-XXXX",
    email: "info@smkn1lm.sch.id",
    website: "https://smkn1lm.sch.id",
    logo: "../../img/asset/logo.webp",
  },
  social: {
    instagram: "https://instagram.com/osis_smkn1lembahmelintang",
    youtube: "", tiktok: "", facebook: "",
  },
  site: { url: "https://your-username.github.io/osis-smkn1lm", adminPath: "/11892.21/admin" },
  nav: [
    { label: "Beranda", href: "../../index.html", icon: "fa-solid fa-house" },
    { label: "Berita", href: "../berita/index.html", icon: "fa-solid fa-newspaper" },
    { label: "Pengumuman", href: "../pengumuman/index.html", icon: "fa-solid fa-bullhorn" },
    { label: "Agenda", href: "../agenda/index.html", icon: "fa-solid fa-calendar-days" },
    { label: "Galeri", href: "index.html", icon: "fa-solid fa-images" },
    { label: "Anggota dan Divisi", href: "../profil_osis/index.html", icon: "fa-solid fa-users" },
    { label: "Kontak", href: "../../index.html#kontak", icon: "fa-solid fa-envelope" },
  ]
};

// ================================================
// HELPER
// ================================================
function resolveImage(path) {
  if (!path) return null;
  // ✅ FIX: Jangan tambah '/' kalo path udah mulai dengan http, //, /, atau .
  if (path.startsWith('http') || path.startsWith('//') || path.startsWith('/') || path.startsWith('.')) {
    return path;
  }
  // Relative path dari root: img/... → /img/...
  return `/${path}`;
}

function formatDateID(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.innerHTML = msg;
  t.className = `toast toast--${type} show`;
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ================================================
// CORE INIT
// ================================================
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('year').textContent = new Date().getFullYear();
  document.title = `Galeri - ${SITE_CONFIG.school.osis}`;
  initNavbar();
  renderStaticSections();
  loadGallery();
  initLightbox();
  initScrollObserver();
  initBackToTop();
});

// ================================================
// 🔥 NAVBAR - Active State Logic
// ================================================
function initNavbar() {
  const nav = document.getElementById('navbar');
  const ham = document.getElementById('hamburger');
  const mobile = document.getElementById('mobileMenu');
  const linksContainer = document.getElementById('navLinks');

  const currentPath = window.location.pathname.replace(/\/+/g, '/').toLowerCase();
  const currentHash = window.location.hash.toLowerCase();
  const isRoot = !currentPath.includes('/page/');

  const isLinkActive = (href) => {
    if (href.includes('#')) return isRoot && currentHash === href;
    if (href === '#' || (href.includes('index.html') && !href.includes('/page/'))) return isRoot;
    const match = href.match(/\/([^\/]+)\/index\.html$/);
    if (match) return currentPath.includes(`/${match[1].toLowerCase()}/`);
    return false;
  };

  if (linksContainer) {
    linksContainer.innerHTML = SITE_CONFIG.nav.map(l => 
      `<a href="${l.href}" class="navbar__link${isLinkActive(l.href) ? ' active' : ''}"><i class="${l.icon}"></i> ${l.label}</a>`
    ).join('');
  }
  if (mobile) {
    mobile.innerHTML = SITE_CONFIG.nav.map(l => 
      `<a href="${l.href}" class="navbar__mobile-link${isLinkActive(l.href) ? ' active' : ''}"><i class="${l.icon}"></i> ${l.label}</a>`
    ).join('');
  }

  if (nav) window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 50));
  if (ham && mobile) {
    ham.addEventListener('click', () => {
      const isOpen = ham.classList.toggle('open');
      mobile.classList.toggle('open');
      ham.setAttribute('aria-expanded', isOpen);
    });
    mobile.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      ham.classList.remove('open'); mobile.classList.remove('open');
    }));
  }
}

// ================================================
// RENDER STATIC SECTIONS
// ================================================
function renderStaticSections() {
  const sc = SITE_CONFIG.school;
  document.getElementById('footerBrand').textContent = SITE_CONFIG.school.osis;
  document.getElementById('footerDesc').textContent = SITE_CONFIG.school.tagline;
  document.getElementById('footerLinks').innerHTML = SITE_CONFIG.nav.slice(0, 3).map(n => 
    `<li><a href="${n.href}" class="footer__link">${n.label}</a></li>`
  ).join('');
}

// ================================================
// 🔥 LOAD GALERI - Fixed Path & Scroll (Silent Error)
// ================================================
async function loadGallery() {
  const grid = document.getElementById('galeriFullGrid');
  if (!grid) return;
  
  grid.innerHTML = '<div class="empty-state"><i class="fa-solid fa-circle-notch fa-spin"></i><p>Memuat galeri...</p></div>';

  try {
    const rawData = await fetchJsonSilent('../../content/galeri.json', 'galeri');
    
    if (!rawData) {
      grid.style.display = 'none';
      console.log('[Galeri] Tidak ada data galeri.');
      return;
    }

    // Handle format: array langsung atau { "galeri": [...] }
    let items = Array.isArray(rawData) ? rawData : (rawData.galeri || rawData.data || []);

    if (!items.length) {
      grid.style.display = 'none';
      console.log('[Galeri] Belum ada foto yang diunggah.');
      return;
    }

    // Sort tanggal terbaru
    if (items[0]?.date) items.sort((a, b) => new Date(b.date) - new Date(a.date));

    // ✅ FIX: Render dengan path gambar yang bener + fallback
    grid.innerHTML = items.map((item, i) => {
      // ✅ FIX: Jangan manipulasi path kalo udah absolute/relative valid
      const imgUrl = item.image;
      const imgHTML = imgUrl 
        ? `<img src="${imgUrl}" alt="${item.title || 'Foto Kegiatan'}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">`
        : '';
      const placeholderHTML = `<div style="display:${imgUrl ? 'none' : 'flex'};align-items:center;justify-content:center;height:100%;background:#f3f4f6;"><i class="fa-solid fa-image" style="font-size:2rem;color:var(--gray-400)"></i></div>`;

      return `
        <div class="galeri-full-item fade-up" style="animation-delay:${i * 50}ms">
          ${imgHTML}
          ${placeholderHTML}
          <div class="galeri-full-item__overlay">
            <span class="galeri-full-item__zoom"><i class="fa-solid fa-magnifying-glass-plus"></i></span>
            <div class="galeri-full-item__title">${item.title || 'Tanpa Judul'}</div>
            <div class="galeri-full-item__date">${formatDateID(item.date)}</div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('[Galeri] Error:', err);
    grid.style.display = 'none';
  }
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

// ================================================
// LIGHTBOX - Fixed Scroll Reset
// ================================================
function initLightbox() {
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightboxImg');
  const grid = document.getElementById('galeriFullGrid');
  if (!lb || !lbImg || !grid) return;

  grid.addEventListener('click', (e) => {
    const item = e.target.closest('.galeri-full-item');
    if (!item) return;
    const img = item.querySelector('img');
    if (img && img.src && img.style.display !== 'none') {
      lbImg.src = img.src;
      lb.classList.add('open');
      document.body.style.overflow = 'hidden'; // ✅ Lock scroll
    }
  });

  const close = () => { 
    lb.classList.remove('open'); 
    document.body.style.overflow = ''; // ✅ ✅ FIX: Unlock scroll setelah tutup!
  };
  
  document.getElementById('lightboxClose')?.addEventListener('click', close);
  lb.addEventListener('click', e => { if(e.target === lb) close(); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape') close(); });
}

// ================================================
// SCROLL OBSERVER
// ================================================
function initScrollObserver() {
  if (!('IntersectionObserver' in window)) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('fade-up');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
  document.querySelectorAll('.galeri-full-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    obs.observe(el);
  });
}

// ================================================
// BACK TO TOP
// ================================================
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