// ================================================
// CMS NOTIFICATION POPUP - Fetch & Render
// ================================================
async function initNotificationPopup() {
  const popupContainer = document.getElementById('notification-popup');
  if (!popupContainer) {
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
    
    const res = await fetch(jsonPath);
    if (!res.ok) {
      throw new Error('File not found: ' + res.status + ' ' + res.statusText);
    }
    const notifications = await res.json();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time untuk perbandingan tanggal yang akurat
    
    const activeNotif = notifications.find(n => {
      if (!n.active) {
        return false;
      }
      const fromDate = new Date(n.show_from);
      const untilDate = new Date(n.show_until);
      fromDate.setHours(0, 0, 0, 0);
      untilDate.setHours(23, 59, 59, 999); // Include seluruh hari terakhir
      
      const isActive = today >= fromDate && today <= untilDate;
      return isActive;
    });
    
    if (!activeNotif) {
      return;
    }
    
    // Cek localStorage: udah ditutup belum?
    const version = activeNotif.version || 1;
    const sanitizedTitle = activeNotif.title.replace(/[^a-zA-Z0-9]/g, '_');
    const dismissedKey = 'notif_' + sanitizedTitle + '_v' + version;
    
    if (localStorage.getItem(dismissedKey)) {
      return;
    }
    
    // Render popup
    const hasAction = activeNotif.has_action && activeNotif.link;
    const linkUrl = activeNotif.link || '#';
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
    
    // Show dengan animasi
    requestAnimationFrame(function() {
      popupContainer.style.display = 'block';
      setTimeout(function() {
        var notifEl = popupContainer.querySelector('.notification-popup');
        var overlayEl = popupContainer.querySelector('.notification-popup__overlay');
        if (notifEl) notifEl.classList.add('show');
        if (overlayEl) overlayEl.classList.add('show');
      }, 10);
    });
    
    // Close logic
    var closePopup = function() {
      localStorage.setItem(dismissedKey, 'true');
      
      var notifEl = popupContainer.querySelector('.notification-popup');
      var overlayEl = popupContainer.querySelector('.notification-popup__overlay');
      
      if (notifEl) notifEl.classList.remove('show');
      if (overlayEl) overlayEl.classList.remove('show');
      
      setTimeout(function() {
        popupContainer.style.display = 'none';
      }, 200);
      
      // Cleanup all listeners untuk mencegah memory leak
      document.removeEventListener('keydown', onEscHandler);
      if (closeBtnRef && closeBtnRef.parentNode) {
        closeBtnRef.removeEventListener('click', closePopup);
      }
      if (ghostBtnRef && ghostBtnRef.parentNode) {
        ghostBtnRef.removeEventListener('click', closePopup);
      }
      if (overlayRef && overlayRef.parentNode) {
        overlayRef.removeEventListener('click', closePopup);
      }
    };
    
    var onEscHandler = function(e) {
      if (e.key === 'Escape') {
        closePopup();
      }
    };
    
    // Variables to hold listener refs for cleanup
    var closeBtnRef = null;
    var ghostBtnRef = null;
    var overlayRef = null;
    
    // Bind event listeners dengan delay kecil untuk memastikan elemen sudah render
    setTimeout(function() {
      closeBtnRef = popupContainer.querySelector('.notification-popup__close');
      ghostBtnRef = popupContainer.querySelector('.btn-popup--ghost');
      overlayRef = popupContainer.querySelector('.notification-popup__overlay');
      
      if (closeBtnRef) {
        closeBtnRef.addEventListener('click', closePopup);
      }
      if (ghostBtnRef) {
        ghostBtnRef.addEventListener('click', closePopup);
      }
      if (overlayRef) {
        overlayRef.addEventListener('click', closePopup);
      }
      
      // Close pake ESC
      document.addEventListener('keydown', onEscHandler);
    }, 50);
    
  } catch (e) {
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
