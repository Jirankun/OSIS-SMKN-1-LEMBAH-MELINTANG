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
    { label: "Galeri", href: "../galeri/index.html", icon: "fa-solid fa-images" },
    { label: "Anggota dan Divisi", href: "index.html", icon: "fa-solid fa-users" },
    { label: "Kontak", href: "../../index.html#kontak", icon: "fa-solid fa-envelope" },
  ]
};

// ================================================
// HELPER
// ================================================
function resolveImage(path) {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('//') || path.startsWith('/') || path.startsWith('.')) {
    return path;
  }
  return `/${path}`;
}

function formatDateID(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
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
  document.title = `Profil OSIS - ${SITE_CONFIG.school.osis}`;
  initNavbar();
  renderStaticSections();
  loadTeamInti();
  loadTeamDivisi();
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
// 🔥 LOAD PENGURUS INTI - Card Rapi & Konsisten
// ================================================
async function loadTeamInti() {
  const grid = document.getElementById('gridInti');
  if (!grid) return;
  
  grid.innerHTML = '<div class="empty-state"><i class="fa-solid fa-circle-notch fa-spin"></i><p>Memuat pengurus inti...</p></div>';
  
  try {
    const res = await fetch('../../content/team_1.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rawData = await res.json();
    const members = Array.isArray(rawData) ? rawData : (rawData.team || rawData.data || []);

    if (!members.length) {
      grid.innerHTML = '<div class="empty-state"><i class="fa-solid fa-users-slash"></i><p>Belum ada data pengurus inti</p></div>';
      return;
    }

    grid.innerHTML = members.map((m, i) => {
      const imgUrl = resolveImage(m.image);
      const isKetua = i === 0 ? ' inti-card--ketua' : '';
      
      return `
        <div class="card inti-card${isKetua} fade-up" style="animation-delay:${i * 100}ms">
          ${imgUrl 
            ? `<img src="${imgUrl}" alt="${m.name}" class="inti-card__img" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">`
            : ''}
          <div class="inti-card__placeholder" style="display:${imgUrl ? 'none' : 'flex'}">
            <i class="fa-solid fa-user"></i>
          </div>
          <div class="inti-card__name">${m.name || 'Tanpa Nama'}</div>
          <span class="inti-card__role">${m.role || 'Anggota'}</span>
        </div>
      `;
    }).join('');
  } catch (e) {
    console.error('Error load team_1.json:', e);
    grid.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><p>Gagal memuat data. Pastikan <code>../../content/team_1.json</code> tersedia.</p></div>`;
  }
}

// ================================================
// 🔥 LOAD TIM DIVISI - Card Rapi & Konsisten
// ================================================
async function loadTeamDivisi() {
  const container = document.getElementById('gridDivisi');
  if (!container) return;
  
  container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-circle-notch fa-spin"></i><p>Memuat data divisi...</p></div>';
  
  try {
    const res = await fetch('../../content/team_2.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rawData = await res.json();
    const divisions = Array.isArray(rawData) ? rawData : (rawData.divisions || rawData.data || []);

    if (!divisions.length) {
      container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-users-slash"></i><p>Belum ada data divisi</p></div>';
      return;
    }

    container.innerHTML = divisions.map((div, idx) => `
      <div class="division-card fade-up" style="animation-delay:${idx * 100}ms">
        <h3 class="division-card__title"><i class="fa-solid fa-layer-group"></i> ${div.division || 'Divisi'}</h3>
        <div class="division-members">
          ${(div.members || []).map(m => {
            const imgUrl = resolveImage(m.image);
            return `
              <div class="member-mini">
                ${imgUrl 
                  ? `<img src="${imgUrl}" alt="${m.name}" class="member-mini__img" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">`
                  : ''}
                <div class="member-mini__placeholder" style="display:${imgUrl ? 'none' : 'flex'}">
                  <i class="fa-solid fa-user"></i>
                </div>
                <div class="member-mini__name">${m.name || 'Tanpa Nama'}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `).join('');
  } catch (e) {
    console.error('Error load team_2.json:', e);
    container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><p>Gagal memuat data. Pastikan <code>../../content/team_2.json</code> tersedia.</p></div>`;
  }
}

// ================================================
// SCROLL OBSERVER - Animasi Fade Up
// ================================================
function initScrollObserver() {
  if (!('IntersectionObserver' in window)) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
  document.querySelectorAll('.inti-card, .division-card').forEach(el => obs.observe(el));
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