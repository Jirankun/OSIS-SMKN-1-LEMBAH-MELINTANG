/**
 * analisis.js - Google Analytics 4 & Cloudflare Analytics Handler
 * OSIS SMKN 1 Lembah Melintang - ALL-IN-ONE TRACKING
 * Author: Zhyllan Fyllah
 * License: MIT
 * 
 * 1 script flag untuk semuanya:
 * - GA4 page view + Cloudflare
 * - Auto click tracking (semua klik di seluruh halaman)
 * - Scroll depth (25%, 50%, 75%, 100%)
 * - Time on page
 * - SPA navigation
 * 
 * IDs:
 * - GA4: G-QHRQR1XVHY
 * - Cloudflare: 934f8410977c4b05834992de5453dafd
 */

(function() {
    'use strict';

    // === KONFIGURASI ===
    const CONFIG = {
        ga4: {
            id: 'G-QHRQR1XVHY',
            enabled: true
        },
        cloudflare: {
            token: '934f8410977c4b05834992de5453dafd',
            enabled: true
        },
        debug: false,
        pageConfig: {
            'index.html': { category: 'Home', section: 'Beranda' },
            'berita/index.html': { category: 'Berita', section: 'News' },
            'pengumuman/index.html': { category: 'Pengumuman', section: 'Announcement' },
            'agenda/index.html': { category: 'Agenda', section: 'Events' },
            'galeri/index.html': { category: 'Galeri', section: 'Gallery' },
            'profil_osis/index.html': { category: 'Profil', section: 'About' },
            'proker/index.html': { category: 'Proker', section: 'Programs' },
            'privacy/index.html': { category: 'Legal', section: 'Privacy' },
            'default': { category: 'General', section: 'Other' }
        }
    };

    // ================================================
    // HELPERS
    // ================================================

    function getCurrentPageConfig() {
        const path = window.location.pathname;
        const filename = path.split('/').pop() || 'index.html';
        return CONFIG.pageConfig[filename] || CONFIG.pageConfig['default'];
    }

    function getCleanPageTitle() {
        let title = document.title.trim();
        return title.replace(/\s*\|\s*.*$/, '') || 'OSIS SMKN 1 Lembah Melintang';
    }

    function getPagePath() {
        return window.location.pathname + window.location.search;
    }

    function isGtagReady() {
        return typeof gtag !== 'undefined' && CONFIG.ga4.enabled;
    }

    // ================================================
    // GOOGLE ANALYTICS 4
    // ================================================

    function initGA4() {
        if (!CONFIG.ga4.enabled || !CONFIG.ga4.id) {
            if (CONFIG.debug) console.warn('[Analisis] GA4 disabled or ID missing');
            return;
        }

        (function() {
            var script = document.createElement('script');
            script.async = true;
            script.src = 'https://www.googletagmanager.com/gtag/js?id=' + CONFIG.ga4.id;
            document.head.appendChild(script);
        })();

        window.dataLayer = window.dataLayer || [];
        function gtag(){ dataLayer.push(arguments); }
        window.gtag = gtag;
        
        gtag('js', new Date());

        const pageCfg = getCurrentPageConfig();
        gtag('config', CONFIG.ga4.id, {
            send_page_view: true,
            page_title: getCleanPageTitle(),
            page_location: window.location.href,
            page_path: getPagePath(),
            content_group: pageCfg.category,
            page_section: pageCfg.section,
            anonymize_ip: true
        });

        if (CONFIG.debug) {
            console.log('[Analisis] ✅ GA4 Initialized:', CONFIG.ga4.id);
        }
    }

    // ================================================
    // CLOUDFLARE WEB ANALYTICS
    // ================================================

    function initCloudflare() {
        if (!CONFIG.cloudflare.enabled || !CONFIG.cloudflare.token) {
            if (CONFIG.debug) console.warn('[Analisis] Cloudflare Analytics disabled');
            return;
        }

        (function() {
            var script = document.createElement('script');
            script.defer = true;
            script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
            script.setAttribute('data-cf-beacon', JSON.stringify({
                token: CONFIG.cloudflare.token
            }));
            document.head.appendChild(script);
        })();

        if (CONFIG.debug) console.log('[Analisis] ✅ Cloudflare Analytics Initialized');
    }

    // ================================================
    // PUBLIC: trackEvent()
    // ================================================

    window.trackEvent = function(category, action, label, value) {
        if (isGtagReady()) {
            gtag('event', action, {
                event_category: category,
                event_label: label,
                value: value,
                content_group: getCurrentPageConfig().category,
                page_section: getCurrentPageConfig().section
            });
            if (CONFIG.debug) {
                console.log('[Analisis] 🎯 Event Tracked:', { category, action, label, value });
            }
        }
    };

    // ================================================
    // PUBLIC: trackPageView()
    // ================================================

    window.trackPageView = function(customPath, customTitle) {
        if (!isGtagReady()) return;
        
        const pageCfg = getCurrentPageConfig();
        gtag('event', 'page_view', {
            page_title: customTitle || getCleanPageTitle(),
            page_location: window.location.href,
            page_path: customPath || getPagePath(),
            content_group: pageCfg.category,
            page_section: pageCfg.section
        });
    };

    // ================================================
    // AUTO CLICK TRACKING — event delegation 1x
    // Melacak SEMUA klik: link, tombol, card, dll
    // ================================================

    function initClickTracking() {
        document.addEventListener('click', function(e) {
            // Cari elemen yang bisa diklik (anchor, button, card, item)
            var target = e.target.closest('a, button, [role="button"], .card, .berita-item, .agenda-item, .pengumuman-item, .galeri-item, .galeri-full-item, .inti-card, .member-mini, .pengurus-card');
            if (!target) return;

            var tagName = target.tagName.toLowerCase();
            var href = target.getAttribute('href') || '';
            var text = (target.textContent || '').trim().substring(0, 120);
            var category = 'Click';
            var action = 'click';
            var label = text || 'Unknown';
            var trackIt = true;

            // === KATEGORI: Social Media (cek dulu biar gak kejebak Navigation) ===
            if (tagName === 'a' && target.closest('[class*="social"]')) {
                category = 'Social';
                label = href;
            }
            // === KATEGORI: Navigasi ===
            else if (tagName === 'a' && (target.closest('.navbar, #navLinks, #mobileMenu, .footer__links') || target.closest('[class*="nav"]:not([class*="social"])'))) {
                if (href.startsWith('http') || href.startsWith('//')) {
                    category = 'Outbound';
                    label = href;
                } else {
                    category = 'Navigation';
                    label = text || href;
                }
            }
            // === KATEGORI: Konten (Card / Berita / dll) ===
            else if (target.classList.contains('card') || target.closest('.card, .berita-item, .agenda-item, .pengumuman-item')) {
                category = 'Content';
                var titleEl = target.querySelector('.card__title, .berita-item__title, .agenda-item__title, .pengumuman-item__title');
                label = titleEl ? titleEl.textContent.trim().substring(0, 100) : (text || 'Content');
            }
            // === KATEGORI: Galeri ===
            else if (target.classList.contains('galeri-item') || target.classList.contains('galeri-full-item') || target.closest('.galeri-item, .galeri-full-item')) {
                category = 'Gallery';
                label = 'Foto galeri';
            }
            // === KATEGORI: Profil / Anggota ===
            else if (target.classList.contains('inti-card') || target.classList.contains('member-mini') || target.classList.contains('pengurus-card') || target.closest('.inti-card, .member-mini, .pengurus-card')) {
                category = 'Profile';
                var nameEl = target.querySelector('.inti-card__name, .member-mini__name, .pengurus-card__name');
                label = nameEl ? nameEl.textContent.trim() : (text || 'Anggota');
            }
            // === KATEGORI: Tombol ===
            else if (tagName === 'button' || target.getAttribute('role') === 'button') {
                category = 'Button';
                label = text || target.className || 'Button';
            }
            // === KATEGORI: Link umum ===
            else if (tagName === 'a') {
                if (href.startsWith('#') || href.startsWith('javascript:')) {
                    category = 'Anchor';
                    label = href;
                } else if (href.startsWith('http') || href.startsWith('//')) {
                    category = 'Outbound';
                    label = href;
                } else if (href.match(/\.(pdf|docx?|xlsx?|pptx?|zip|rar)$/i)) {
                    category = 'Download';
                    label = href.split('/').pop() || href;
                } else {
                    category = 'Internal Link';
                    label = text || href;
                }
            }
            // === KATEGORI: Lainnya ===
            else {
                trackIt = false;
            }

            if (trackIt) {
                try {
                    window.trackEvent(category, action, label, 1);
                } catch(e) {
                    if (CONFIG.debug) console.warn('[Analisis] Click track error:', e);
                }
            }
        }, { passive: true });
    }

    // ================================================
    // SCROLL DEPTH TRACKING
    // ================================================

    function initScrollTracking() {
        var milestones = [25, 50, 75, 90, 100];
        var tracked = {};
        milestones.forEach(function(m) { tracked[m] = false; });

        var ticking = false;
        window.addEventListener('scroll', function() {
            if (!ticking) {
                window.requestAnimationFrame(function() {
                    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
                    if (docHeight <= 0) { ticking = false; return; }

                    var scrollPercent = Math.round((window.scrollY / docHeight) * 100);
                    
                    milestones.forEach(function(m) {
                        if (scrollPercent >= m && !tracked[m]) {
                            tracked[m] = true;
                            try {
                                window.trackEvent('Scroll', 'scroll_' + m + '%', getCleanPageTitle(), m);
                            } catch(e) {}
                        }
                    });

                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    // ================================================
    // TIME ON PAGE TRACKING
    // ================================================

    function initTimeTracking() {
        var startTime = Date.now();
        var trackedSeconds = [30, 60, 120, 180, 300]; // 30s, 1m, 2m, 3m, 5m
        var trackedTimers = {};
        var exitTracked = false; // guard biar gak double-track
        trackedSeconds.forEach(function(s) { trackedTimers[s] = false; });

        // Cek setiap 10 detik
        var interval = setInterval(function() {
            var elapsed = Math.round((Date.now() - startTime) / 1000);
            
            trackedSeconds.forEach(function(s) {
                if (elapsed >= s && !trackedTimers[s]) {
                    trackedTimers[s] = true;
                    try {
                        window.trackEvent('Engagement', 'time_' + s + 's', getCleanPageTitle(), elapsed);
                    } catch(e) {}
                }
            });
        }, 10000);

        // Saat user meninggalkan halaman — track total durasi
        function trackFinalTime() {
            if (exitTracked) return; // cuma sekali
            exitTracked = true;
            clearInterval(interval);
            var seconds = Math.round((Date.now() - startTime) / 1000);
            if (seconds >= 10) {
                try {
                    window.trackEvent('Engagement', 'time_on_page', getCleanPageTitle(), seconds);
                } catch(e) {}
            }
        }

        // beforeunload = tab ditutup / navigasi
        window.addEventListener('beforeunload', trackFinalTime);
        // visibilitychange = tab disembunyikan (tapi jangan double-track)
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                trackFinalTime();
            }
        }, { once: true }); // sekali aja cukup
    }

    // ================================================
    // SPA NAVIGATION SUPPORT (History API)
    // ================================================

    function initSPATracking() {
        if (window.history && window.history.pushState) {
            var originalPushState = history.pushState;
            history.pushState = function(state, title, url) {
                originalPushState.apply(this, arguments);
                setTimeout(function() {
                    if (typeof trackPageView === 'function') {
                        trackPageView();
                    }
                }, 100);
            };

            window.addEventListener('popstate', function() {
                setTimeout(function() {
                    if (typeof trackPageView === 'function') {
                        trackPageView();
                    }
                }, 100);
            });
        }
    }

    // ================================================
    // INIT — 1 kali jalan, semua fitur nyala
    // ================================================

    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                initGA4();
                initCloudflare();
            });
        } else {
            initGA4();
            initCloudflare();
        }

        // Auto tracking — jalan terpisah dari GA4 init
        // Karena gak butuh gtag ready, cuma butuh DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                initClickTracking();
                initScrollTracking();
                initTimeTracking();
            });
        } else {
            initClickTracking();
            initScrollTracking();
            initTimeTracking();
        }
    }

    init();
    initSPATracking();

})();
