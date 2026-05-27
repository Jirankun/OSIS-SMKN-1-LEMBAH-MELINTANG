/**
 * Theme Manager - Dark/Light Mode Switch
 * Menggunakan data-theme attribute pada HTML tag
 * Menyimpan preferensi user di localStorage
 */

(function() {
  const THEME_KEY = 'osis_theme_preference';
  const LIGHT_THEME = 'light';
  const DARK_THEME = 'dark';

  // Fungsi untuk mendapatkan tema yang tersimpan atau default
  function getSavedTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === LIGHT_THEME || saved === DARK_THEME) {
      return saved;
    }
    // Cek preferensi sistem
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return DARK_THEME;
    }
    return LIGHT_THEME;
  }

  // Fungsi untuk menyimpan tema
  function saveTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
  }

  // Fungsi untuk menerapkan tema ke document
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update semua switch toggle jika ada
    const switches = document.querySelectorAll('.theme-switch');
    switches.forEach(sw => {
      if (sw.tagName === 'INPUT' && sw.type === 'checkbox') {
        sw.checked = (theme === DARK_THEME);
      }
    });
  }

  // Fungsi untuk toggle tema
  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || LIGHT_THEME;
    const newTheme = current === DARK_THEME ? LIGHT_THEME : DARK_THEME;
    applyTheme(newTheme);
    saveTheme(newTheme);
    
    // Dispatch event untuk listener lain
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: newTheme } }));
  }

  // Inisialisasi saat DOM siap
  function init() {
    const theme = getSavedTheme();
    applyTheme(theme);

    // Listen untuk perubahan preferensi sistem
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        const saved = localStorage.getItem(THEME_KEY);
        // Hanya auto-switch jika tidak ada preferensi user yang tersimpan
        if (!saved || saved === 'system') {
          applyTheme(e.matches ? DARK_THEME : LIGHT_THEME);
        }
      });
    }
  }

  // Jalankan inisialisasi
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose ke global scope
  window.ThemeManager = {
    toggle: toggleTheme,
    set: applyTheme,
    get: getSavedTheme,
    LIGHT: LIGHT_THEME,
    DARK: DARK_THEME
  };
})();
