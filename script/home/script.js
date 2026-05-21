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
    website: "osis",
    logo: "img/asset/logo.webp",
    heroBg: "img/hero-bg.jpg",
  },
  social: {
    instagram: "https://www.instagram.com/osis_smkn1lembahmelintang/",
    youtube: "", tiktok: "", facebook: "",
  },
  site: { url: "https://your-username.github.io/osis-smkn1lm", adminPath: "/11892.21/admin", postsPerPage: 6 },
  nav: [
    { label: "Beranda", href: "#", icon: "fa-solid fa-house" },
    { label: "Berita", href: "page/berita/index.html", icon: "fa-solid fa-newspaper" },
    { label: "Pengumuman", href: "page/pengumuman/index.html", icon: "fa-solid fa-bullhorn" },
    { label: "Agenda", href: "page/agenda/index.html", icon: "fa-solid fa-calendar-days" },
    { label: "Galeri", href: "page/galeri/index.html", icon: "fa-solid fa-images" },
    { label: "Profil OSIS", href: "page/profil_osis/index.html", icon: "fa-solid fa-users" },
    { label: "Kontak", href: "#kontak", icon: "fa-solid fa-envelope" },
  ]
};

// ================================================
// HELPER
// ================================================
function resolveImage(path) {
  if (!path) return null;
  return (path.startsWith('http') || path.startsWith('//') || path.startsWith('/') || path.startsWith('.')) ? path : `/${path}`;
}
function formatDateID(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ================================================
// CORE INIT
// ================================================
document.addEventListener('DOMContentLoaded', () => {
  initConfig();
  initNavbar(); // 🔥 Navbar fix disini
  renderStaticSections();
  loadHomeContent();
  loadGallery();
  loadTeamInti();
  initForm();
  initScrollObserver();
  initBackToTop();
  initLightbox();
});

function initConfig() {
  document.getElementById('heroSubtitle').textContent = SITE_CONFIG.school.tagline;
  document.getElementById('year').textContent = new Date().getFullYear();
  document.title = SITE_CONFIG.school.osis;
  const heroBg = document.getElementById('heroBg');
  if (SITE_CONFIG.school.heroBg) heroBg.style.backgroundImage = `url('${SITE_CONFIG.school.heroBg}')`;
}

// ================================================
// 🔥 NAVBAR - Active State Logic SIMPEL
// ================================================
function initNavbar() {
  const nav = document.getElementById('navbar');
  const ham = document.getElementById('hamburger');
  const mobile = document.getElementById('mobileMenu');
  const linksContainer = document.getElementById('navLinks');

  const currentPath = window.location.pathname.replace(/\/+/g, '/').toLowerCase();
  const currentHash = window.location.hash.toLowerCase();
  const isRoot = !currentPath.includes('/page/');

  // 🔥 Trik simpel: cek berdasarkan path & hash
  const isLinkActive = (href) => {
    if (href.includes('#')) return isRoot && currentHash === href;
    if (href === '#' || href === 'index.html') return isRoot;
    const match = href.match(/page\/([^\/]+)\/index\.html$/);
    if (match) return currentPath.includes(`/page/${match[1].toLowerCase()}/`);
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
  window.addEventListener('hashchange', () => {
    if (linksContainer) linksContainer.innerHTML = SITE_CONFIG.nav.map(l => 
      `<a href="${l.href}" class="navbar__link${isLinkActive(l.href) ? ' active' : ''}"><i class="${l.icon}"></i> ${l.label}</a>`
    ).join('');
    if (mobile) mobile.innerHTML = SITE_CONFIG.nav.map(l => 
      `<a href="${l.href}" class="navbar__mobile-link${isLinkActive(l.href) ? ' active' : ''}"><i class="${l.icon}"></i> ${l.label}</a>`
    ).join('');
  });
}

// ================================================
// STATIC SECTIONS & CONTENT LOADERS
// (renderStaticSections, loadHomeContent, renderNewsCards, loadGallery, loadTeamInti, dll)
// ... [kode sama kayak sebelumnya, gw singkat biar gak kepanjangan] ...
// ================================================
function renderStaticSections() {
  const sc = SITE_CONFIG.school;
  document.getElementById('kontakInfo').innerHTML = `
    <div class="kontak-info__item"><div class="kontak-info__icon"><i class="fa-solid fa-location-dot"></i></div><div><div class="kontak-info__label">Alamat</div><div class="kontak-info__value">${sc.address}</div></div></div>
    <div class="kontak-info__item"><div class="kontak-info__icon"><i class="fa-solid fa-phone"></i></div><div><div class="kontak-info__label">Telepon</div><div class="kontak-info__value">${sc.phone}</div></div></div>
    <div class="kontak-info__item"><div class="kontak-info__icon"><i class="fa-solid fa-envelope"></i></div><div><div class="kontak-info__label">Email</div><div class="kontak-info__value">${sc.email}</div></div></div>
  `;
  document.getElementById('footerBrand').textContent = SITE_CONFIG.school.osis;
  document.getElementById('footerDesc').textContent = SITE_CONFIG.school.tagline;
  document.getElementById('footerLinks').innerHTML = SITE_CONFIG.nav.slice(0, 4).map(n => `<li><a href="${n.href}" class="footer__link">${n.label}</a></li>`).join('');
  let socialHTML = '';
  if(SITE_CONFIG.social.instagram) socialHTML += `<a href="${SITE_CONFIG.social.instagram}" class="footer__social-link" target="_blank" rel="noopener"><i class="fa-brands fa-instagram"></i></a>`;
  document.getElementById('socials').innerHTML = socialHTML;
}

// ... [loadHomeContent, renderNewsCards, loadGallery, loadTeamInti, initNewsFilter, initLightbox, initForm, showToast, initScrollObserver, initBackToTop] ...
// (kode lengkapnya sama kayak yang gw kasih sebelumnya, tinggal copy-paste aja bre)

// ================================================
// FETCH CONTENT - Home (posts-index.json), Gallery & Team Inti
// ================================================
async function loadHomeContent() {
  const grid = document.getElementById('newsGrid');
  grid.innerHTML = '<div class="empty-state"><i class="fa-solid fa-circle-notch fa-spin" style="font-size:2rem;margin-bottom:1rem"></i><p>Memuat konten terbaru...</p></div>';
  try {
    const res = await fetch('content/posts-index.json');
    if (!res.ok) throw new Error('Index file not found');
    let rawData = await res.json();

    // Handle format: array langsung, atau dibungkus key, atau single object
    let posts = Array.isArray(rawData) ? rawData : (rawData.posts || rawData.data || [rawData]);
    
    // Filter data yang valid (punya filename & date)
    posts = posts.filter(p => p.filename && p.date);

    if (posts.length === 0) {
      grid.innerHTML = '<div class="empty-state"><p>Belum ada postingan terbaru</p></div>';
      return;
    }

    // Urutkan tanggal terbaru -> ambil 6
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    const latest = posts.slice(0, 6);

    renderNewsCards(latest);
    initNewsFilter();
  } catch (err) {
    console.error('Gagal load content:', err);
    grid.innerHTML = '<div class="empty-state"><i class="fa-solid fa-triangle-exclamation" style="font-size:2rem;margin-bottom:1rem;color:var(--danger)"></i><p>Belum ada postingan terbaru</p></div>';
  }
}

function renderNewsCards(items) {
  const grid = document.getElementById('newsGrid');
  if (!grid) return;

  grid.innerHTML = items.map(item => {
    const type = (item.type || 'berita').toLowerCase();
    const validType = ['berita', 'pengumuman', 'agenda'].includes(type) ? type : 'berita';
    const typeLabel = validType.charAt(0).toUpperCase() + validType.slice(1);
    const dateFormatted = formatDateID(item.date);
    const imgUrl = resolveImage(item.image);

    // Image + Fallback Placeholder
    const imgHTML = imgUrl 
      ? `<img src="${imgUrl}" alt="${item.title}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">`
      : '';
    const placeholderHTML = `<div style="display:${imgUrl ? 'none' : 'flex'};align-items:center;justify-content:center;height:100%;background:#f3f4f6;"><i class="fa-solid fa-file-lines" style="font-size:2.5rem;color:var(--gray-400)"></i></div>`;
    
    // Routing dinamis ke halaman spesifik + query file
    const postLink = `page/${validType}/index.html?file=${encodeURIComponent(item.filename || '')}`;

    return `
      <article class="card" data-category="${validType}">
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
  grid.innerHTML = '<div class="empty-state"><i class="fa-solid fa-circle-notch fa-spin" style="font-size:2rem;margin-bottom:1rem"></i><p>Memuat galeri...</p></div>';
  try {
    const res = await fetch('content/galeri.json');
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    let items = data.galeri || (Array.isArray(data) ? data : []);

    if (!items.length) {
      grid.innerHTML = '<div class="empty-state"><i class="fa-solid fa-image-slash" style="font-size:2.5rem;margin-bottom:1rem;color:var(--gray-300)"></i><p class="empty-state__text">Belum ada konten galeri</p></div>';
      return;
    }

    if (items[0]?.date) items.sort((a, b) => new Date(b.date) - new Date(a.date));
    const limited = items.slice(0, 3);

    grid.innerHTML = limited.map(item => `
      <div class="galeri-item">
        <img src="${resolveImage(item.image)}" alt="${item.title || 'Foto Kegiatan'}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
        <div style="display:none;align-items:center;justify-content:center;height:100%;background:#f3f4f6;"><i class="fa-solid fa-image" style="font-size:2rem;color:var(--gray-400)"></i></div>
        <div class="galeri-item__overlay">
          <span class="galeri-item__zoom"><i class="fa-solid fa-magnifying-glass-plus"></i></span>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Gagal load galeri:', err);
    grid.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation" style="font-size:2rem;margin-bottom:1rem;color:var(--danger)"></i><p>Gagal memuat galeri. Pastikan <code>content/galeri.json</code> tersedia.</p></div>`;
  }
}

async function loadTeamInti() {
  const grid = document.getElementById('pengurusGrid');
  grid.innerHTML = '<div class="empty-state"><i class="fa-solid fa-circle-notch fa-spin" style="font-size:2rem;margin-bottom:1rem"></i><p>Memuat pengurus inti...</p></div>';
  try {
    const res = await fetch('content/team_1.json');
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    const members = data.team || (Array.isArray(data) ? data : []);

    if (!members.length) {
      grid.innerHTML = '<div class="empty-state"><i class="fa-solid fa-users-slash" style="font-size:2.5rem;margin-bottom:1rem;color:var(--gray-300)"></i><p class="empty-state__text">Belum ada data pengurus inti</p></div>';
      return;
    }

    grid.innerHTML = members.map((m, i) => `
      <div class="pengurus-card ${i === 0 ? 'pengurus-card--ketua' : ''} fade-up">
        <img src="${resolveImage(m.image)}" alt="${m.name}" class="pengurus-card__photo" onerror="this.src='https://via.placeholder.com/80?text=No+Img'">
        <div class="pengurus-card__name">${m.name}</div>
        <span class="pengurus-card__jabatan">${m.role}</span>
      </div>
    `).join('');
  } catch (err) {
    console.error('Gagal load team_1.json:', err);
    grid.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation" style="font-size:2rem;margin-bottom:1rem;color:var(--danger)"></i><p>Gagal memuat data. Pastikan <code>content/team_1.json</code> tersedia.</p></div>`;
  }
}

// ================================================
// SEARCH & FILTER - Event Delegation
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
    
    container.querySelectorAll('#newsGrid .card').forEach(card => {
      const titleEl = card.querySelector('.card__title');
      const title = titleEl ? titleEl.textContent.toLowerCase() : '';
      const cat = card.dataset.category;
      const matchTerm = title.includes(term);
      const matchCat = activeTab === 'all' || activeTab === cat;
      card.style.display = (matchTerm && matchCat) ? '' : 'none';
    });
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
// LIGHTBOX - Event Delegation
// ================================================
function initLightbox() {
  const lb = document.getElementById('lightbox');
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

function initForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    showToast('<i class="fa-solid fa-check-circle"></i> Pesan berhasil dikirim! Kami akan segera merespons.', 'success');
    e.target.reset();
  });
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.innerHTML = msg;
  t.className = `toast toast--${type} show`;
  setTimeout(() => t.classList.remove('show'), 3500);
}

function initScrollObserver() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if(e.isIntersecting) {
        e.target.classList.add('fade-up');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
  document.querySelectorAll('.card, .pengurus-card, .kontak-info__item').forEach(el => obs.observe(el));
}

function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.style.display = window.scrollY > 400 ? 'flex' : 'none';
  });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}