// ================================================
// KONFIGURASI SITE — 1 FILE UNTUK SEMUA HALAMAN
// ================================================
// Ubah nilai di sini, otomatis berubah di seluruh website.
// ================================================

const SITE_CONFIG = {
  school: {
    name: "SMKN 1 LEMBAH MELINTANG",
    short: "SMKN 1 LM",
    osis: "OSIS SMKN 1 LEMBAH MELINTANG",
    tagline: "Bisa ,dan siap kerja..!!",
    address: "Jl.Flores No.172 Ujung Gading, Lembah Melintang, Pasaman Barat, Sumatera Barat",
    phone: "+62-812-7511-7151",
    email: "smknsatulembahmelintang@gmail.com",
    website: "osis",
    logo: "img/asset/logo.webp",
    // Ganti jadi video kalo mau, bre: "img/asset/hero-bg.mp4"
    heroBg: "img/asset/super.jpeg",
    // Tambahin ini: 'image' atau 'video'
    heroType: "image", 
  },
  social: {
    instagram: "https://www.instagram.com/osis_smkn1lembahmelintang/",
    youtube: "https://www.youtube.com/@smknlentangofficial",
    tiktok: "https://www.tiktok.com/@smkn1_lembahmelintang",
    facebook: "https://www.facebook.com/Smkn1LembahMelintang/",
  },
  site: {
    url: "",
    adminPath: "/11892.21/",
    postsPerPage: 6,
  },
  nav: [
    { label: "Beranda", href: "/", icon: "fa-solid fa-house" },
    { label: "Berita", href: "/page/berita/", icon: "fa-solid fa-newspaper" },
    { label: "Pengumuman", href: "/page/pengumuman/", icon: "fa-solid fa-bullhorn" },
    { label: "Agenda", href: "/page/agenda/", icon: "fa-solid fa-calendar-days" },
    { label: "Galeri", href: "/page/galeri/", icon: "fa-solid fa-images" },
    { label: "Profil OSIS", href: "/page/profil_osis/", icon: "fa-solid fa-users" },
    { label: "Kontak", href: "/page/kontak/", icon: "fa-solid fa-envelope" },
  ],
};

// ================================================
// HELPER: Cek apakah link sedang aktif
// ================================================
function isLinkActive(href) {
  const current = window.location.pathname.replace(/\/+/g, "/").toLowerCase();
  const hash = window.location.hash.toLowerCase();

  // Root / home page
  if (href === "/" || href === "/index.html") {
    return current === "/" || current.endsWith("/index.html") || current === "";
  }

  // Sub-page: /page/kontak/ → cocok dengan /page/kontak/...
  const path = href.replace(/\/$/, "").toLowerCase();
  return current.startsWith(path);
}

// ================================================
// HELPER: Resolve image path to full URL
// ================================================
function resolveImage(path) {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("//")) {
    return path;
  }
  // Jika path relatif, prepend dengan base URL
  const baseUrl = window.location.origin;
  if (path.startsWith("/")) {
    return baseUrl + path;
  }
  return baseUrl + "/" + path;
}

// ================================================
// HELPER: Format tanggal Bahasa Indonesia
// ================================================
function formatDateID(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ================================================
// HELPER: Fetch JSON dengan silent error
// ================================================
async function fetchJsonSilent(url, description = "data") {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return null;
  }
}

// ================================================
// HELPER: Toast notification
// ================================================
function showToast(msg, type = "success") {
  const t = document.getElementById("toast");
  if (!t) return;
  t.innerHTML = msg;
  t.className = `toast toast--${type} show`;
  setTimeout(() => t.classList.remove("show"), 3500);
}

// ================================================
// HELPER: Render navbar & mobile menu
// ================================================
function renderNavbar() {
  const nav = document.getElementById("navbar");
  const ham = document.getElementById("hamburger");
  const mobile = document.getElementById("mobileMenu");
  const linksContainer = document.getElementById("navLinks");

  const buildNav = () => {
    if (linksContainer) {
      linksContainer.innerHTML = SITE_CONFIG.nav.map((l) =>
        `<a href="${l.href}" class="navbar__link${isLinkActive(l.href) ? " active" : ""}"><i class="${l.icon}"></i> ${l.label}</a>`
      ).join("");
    }
    if (mobile) {
      mobile.innerHTML = SITE_CONFIG.nav.map((l) =>
        `<a href="${l.href}" class="navbar__mobile-link${isLinkActive(l.href) ? " active" : ""}"><i class="${l.icon}"></i> ${l.label}</a>`
      ).join("");
    }
  };

  buildNav();

  if (nav) window.addEventListener("scroll", () => nav.classList.toggle("scrolled", window.scrollY > 50));
  if (ham && mobile) {
    ham.addEventListener("click", () => {
      const isOpen = ham.classList.toggle("open");
      mobile.classList.toggle("open");
      ham.setAttribute("aria-expanded", isOpen);
    });
    mobile.querySelectorAll("a").forEach((link) =>
      link.addEventListener("click", () => {
        ham.classList.remove("open");
        mobile.classList.remove("open");
      })
    );
  }

  // Update active state when hash changes (for #kontak on home)
  window.addEventListener("hashchange", buildNav);
}

