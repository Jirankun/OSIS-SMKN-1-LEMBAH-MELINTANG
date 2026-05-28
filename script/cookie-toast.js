// ================================================
// COOKIE CONSENT TOAST - Global Single Cache
// ================================================
(function() {
  'use strict';
  
  const CACHE_KEY = 'cookie_consent_dismissed_v1';
  
  // Cek apakah user sudah pernah menutup toast
  if (localStorage.getItem(CACHE_KEY)) {
    return; // Jangan tampilkan lagi selamanya
  }
  
  // Tunggu sampai body punya class 'anim-ready' (tanda splash selesai / halaman tanpa splash)
  function waitForAnimReady() {
    return new Promise(function(resolve) {
      if (document.body.classList.contains('anim-ready')) {
        resolve();
        return;
      }
      var observer = new MutationObserver(function() {
        if (document.body.classList.contains('anim-ready')) {
          observer.disconnect();
          resolve();
        }
      });
      observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
      // Safety timeout: max 10 detik
      setTimeout(function() {
        observer.disconnect();
        resolve();
      }, 10000);
    });
  }
  
  // Fungsi untuk menampilkan toast
  function showCookieToast() {
    // Buat elemen toast jika belum ada
    var toast = document.getElementById('cookie-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'cookie-toast';
      toast.className = 'toast toast--cookie';
      toast.innerHTML = 
        '<span class="toast__text">Situs ini gunakan cookie untuk kenyamanan Anda</span>' +
        '<button class="toast__close" aria-label="Mengerti">' +
          '<i class="fa-solid fa-check"></i> Mengerti' +
        '</button>' +
        '<i class="fa-solid fa-cookie-bite toast__icon"></i>';
      document.body.appendChild(toast);
    }
    
    // Tunggu splash selesai, lalu muncul dengan stagger
    waitForAnimReady().then(function() {
      setTimeout(function() {
        toast.classList.add('show');
      }, 800);
    });
    
    // Event listener untuk tombol close
    var closeBtn = toast.querySelector('.toast__close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        toast.classList.remove('show');
        // Simpan ke localStorage agar tidak muncul lagi
        localStorage.setItem(CACHE_KEY, 'true');
        // Hapus elemen setelah animasi selesai
        setTimeout(function() {
          if (toast && toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 300);
      });
    }
  }
  
  // Jalankan saat DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showCookieToast);
  } else {
    showCookieToast();
  }
})();
