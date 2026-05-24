// ================================================
// KONTAK PAGE SCRIPT - Hubungi Kami
// ================================================

// ================================================
// CORE INIT
// ================================================
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('year').textContent = new Date().getFullYear();
  document.title = `Hubungi Kami - ${SITE_CONFIG.school.osis}`;
  renderNavbar();
  renderFooter(3);
  populateKontakInfo();
  initForm();
  initBackToTop();
  initScrollObserver();
});

// ================================================
// POPULATE CONTACT INFO FROM SITE_CONFIG
// ================================================
function populateKontakInfo() {
  const sc = SITE_CONFIG.school;

  const alamat = document.getElementById('kontakAlamat');
  if (alamat) alamat.textContent = sc.address;

  const telepon = document.getElementById('kontakTelepon');
  if (telepon) telepon.textContent = sc.phone;

  const email = document.getElementById('kontakEmail');
  if (email) {
    email.innerHTML = `<a href="mailto:${sc.email}" style="color:var(--primary);text-decoration:none">${sc.email}</a>`;
  }

  // Social media links
  const socials = document.getElementById('kontakSocialLinks');
  if (socials) {
    let html = '';
    if (SITE_CONFIG.social.instagram) {
      html += `<a href="${SITE_CONFIG.social.instagram}" class="kontak-social__link" target="_blank" rel="noopener" title="Instagram"><i class="fa-brands fa-instagram"></i></a>`;
    }
    if (SITE_CONFIG.social.youtube) {
      html += `<a href="${SITE_CONFIG.social.youtube}" class="kontak-social__link" target="_blank" rel="noopener" title="YouTube"><i class="fa-brands fa-youtube"></i></a>`;
    }
    if (SITE_CONFIG.social.tiktok) {
      html += `<a href="${SITE_CONFIG.social.tiktok}" class="kontak-social__link" target="_blank" rel="noopener" title="TikTok"><i class="fa-brands fa-tiktok"></i></a>`;
    }
    if (SITE_CONFIG.social.facebook) {
      html += `<a href="${SITE_CONFIG.social.facebook}" class="kontak-social__link" target="_blank" rel="noopener" title="Facebook"><i class="fa-brands fa-facebook"></i></a>`;
    }
    socials.innerHTML = html || '<span style="color:var(--gray-400);font-size:0.82rem">Belum tersedia</span>';
  }
}

// ================================================
// FORM HANDLER
// ================================================
function initForm() {
  const form = document.getElementById('kontakForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    showToast('<i class="fa-solid fa-check-circle"></i> Pesan berhasil dikirim! Kami akan segera merespons.', 'success');
    form.reset();
  });
}
