// ================================================
// CMS NOTIFICATION POPUP - Fetch & Render
// ================================================
async function initNotificationPopup() {
  const popupContainer = document.getElementById('notification-popup');
  if (!popupContainer) return;

  try {
    const res = await fetch('content/notifications.json');
    if (!res.ok) return;
    const notifications = await res.json();
    
    const today = new Date();
    const activeNotif = notifications.find(n => {
      if (!n.active) return false;
      const from = new Date(n.show_from);
      const until = new Date(n.show_until);
      return today >= from && today <= until;
    });
    
    if (!activeNotif) return;
    
    // Cek localStorage: udah ditutup belum?
    const dismissedKey = `notif_${activeNotif.title.replace(/\s+/g, '_')}_v${activeNotif.version || 1}`;
    if (localStorage.getItem(dismissedKey)) return;
    
    // Render popup
    const hasAction = activeNotif.has_action && activeNotif.link;
    popupContainer.innerHTML = `
      <div class="notification-popup__overlay" id="notif-overlay"></div>
      <div class="notification-popup notification-popup--${activeNotif.type}">
        <div class="notification-popup__header">
          <h3 class="notification-popup__title">${activeNotif.title}</h3>
          <button class="notification-popup__close" aria-label="Tutup">&times;</button>
        </div>
        <div class="notification-popup__body">
          <p>${activeNotif.message}</p>
        </div>
        <div class="notification-popup__footer">
          ${hasAction ? `<a href="${activeNotif.link}" class="btn-popup btn-popup--primary">${activeNotif.link_text || 'Lihat Detail'}</a>` : ''}
          <button class="btn-popup btn-popup--ghost">Tutup</button>
        </div>
      </div>
    `;
    
    // Show dengan animasi
    requestAnimationFrame(() => {
      popupContainer.style.display = 'block';
      setTimeout(() => {
        popupContainer.querySelector('.notification-popup').classList.add('show');
        popupContainer.querySelector('.notification-popup__overlay').classList.add('show');
      }, 10);
    });
    
    // Close logic
    const closePopup = () => {
      localStorage.setItem(dismissedKey, 'true');
      popupContainer.querySelector('.notification-popup').classList.remove('show');
      popupContainer.querySelector('.notification-popup__overlay').classList.remove('show');
      setTimeout(() => { popupContainer.style.display = 'none'; }, 200);
    };
    
    popupContainer.querySelector('.notification-popup__close').addEventListener('click', closePopup);
    popupContainer.querySelector('.btn-popup--ghost').addEventListener('click', closePopup);
    popupContainer.querySelector('.notification-popup__overlay').addEventListener('click', closePopup);
    
    // Close pake ESC
    const onEsc = (e) => { if (e.key === 'Escape') closePopup(); };
    document.addEventListener('keydown', onEsc, { once: true });
    
  } catch (e) {
    console.warn('Gagal load notification:', e);
  }
}

// ================================================
// PANGGIL DI DOMContentLoaded (tambahin baris ini)
// ================================================
// initNotificationPopup();
