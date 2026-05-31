// ================================================
// EXAM SCRIPT - Halaman Ujian OSIS
// Token validation, fullscreen, iframe, anti-cheat
// ================================================
(function() {
  'use strict';

  // --- State ---
  var examStarted = false;
  var isFullscreen = false;
  var warnedOnce = false;
  var confirmCallback = null;

  // --- DOM refs ---
  var fake404 = document.getElementById('examFake404');
  var examContent = document.getElementById('examContent');
  var startScreen = document.getElementById('examStartScreen');
  var inProgress = document.getElementById('examInProgress');
  var warningToast = document.getElementById('examWarningToast');
  var violationOverlay = document.getElementById('examViolationOverlay');
  var violationText = document.getElementById('examViolationText');
  var iframe = document.getElementById('examFrame');
  var examPage = document.getElementById('examContent');
  var confirmModal = document.getElementById('examConfirmModal');
  var confirmTitle = document.getElementById('examConfirmTitle');
  var confirmText = document.getElementById('examConfirmText');
  var confirmOk = document.getElementById('examConfirmOk');
  var confirmCancel = document.getElementById('examConfirmCancel');

  // --- 1. Token Validation ---
  var urlParams = new URLSearchParams(window.location.search);
  var urlToken = urlParams.get('token');
  var storedToken = sessionStorage.getItem('_exam_token');
  var examLink = sessionStorage.getItem('_exam_link');
  var examTitle = sessionStorage.getItem('_exam_title');

  if (!urlToken || urlToken !== storedToken) {
    // Tampilkan 404 palsu
    document.title = '404 - Halaman Tidak Ditemukan';
    document.getElementById('fake404Url').textContent = window.location.href;
    createFake404Particles();
    // Exam content sudah hidden by default — aman
  } else {
    // Token valid — tampilkan konten ujian
    document.title = examTitle || 'Ujian';
    fake404.style.display = 'none';
    examContent.style.display = 'flex';

    // Set judul
    document.getElementById('examTitle').textContent = examTitle || 'Ujian';
    document.getElementById('examStartTitle').textContent = examTitle || 'Ujian';

    // Inisialisasi tombol
    initExamPage();
  }

  // --- 2. Init Exam Page ---
  function initExamPage() {
    // Start button
    document.getElementById('examStartBtn').addEventListener('click', startExam);

    // Exit button
    document.getElementById('examExitBtn').addEventListener('click', exitExam);

    // Violation dismiss
    document.getElementById('examViolationBtn').addEventListener('click', dismissViolation);

    // Custom confirm modal
    confirmOk.addEventListener('click', function() {
      if (typeof confirmCallback === 'function') {
        confirmCallback(true);
      }
      confirmModal.style.display = 'none';
      confirmCallback = null;
    });

    confirmCancel.addEventListener('click', function() {
      if (typeof confirmCallback === 'function') {
        confirmCallback(false);
      }
      confirmModal.style.display = 'none';
      confirmCallback = null;
    });

    // Detect browser fullscreen changes
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('mozfullscreenchange', onFullscreenChange);
    document.addEventListener('MSFullscreenChange', onFullscreenChange);

    // Detect tab visibility changes
    document.addEventListener('visibilitychange', onVisibilityChange);
  }

  // --- 3. Start Exam ---
  function startExam() {
    if (examStarted) return;
    examStarted = true;

    // Hide start screen, show exam in progress
    startScreen.style.display = 'none';
    inProgress.style.display = 'flex';

    // Load the form in iframe
    if (examLink) {
      iframe.src = examLink;
    }

    // Request fullscreen
    requestFullscreen();

    // Warn about leaving
    warnedOnce = false;
  }

  // --- 4. Fullscreen ---
  function requestFullscreen() {
    var el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(function() {
        // User might deny fullscreen — tetap lanjut
        showWarning('Aktifkan mode layar penuh untuk pengalaman terbaik.');
      });
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    } else if (el.mozRequestFullScreen) {
      el.mozRequestFullScreen();
    } else if (el.msRequestFullscreen) {
      el.msRequestFullscreen();
    }
  }

  function exitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(function() {});
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }

  function isPageFullscreen() {
    return !!(document.fullscreenElement || 
              document.webkitFullscreenElement || 
              document.mozFullScreenElement || 
              document.msFullscreenElement);
  }

  function onFullscreenChange() {
    isFullscreen = isPageFullscreen();
    
    if (examStarted && !isFullscreen) {
      // User exited fullscreen — warning
      showWarning('Mode layar penuh dinonaktifkan. Aktifkan kembali untuk kenyamanan ujian.');
    }
  }

  // --- 5. Anti-Cheat: Tab Switch Detection ---
  function onVisibilityChange() {
    if (!examStarted) return;

    if (document.hidden) {
      // User switched tabs / minimized
      showViolation('Anda keluar dari halaman ujian!');
    }
  }

  // --- 6. Warning System ---
  function showWarning(message) {
    warningToast.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> ' + message;
    warningToast.style.display = 'flex';

    // Auto-hide after 4 seconds
    clearTimeout(warningToast._timeout);
    warningToast._timeout = setTimeout(function() {
      warningToast.style.display = 'none';
    }, 4000);
  }

  function showViolation(message) {
    violationText.textContent = message;
    violationOverlay.style.display = 'flex';

    // Track violation via analytics
    if (typeof trackEvent === 'function') {
      try {
        trackEvent('Ujian', 'violation', message);
      } catch(e) {}
    }

    warnedOnce = true;
  }

  function dismissViolation() {
    violationOverlay.style.display = 'none';
  }

  // --- 7. Custom Confirm ---
  function showConfirm(title, message, callback) {
    confirmTitle.textContent = title;
    confirmText.textContent = message;
    confirmCallback = callback;
    confirmModal.style.display = 'flex';
  }

  // --- 8. Exit Exam ---
  function exitExam() {
    if (!examStarted) {
      // Belum mulai — langsung redirect
      window.location.href = '/';
      return;
    }

    // Custom confirm — bukan confirm() browser
    showConfirm(
      'Yakin ingin keluar?',
      'Progress ujian Anda akan hilang dan tidak bisa dilanjutkan kembali.',
      function(confirmed) {
        if (confirmed) {
          exitFullscreen();
          sessionStorage.removeItem('_exam_token');
          sessionStorage.removeItem('_exam_link');
          sessionStorage.removeItem('_exam_title');
          window.location.href = '/';
        }
      }
    );
  }

  // --- 9. Fake 404 Particles ---
  function createFake404Particles() {
    var container = document.getElementById('fake404Particles');
    if (!container) return;

    for (var i = 0; i < 20; i++) {
      var particle = document.createElement('div');
      particle.className = 'particle';
      var size = Math.random() * 20 + 5;
      particle.style.width = size + 'px';
      particle.style.height = size + 'px';
      particle.style.left = (Math.random() * 100) + '%';
      particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
      particle.style.animationDelay = (Math.random() * 5) + 's';
      container.appendChild(particle);
    }
  }

})();
