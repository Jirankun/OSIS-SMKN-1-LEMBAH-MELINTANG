// ================================================
// CMS NOTIFICATION POPUP - Fetch & Render
// ================================================
async function initNotificationPopup() {
  const popupContainer = document.getElementById('notification-popup');
  if (!popupContainer) {
    console.warn('[NOTIF] Container #notification-popup tidak ditemukan');
    return;
  }
  
  try {
    // Fix path: coba relative path dulu, fallback ke absolute
    let jsonPath = 'content/notifications.json';
    // Jika halaman ada di subfolder (misal /page/kontak/), kita perlu adjust path
    const currentPath = window.location.pathname;
    if (currentPath.includes('/page/')) {
      jsonPath = '../../content/notifications.json';
    } else if (currentPath.split('/').length > 2) {
      // Hitung berapa level folder, lalu buat relative path
      const depth = currentPath.split('/').filter(Boolean).length - 1;
      jsonPath = '../'.repeat(depth) + 'content/notifications.json';
    }
    
    console.log('[NOTIF] Fetching dari:', jsonPath);
    
    const res = await fetch(jsonPath);
    if (!res.ok) {
      throw new Error('File not found: ' + res.status + ' ' + res.statusText);
    }
    const notifications = await res.json();
    console.log('[NOTIF] Data loaded:', notifications);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time untuk perbandingan tanggal yang akurat
    
    const activeNotif = notifications.find(n => {
      if (!n.active) {
        console.log('[NOTIF] Skip karena tidak active:', n.title);
        return false;
      }
      const fromDate = new Date(n.show_from);
      const untilDate = new Date(n.show_until);
      fromDate.setHours(0, 0, 0, 0);
      untilDate.setHours(23, 59, 59, 999); // Include seluruh hari terakhir
      
      const isActive = today >= fromDate && today <= untilDate;
      if (!isActive) {
        console.log('[NOTIF] Skip karena tanggal tidak valid:', n.title, 
          '| From:', n.show_from, '| Until:', n.show_until, '| Today:', today.toISOString().split('T')[0]);
      }
      return isActive;
    });
    
    if (!activeNotif) {
      console.log('[NOTIF] Tidak ada notifikasi aktif');
      return;
    }
    
    console.log('[NOTIF] Notifikasi aktif:', activeNotif.title);
    
    // Cek localStorage: udah ditutup belum?
    const version = activeNotif.version || 1;
    const sanitizedTitle = activeNotif.title.replace(/[^a-zA-Z0-9]/g, '_');
    const dismissedKey = 'notif_' + sanitizedTitle + '_v' + version;
    
    if (localStorage.getItem(dismissedKey)) {
      console.log('[NOTIF] User sudah dismiss notifikasi ini (key:', dismissedKey + ')');
      return;
    }
    
    // Render popup
    const hasAction = activeNotif.has_action && activeNotif.link_url;
    const linkUrl = activeNotif.link_url || '#';
    const linkText = activeNotif.link_text || 'Lihat Detail';
    
    popupContainer.innerHTML = 
      '<div class="notification-popup__overlay" id="notif-overlay"></div>' +
      '<div class="notification-popup notification-popup--' + activeNotif.type + '">' +
        '<div class="notification-popup__header">' +
          '<h3 class="notification-popup__title">' + escapeHtml(activeNotif.title) + '</h3>' +
          '<button class="notification-popup__close" aria-label="Tutup">&times;</button>' +
        '</div>' +
        '<div class="notification-popup__body">' +
          '<p>' + escapeHtml(activeNotif.message) + '</p>' +
        '</div>' +
        '<div class="notification-popup__footer">' +
          (hasAction ? '<a href="' + escapeHtml(linkUrl) + '" class="btn-popup btn-popup--primary">' + escapeHtml(linkText) + '</a>' : '') +
          '<button class="btn-popup btn-popup--ghost">Tutup</button>' +
        '</div>' +
      '</div>';
    
    console.log('[NOTIF] Popup rendered');
    
    // Show dengan animasi
    requestAnimationFrame(function() {
      popupContainer.style.display = 'block';
      setTimeout(function() {
        var notifEl = popupContainer.querySelector('.notification-popup');
        var overlayEl = popupContainer.querySelector('.notification-popup__overlay');
        if (notifEl) notifEl.classList.add('show');
        if (overlayEl) overlayEl.classList.add('show');
        console.log('[NOTIF] Popup shown with animation');
      }, 10);
    });
    
    // Close logic
    var closePopup = function() {
      console.log('[NOTIF] Closing popup, saving to localStorage:', dismissedKey);
      localStorage.setItem(dismissedKey, 'true');
      
      var notifEl = popupContainer.querySelector('.notification-popup');
      var overlayEl = popupContainer.querySelector('.notification-popup__overlay');
      
      if (notifEl) notifEl.classList.remove('show');
      if (overlayEl) overlayEl.classList.remove('show');
      
      setTimeout(function() {
        popupContainer.style.display = 'none';
        console.log('[NOTIF] Popup hidden');
      }, 200);
      
      // Remove ESC listener
      document.removeEventListener('keydown', onEscHandler);
    };
    
    var onEscHandler = function(e) {
      if (e.key === 'Escape') {
        closePopup();
      }
    };
    
    // Bind event listeners dengan delay kecil untuk memastikan elemen sudah render
    setTimeout(function() {
      var closeBtn = popupContainer.querySelector('.notification-popup__close');
      var ghostBtn = popupContainer.querySelector('.btn-popup--ghost');
      var overlay = popupContainer.querySelector('.notification-popup__overlay');
      
      if (closeBtn) {
        closeBtn.addEventListener('click', closePopup);
        console.log('[NOTIF] Close button bound');
      }
      if (ghostBtn) {
        ghostBtn.addEventListener('click', closePopup);
        console.log('[NOTIF] Ghost button bound');
      }
      if (overlay) {
        overlay.addEventListener('click', closePopup);
        console.log('[NOTIF] Overlay bound');
      }
      
      // Close pake ESC
      document.addEventListener('keydown', onEscHandler);
      console.log('[NOTIF] ESC listener bound');
    }, 50);
    
  } catch (e) {
    console.error('[NOTIF] Gagal load notification:', e);
    console.error('[NOTIF] Stack:', e.stack);
  }
}

// Helper function untuk escape HTML (mencegah XSS)
function escapeHtml(text) {
  if (!text) return '';
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ================================================
// AUTO INIT - Jalankan saat DOM ready
// ================================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNotificationPopup);
} else {
  initNotificationPopup();
}
