// ================================================
// PRIVACY PAGE SCRIPT
// ================================================

// ================================================
// CORE INIT
// ================================================
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('year').textContent = new Date().getFullYear();
  document.title = `Kebijakan Privasi - ${SITE_CONFIG.school.osis}`;
  renderNavbar();
  renderFooter(3);
  initBackToTop();
  initScrollObserver();
});

    // ==========================================
    // JAVASCRIPT: CLOSE TAB + FALLBACK HISTORY
    // ==========================================
    function tutupAtauKembali() {
      try {
        // Browser modern biasanya memblokir window.close()
        // kecuali tab dibuka via window.open()
        window.open('', '_self').close();
      } catch (e) {
        // Kalau error, langsung lanjut ke fallback
      }

      // Fallback pasti jalan: balik ke halaman terakhir di history
      // Delay 50ms biar browser proses close() dulu (kalau bisa)
      setTimeout(() => {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          // Kalau history kosong, arahkan ke homepage OSIS
          window.location.href = '../../index.html';
        }
      }, 50);
    }

    // Attach ke tombol
    document.getElementById('tutupAtauKembaliBtn').addEventListener('click', function(e) {
      e.preventDefault();
      tutupAtauKembali();
    });

    // Kalau lu mau pake langsung di href (inline style):
    // <a href="javascript:tutupAtauKembali()">Kembali</a>