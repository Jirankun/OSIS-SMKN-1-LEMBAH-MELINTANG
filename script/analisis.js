/**
 * analisis.js - Google Analytics 4 & Cloudflare Analytics Handler
 * OSIS SMKN 1 Lembah Melintang - Page Specific Tracking
 * Author: Zhyllan Fyllah
 * License: MIT
 * 
 * IDs:
 * - GA4: G-QHRQR1XVHY
 * - Cloudflare: 934f8410977c4b05834992de5453dafd
 */

(function() {
    'use strict';

    // === KONFIGURASI ===
    const CONFIG = {
        // Google Analytics 4
        ga4: {
            id: 'G-QHRQR1XVHY',
            enabled: true
        },
        // Cloudflare Web Analytics
        cloudflare: {
            token: '934f8410977c4b05834992de5453dafd',
            enabled: true
        },
        // Debug mode (set false kalo udah production)
        debug: false,
        // Page mapping buat custom tracking
        pageConfig: {
            'index.html': { category: 'Home', section: 'Beranda' },
            'berita/index.html': { category: 'Berita', section: 'News' },
            'pengumuman/index.html': { category: 'Pengumuman', section: 'Announcement' },
            'agenda/index.html': { category: 'Agenda', section: 'Events' },
            'galeri/index.html': { category: 'Galeri', section: 'Gallery' },
            'profil_osis/index.html': { category: 'Profil', section: 'About' },
            'proker/index.html': { category: 'Proker', section: 'Programs' },
            'privacy/index.html': { category: 'Legal', section: 'Privacy' },
            // Default fallback
            'default': { category: 'General', section: 'Other' }
        }
    };

    // === HELPER: Deteksi halaman saat ini ===
    function getCurrentPageConfig() {
        const path = window.location.pathname;
        const filename = path.split('/').pop() || 'index.html';
        
        // Cocokin sama config, kalo gak ada pake default
        return CONFIG.pageConfig[filename] || CONFIG.pageConfig['default'];
    }

    // === HELPER: Bersihin page title ===
    function getCleanPageTitle() {
        let title = document.title.trim();
        // Hapus suffix " | OSIS SMKN 1" biar lebih clean
        return title.replace(/\s*\|\s*.*$/, '') || 'OSIS SMKN 1 Lembah Melintang';
    }

    // === HELPER: Format page path untuk GA4 ===
    function getPagePath() {
        return window.location.pathname + window.location.search;
    }

    // === GOOGLE ANALYTICS 4 ===
    function initGA4() {
        if (!CONFIG.ga4.enabled || !CONFIG.ga4.id) {
            if (CONFIG.debug) console.warn('[Analisis] GA4 disabled or ID missing');
            return;
        }

        // Load gtag.js
        (function() {
            var script = document.createElement('script');
            script.async = true;
            script.src = 'https://www.googletagmanager.com/gtag/js?id=' + CONFIG.ga4.id;
            document.head.appendChild(script);
        })();

        // Setup gtag
        window.dataLayer = window.dataLayer || [];
        function gtag(){ dataLayer.push(arguments); }
        window.gtag = gtag;
        
        gtag('js', new Date());

        // Config page view dengan custom params
        const pageCfg = getCurrentPageConfig();
        gtag('config', CONFIG.ga4.id, {
            send_page_view: true,
            page_title: getCleanPageTitle(),
            page_location: window.location.href,
            page_path: getPagePath(),
            // Custom dimensions (harus didaftarin di GA4 Admin > Custom Definitions)
            content_group: pageCfg.category,
            page_section: pageCfg.section,
            anonymize_ip: true
        });

        if (CONFIG.debug) {
            console.log('[Analisis] ✅ GA4 Initialized:', CONFIG.ga4.id);
            console.log('[Analisis] 📄 Page Tracked:', { 
                title: getCleanPageTitle(), 
                path: getPagePath(), 
                ...pageCfg 
            });
        }
    }

    // === CLOUDFLARE WEB ANALYTICS ===
    function initCloudflare() {
        if (!CONFIG.cloudflare.enabled || !CONFIG.cloudflare.token) {
            if (CONFIG.debug) console.warn('[Analisis] Cloudflare Analytics disabled or token missing');
            return;
        }

        // Load Cloudflare Beacon
        (function() {
            var script = document.createElement('script');
            script.defer = true;
            script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
            script.setAttribute('data-cf-beacon', JSON.stringify({
                token: CONFIG.cloudflare.token
            }));
            document.head.appendChild(script);
        })();

        if (CONFIG.debug) {
            console.log('[Analisis] ✅ Cloudflare Analytics Initialized');
        }
    }

    // === PUBLIC: Track Custom Event ===
    // Pakai: trackEvent('Engagement', 'click', 'Tombol Download', 1);
    window.trackEvent = function(category, action, label, value) {
        if (typeof gtag !== 'undefined' && CONFIG.ga4.enabled) {
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

    // === PUBLIC: Track Manual Page View (buat SPA / dynamic load) ===
    // Pakai: trackPageView('/page/berita/detail.html', 'Judul Berita');
    window.trackPageView = function(customPath, customTitle) {
        if (typeof gtag === 'undefined' || !CONFIG.ga4.enabled) return;
        
        const pageCfg = getCurrentPageConfig();
        gtag('event', 'page_view', {
            page_title: customTitle || getCleanPageTitle(),
            page_location: window.location.href,
            page_path: customPath || getPagePath(),
            content_group: pageCfg.category,
            page_section: pageCfg.section
        });
        
        if (CONFIG.debug) {
            console.log('[Analisis] 🔄 Manual Page View Tracked');
        }
    };

    // === INIT ===
    function init() {
        // Tunggu DOM ready biar gak bentrok
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                initGA4();
                initCloudflare();
            });
        } else {
            initGA4();
            initCloudflare();
        }
    }

    // === SPA NAVIGATION SUPPORT (History API) ===
    // Biar GA4 tetep track kalo user navigasi pake JS tanpa reload
    if (window.history && window.history.pushState) {
        const originalPushState = history.pushState;
        history.pushState = function(state, title, url) {
            originalPushState.apply(this, arguments);
            // Delay dikit biar DOM update dulu
            setTimeout(() => {
                if (typeof trackPageView === 'function') {
                    trackPageView();
                }
            }, 100);
        };

        // Handle browser back/forward button
        window.addEventListener('popstate', function() {
            if (typeof trackPageView === 'function') {
                trackPageView();
            }
        });
    }

    // Jalankan!
    init();

})();
