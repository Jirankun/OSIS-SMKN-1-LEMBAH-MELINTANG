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
// HELPER: Resolve image path
// ================================================
function resolveImage(path) {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("//") || path.startsWith("/") || path.startsWith(".")) {
    return path;
  }
  return "/" + path;
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
    console.error(`[Fetch] Gagal mengambil ${description} dari ${url}:`, err.message);
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
    els.socials.innerHTML = html;
  }
}

// ================================================
// HELPER: Back to top button
// ================================================
function initBackToTop() {
  const btn = document.getElementById("backToTop");
  if (!btn) return;
  window.addEventListener("scroll", () => {
    btn.style.display = window.scrollY > 400 ? "flex" : "none";
  });
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
