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
  var timeUp = false;
  var examCompleted = false;
  var _blurTimer = null;

  // Timer state
  var examDuration = 90; // menit, default
  var timeRemaining = 0; // detik
  var timerInterval = null;
  var timerEl = null;

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
  var permCheck = document.getElementById('examPermCheck');
  var startBtn = document.getElementById('examStartBtn');
  var durationDisplay = document.getElementById('examDurationDisplay');
  var finishBtn = document.getElementById('examFinishBtn');
  var completionOverlay = document.getElementById('examCompletionOverlay');
  var completionBtn = document.getElementById('examCompletionBtn');

  // --- 1. Token Validation ---
  var urlParams = new URLSearchParams(window.location.search);
  var urlToken = urlParams.get('token');
  var storedToken = sessionStorage.getItem('_exam_token');
  var examLink = sessionStorage.getItem('_exam_link');
  var examTitle = sessionStorage.getItem('_exam_title');
  var examEndDate = sessionStorage.getItem('_exam_end_date');

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
    // Timer refs
    timerEl = document.getElementById('examTimer');


    // Set durasi dari config
    if (typeof SITE_CONFIG !== 'undefined' && SITE_CONFIG.exam && SITE_CONFIG.exam.duration) {
      examDuration = parseInt(SITE_CONFIG.exam.duration, 10) || 90;
    }
    if (durationDisplay) {
      durationDisplay.textContent = examDuration;
    }

    // Permission checkbox → enable/disable start button
    if (permCheck) {
      permCheck.addEventListener('change', function() {
        startBtn.disabled = !permCheck.checked;
      });
    }

    // Start button
    startBtn.addEventListener('click', startExam);

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

    // Detect window blur (notification panel, control center, alt+tab)
    window.addEventListener('blur', onWindowBlur);
    window.addEventListener('focus', onWindowFocus);

    // Track iframe focus untuk mencegah false positive dari window.blur
    initIframeFocusTracking();

    // Selesai button
    if (finishBtn) {
      finishBtn.addEventListener('click', onFinishExam);
    }

    // Completion button → kembali ke beranda
    if (completionBtn) {
      completionBtn.addEventListener('click', function() {
        exitFullscreen();
        sessionStorage.removeItem('_exam_token');
        sessionStorage.removeItem('_exam_link');
        sessionStorage.removeItem('_exam_title');
        sessionStorage.removeItem('_exam_end_date');
        window.location.href = '/';
      });
    }
  }

  // --- 3. Start Exam ---
  function startExam() {
    if (examStarted) return;
    if (permCheck && !permCheck.checked) return;

    examStarted = true;

    // Hide start screen, show exam in progress
    startScreen.style.display = 'none';
    inProgress.style.display = 'flex';

    // Load the form in iframe
    if (examLink) {
      iframe.src = examLink;
    }

    // Mulai timer
    startTimer();

    // Request fullscreen
    requestFullscreen();

    // Tampilkan tombol Selesai
    if (finishBtn) finishBtn.style.display = 'flex';

    // Warn about leaving
    warnedOnce = false;

    // Analytics
    if (typeof trackEvent === 'function') {
      try {
        trackEvent('Ujian', 'start', examTitle || 'Ujian', examDuration);
      } catch(e) {}
    }
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
      // User exited fullscreen — violation overlay (blocking!)
      showViolation('Mode layar penuh dinonaktifkan! Aktifkan kembali layar penuh untuk melanjutkan ujian.');
    } else if (examStarted && isFullscreen && violationOverlay.style.display === 'flex') {
      // User re-entered fullscreen — dismiss violation (kecuali waktu habis)
      if (timeUp) return;
      dismissViolation();
    }
  }

  // --- 5. Timer (hitungan mundur) ---
  function startTimer() {
    timeRemaining = examDuration * 60; // konversi menit ke detik

    // Tampilkan timer
    if (timerEl) {
      timerEl.style.display = 'flex';
    }

    // Update display immediately
    updateTimerDisplay();

    // Countdown setiap detik
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(function() {
      timeRemaining--;

      if (timeRemaining <= 0) {
        // Waktu habis
        timeRemaining = 0;
        updateTimerDisplay();
        stopTimer();
        onTimeUp();
        return;
      }

      updateTimerDisplay();

      // Warning states
      if (timerEl) {
        if (timeRemaining <= 60) {
          // < 1 menit: critical (merah berkedip)
          timerEl.classList.add('exam-timer--critical');
          timerEl.classList.remove('exam-timer--warning');
        } else if (timeRemaining <= 300) {
          // < 5 menit: warning
          timerEl.classList.add('exam-timer--warning');
          timerEl.classList.remove('exam-timer--critical');
        } else {
          timerEl.classList.remove('exam-timer--warning', 'exam-timer--critical');
        }
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    if (!timerEl) return;

    var minutes = Math.floor(timeRemaining / 60);
    var seconds = timeRemaining % 60;
    var timeStr = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');

    var displayEl = document.getElementById('examTimerDisplay');
    if (!displayEl) return;

    // Ambil hanya digit (skip separator)
    var digitEls = displayEl.querySelectorAll('.exam-timer__digit');
    var digitChars = timeStr.replace(':', '');

    for (var i = 0; i < digitEls.length; i++) {
      var el = digitEls[i];
      var newChar = digitChars[i];
      var oldVal = el.getAttribute('data-value');

      if (oldVal !== newChar) {
        el.setAttribute('data-value', newChar);
        el.textContent = newChar;
        // Trigger animasi slide dari atas
        el.classList.remove('exam-timer__digit--change');
        void el.offsetWidth;
        el.classList.add('exam-timer__digit--change');
      }
    }
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function onTimeUp() {
    timeUp = true;

    // Waktu habis — tampilkan pesan
    showViolation('Waktu pengerjaan telah habis!');

    // Ganti tombol jadi redirect (dengan proper event listener, bukan onclick)
    var btn = document.getElementById('examViolationBtn');
    if (btn) {
      // Hapus listener lama agar tidak dual fire
      btn.removeEventListener('click', dismissViolation);
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Kembali ke Beranda';
      btn.addEventListener('click', function onTimeUpClick() {
        exitFullscreen();
        sessionStorage.removeItem('_exam_token');
        sessionStorage.removeItem('_exam_link');
        sessionStorage.removeItem('_exam_title');
        sessionStorage.removeItem('_exam_end_date');
        window.location.href = '/';
      });
    }
  }

  // --- 6. Anti-Cheat: Window Blur Detection ---
  // Mendeteksi: notification panel, control center, alt+tab
  // NOTE: window.blur juga bisa terpicu saat user berinteraksi dengan iframe (Google Form).
  //       Kita harus bedakan: blur karena pindah ke iframe (bukan pelanggaran) vs blur karena
  //       user benar-benar meninggalkan halaman (pelanggaran).
  var _iframeHasFocus = false;

  // Track iframe focus state — ketika user klik di dalam iframe, iframe element mendapat focus
  function initIframeFocusTracking() {
    var frame = document.getElementById('examFrame');
    if (!frame) return;

    frame.addEventListener('focus', function() {
      _iframeHasFocus = true;
    });

    frame.addEventListener('blur', function() {
      _iframeHasFocus = false;
    });
  }

  function isIframeFocused() {
    // Cek via flag event listener
    if (_iframeHasFocus) return true;
    // Fallback: cek document.activeElement
    try {
      var active = document.activeElement;
      if (active && (active.id === 'examFrame' || active.tagName === 'IFRAME')) {
        return true;
      }
    } catch(e) {}
    return false;
  }

  function onWindowBlur() {
    if (!examStarted || timeUp || examCompleted) return;

    // Jika blur disebabkan oleh user berinteraksi dengan iframe (Google Form), abaikan
    if (isIframeFocused()) return;

    if (_blurTimer) clearTimeout(_blurTimer);
    _blurTimer = setTimeout(function() {
      // Cek ulang — mungkin focus pindah ke iframe selama grace period
      if (isIframeFocused()) return;

      // Sudah ditangani visibilitychange
      if (document.hidden) return;

      // Notification panel / control center / alt+tab terdeteksi
      showViolation('Jangan membuka panel notifikasi atau meninggalkan halaman ujian!');

      // Jika blur berlangsung > 10 detik total → anggap user pindah ke link lain
      _blurTimer = setTimeout(function() {
        if (examCompleted || timeUp) return;
        if (!document.hidden && !isPageFullscreen()) {
          // User sudah terlalu lama di luar — anggap ujian selesai
          showCompletion();
        }
      }, 8500); // 8500ms tambahan = ~10s total
    }, 1500);
  }

  function onWindowFocus() {
    if (_blurTimer) {
      clearTimeout(_blurTimer);
      _blurTimer = null;
    }
  }

  // --- 7. Anti-Cheat: Tab Switch Detection ---
  function onVisibilityChange() {
    if (!examStarted || examCompleted) return;

    if (document.hidden) {
      // User switched tabs / minimized
      showViolation('Anda keluar dari halaman ujian!');
    }
  }

  // --- 8. Completion Screen ---
  function showCompletion() {
    if (examCompleted) return;
    examCompleted = true;

    // Stop timer
    stopTimer();

    // Sembunyikan overlay lain
    violationOverlay.style.display = 'none';
    warningToast.style.display = 'none';
    confirmModal.style.display = 'none';

    // Update timer jadi 00:00
    timeRemaining = 0;
    updateTimerDisplay();

    // Tampilkan completion overlay
    completionOverlay.style.display = 'flex';

    // Simpan submission cache ke localStorage
    saveSubmissionCache();

    // Track via analytics
    if (typeof trackEvent === 'function') {
      try {
        trackEvent('Ujian', 'complete', examTitle || 'Ujian');
      } catch(e) {}
    }
  }

  function onFinishExam() {
    if (examCompleted || timeUp || !examStarted) return;

    // Konfirmasi user
    showConfirm(
      'Kirim jawaban?',
      'Pastikan Anda sudah selesai mengerjakan sebelum mengirim. Jawaban tidak dapat diubah setelah ini.',
      function(confirmed) {
        if (confirmed) {
          showCompletion();
        }
      }
    );
  }

  // --- 9. Submission Cache ---
  function generateExamId(title, endDate) {
    var raw = (title || '') + '|' + (endDate || '');
    return raw.toLowerCase().replace(/[^a-z0-9|]/g, '_');
  }

  function saveSubmissionCache() {
    if (!examTitle && !examEndDate) return;

    var examId = generateExamId(examTitle, examEndDate);
    var cacheKey = '_exam_submitted_' + examId;
    var payload = JSON.stringify({
      completedAt: new Date().toISOString(),
      title: examTitle || '',
      endDate: examEndDate || ''
    });

    try {
      localStorage.setItem(cacheKey, payload);
    } catch(e) {
      // localStorage mungkin penuh — ignore
    }
  }

  // --- 10. Warning System ---
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
    // Jika waktu sudah habis, jangan dismiss — biarkan button redirect
    if (timeUp) return;

    // Hanya dismiss jika benar-benar fullscreen
    if (!isPageFullscreen()) {
      // Belum fullscreen — minta lagi dan jangan dismiss
      requestFullscreen();
      showWarning('Anda harus mengaktifkan layar penuh untuk melanjutkan ujian.');
      return;
    }
    violationOverlay.style.display = 'none';
  }

  // --- 11. Custom Confirm ---
  function showConfirm(title, message, callback) {
    confirmTitle.textContent = title;
    confirmText.textContent = message;
    confirmCallback = callback;
    confirmModal.style.display = 'flex';
  }

  // --- 12. Exit Exam ---
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
          sessionStorage.removeItem('_exam_end_date');
          window.location.href = '/';
        }
      }
    );
  }

  // --- 13. Fake 404 Particles ---
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
