// ================================================
// EXAM POPUP - Notifikasi Ujian OSIS (Popup Modal)
// Auto-run on DOM ready, cek ujian_tes.json
// Tampil sebagai popup mirip dev-modal lightbox
// ================================================
(function() {
  'use strict';

  function initExamPopup() {
    // Path sesuai lokasi halaman
    var jsonPath = 'content/ujian_tes.json';
    if (window.location.pathname.includes('/page/')) {
      jsonPath = '../../content/ujian_tes.json';
    }

    fetch(jsonPath)
      .then(function(r) {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then(function(data) {
        var today = new Date();
        today.setHours(0, 0, 0, 0);

        var startDate = new Date(data.start_date);
        startDate.setHours(0, 0, 0, 0);
        var endDate = new Date(data.end_date);
        endDate.setHours(23, 59, 59, 999);

        // Cek apakah ujian aktif hari ini
        if (today < startDate || today > endDate) return;

        // Jangan tampilkan popup kalo link Google Form kosong
        if (!data.link) return;

        renderExamPopup(data);
      })
      .catch(function() {
        // Silent fail
      });
  }

  function renderExamPopup(data) {
    // Cegah duplikasi
    if (document.getElementById('exam-popup')) return;

    var startLabel = formatDate(new Date(data.start_date));
    var endLabel = formatDate(new Date(data.end_date));
    var desc = data.description || 'Klik "Mulai Ujian" untuk memulai tes anggota OSIS.';

    // === BUILD POPUP ===
    var popup = document.createElement('div');
    popup.id = 'exam-popup';
    popup.className = 'exam-popup';
    popup.setAttribute('aria-hidden', 'true');

    popup.innerHTML =
      '<div class="exam-popup__backdrop"></div>' +
      '<div class="exam-popup__container">' +
        '<div class="exam-popup__content">' +
          '<div class="exam-popup__icon-wrap">' +
            '<div class="exam-popup__icon">📝</div>' +
          '</div>' +
          '<h3 class="exam-popup__title">' + escapeHtml(data.title) + '</h3>' +
          '<p class="exam-popup__period">' + startLabel + ' — ' + endLabel + '</p>' +
          '<p class="exam-popup__desc">' + escapeHtml(desc) + '</p>' +
          '<div class="exam-popup__actions">' +
            '<button class="exam-popup__btn" id="examPopupStart">Mulai Ujian</button>' +
            '<button class="exam-popup__btn-ghost" id="examPopupDismiss">Tutup</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(popup);

    // === ANIMATE IN ===
    requestAnimationFrame(function() {
      popup.classList.add('open');
    });
    document.body.style.overflow = 'hidden';

    // === EVENT LISTENERS ===

    // Start button → token + redirect
    document.getElementById('examPopupStart').addEventListener('click', function() {
      var token = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      sessionStorage.setItem('_exam_token', token);
      sessionStorage.setItem('_exam_link', data.link);
      sessionStorage.setItem('_exam_title', data.title);
      window.location.href = '/page/exam/?token=' + token;
    });

    // Dismiss button — tutup aja, gak disave ke localStorage
    document.getElementById('examPopupDismiss').addEventListener('click', function() {
      closePopup(popup);
    });

    // Backdrop click
    popup.querySelector('.exam-popup__backdrop').addEventListener('click', function() {
      closePopup(popup);
    });
  }

  function closePopup(popup) {
    if (!popup || !popup.classList.contains('open')) return;

    popup.classList.remove('open');
    popup.classList.add('closing');
    document.body.style.overflow = '';

    setTimeout(function() {
      if (popup && popup.parentNode) {
        popup.parentNode.removeChild(popup);
      }
    }, 400);
  }

  function formatDate(date) {
    return date.toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initExamPopup);
  } else {
    initExamPopup();
  }
})();
