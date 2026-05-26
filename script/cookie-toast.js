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
  
  // Fungsi untuk menampilkan toast
  function showCookieToast() {
    // Buat elemen toast jika belum ada
    var toast = document.getElementById('cookie-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'cookie-toast';
      toast.className = 'toast toast--cookie';
      toast.innerHTML = '<i class="fa-solid fa-cookie-bite"></i>' +
        '<span>Website ini menggunakan cookie dan tracking user untuk meningkatkan pengalaman pengguna. Dengan melanjutkan, Anda menyetujui penggunaan cookie.</span>' +
        '<button class="toast__close" aria-label="Mengerti">' +
        '<i class="fa-solid fa-check"></i> Mengerti' +
        '</button>';
      document.body.appendChild(toast);
    }
    
    // Tampilkan dengan animasi setelah delay singkat
    setTimeout(function() {
      toast.classList.add('show');
    }, 500);
    
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