// ================================================
// HELPER: Render footer statis
// ================================================
function renderFooter(customNavCount = 4) {
  const els = {
    brand: document.getElementById("footerBrand"),
    desc: document.getElementById("footerDesc"),
    links: document.getElementById("footerLinks"),
    socials: document.getElementById("socials"),
  };

  if (els.brand) els.brand.textContent = SITE_CONFIG.school.osis;
  if (els.desc) els.desc.textContent = SITE_CONFIG.school.tagline;
  if (els.links) {
    els.links.innerHTML = SITE_CONFIG.nav.slice(0, customNavCount).map((n) =>
      `<li><a href="${n.href}" class="footer__link">${n.label}</a></li>`
    ).join("");
  }
  if (els.socials) {
    let html = "";
    if (SITE_CONFIG.social.instagram) {
      html += `<a href="${SITE_CONFIG.social.instagram}" class="footer__social-link" target="_blank" rel="noopener"><i class="fa-brands fa-instagram"></i></a>`;
    }
    if (SITE_CONFIG.social.youtube) {
      html += `<a href="${SITE_CONFIG.social.youtube}" class="footer__social-link" target="_blank" rel="noopener"><i class="fa-brands fa-youtube"></i></a>`;
    }
    if (SITE_CONFIG.social.tiktok) {
      html += `<a href="${SITE_CONFIG.social.tiktok}" class="footer__social-link" target="_blank" rel="noopener"><i class="fa-brands fa-tiktok"></i></a>`;
    }
    if (SITE_CONFIG.social.facebook) {
      html += `<a href="${SITE_CONFIG.social.facebook}" class="footer__social-link" target="_blank" rel="noopener"><i class="fa-brands fa-facebook"></i></a>`;
    }
    els.socials.innerHTML = html;
  }
}

// ================================================
// HELPER: Back to top button dengan progress scroll
// ================================================
function initBackToTop() {
  const btn = document.getElementById("backToTop");
  if (!btn) return;
  
  // Buat SVG ring untuk progress jika belum ada
  if (!btn.querySelector('svg')) {
    btn.innerHTML = `
      <svg viewBox="0 0 48 48">
        <circle class="progress-ring__bg" cx="24" cy="24" r="20"></circle>
        <circle class="progress-ring__circle" cx="24" cy="24" r="20"></circle>
      </svg>
      <i class="fa-solid fa-arrow-up" style="position:absolute;font-size:1rem;"></i>
    `;
  }
  
  const circle = btn.querySelector('.progress-ring__circle');
  const radius = circle.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;
  
  // Set initial state
  circle.style.strokeDasharray = `${circumference} ${circumference}`;
  circle.style.strokeDashoffset = circumference;
  
  // Fungsi update progress
  function updateScrollProgress() {
    const scrollY = window.scrollY || window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? scrollY / docHeight : 0;
    
    // Update progress ring
    const offset = circumference - (scrollPercent * circumference);
    circle.style.strokeDashoffset = offset;
    
    // Show/hide button
    btn.style.display = scrollY > 400 ? "flex" : "none";
  }
  
  // Call once on init
  updateScrollProgress();
  
  // Add scroll listener with throttling for performance
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateScrollProgress();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
  
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// ================================================
// HELPER: Empty State HTML (dengan icon Font Awesome)
// type: loading | empty | search | error | news | image | calendar | users | gallery
// ================================================
function emptyStateHTML(type = 'empty', message = 'Tidak ada data.') {
  const icons = {
    loading: '<i class="fa-solid fa-circle-notch fa-spin"></i>',
    empty: '<i class="fa-solid fa-inbox"></i>',
    search: '<i class="fa-solid fa-magnifying-glass"></i>',
    error: '<i class="fa-solid fa-triangle-exclamation"></i>',
    image: '<i class="fa-solid fa-image"></i>',
    news: '<i class="fa-solid fa-newspaper"></i>',
    calendar: '<i class="fa-solid fa-calendar-xmark"></i>',
    users: '<i class="fa-solid fa-users-slash"></i>',
    gallery: '<i class="fa-solid fa-camera-slash"></i>',
    file: '<i class="fa-solid fa-file-circle-xmark"></i>',
  };
  const icon = icons[type] || icons.empty;
  return `<div class="empty-state empty-state--${type}">${icon}<p class="empty-state__text">${message}</p></div>`;
}

// ================================================
// HELPER: Update Open Graph Meta Tags dynamically
// ================================================
function updateOpenGraphTags(title, description, imageUrl) {
  // Helper to set or create meta tag
  const setMeta = (property, content, name = null) => {
    let el = document.querySelector(`meta[property="${property}"]`) || 
             document.querySelector(`meta[name="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      if (property) el.setAttribute('property', property);
      if (name) el.setAttribute('name', name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  // Set basic OG tags
  setMeta('og:title', title || SITE_CONFIG.school.name);
  setMeta('og:description', description || SITE_CONFIG.school.tagline);
  setMeta('og:type', 'article');
  
  // Set OG image from config.js (heroBg) atau custom imageUrl
  const ogImage = imageUrl ? imageUrl : resolveImage(SITE_CONFIG.school.heroBg);
  setMeta('og:image', ogImage);
  setMeta('og:image:alt', title || 'Preview image');
  setMeta('og:url', window.location.href);
  setMeta('og:site_name', SITE_CONFIG.school.osis);
  
  // Set Twitter Card tags
  setMeta('twitter:card', 'summary_large_image', 'twitter:card');
  setMeta('twitter:title', title || SITE_CONFIG.school.name, 'twitter:title');
  setMeta('twitter:description', description || SITE_CONFIG.school.tagline, 'twitter:description');
  setMeta('twitter:image', ogImage, 'twitter:image');
}

// ================================================
// HELPER: Scroll observer untuk animasi
// ================================================
function initScrollObserver(selector = ".animate-on-scroll") {
  if (!("IntersectionObserver" in window)) return;
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -50px 0px" }
  );
  document.querySelectorAll(selector).forEach((el) => obs.observe(el));
}
