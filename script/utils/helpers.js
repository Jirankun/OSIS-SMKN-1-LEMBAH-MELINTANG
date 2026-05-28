/**
 * Utility: Render list item dengan aman.
 * Jika data kosong/error, elemen target TIDAK dirender sama sekali (hidden via CSS/DOM).
 * Error hanya dicatat di Console, tidak ditampilkan ke User.
 */
function safeRenderList(containerId, data, renderCallback) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Reset isi container
    container.innerHTML = '';

    // Validasi data
    if (!data || (Array.isArray(data) && data.length === 0)) {
        // Jika kosong, biarkan container kosong (CSS akan handle layout-nya)
        // Jangan tampilkan pesan error ke user
        container.style.display = 'none'; // Sembunyikan container jika kosong
        return;
    }

    // Pastikan data berupa array
    const items = Array.isArray(data) ? data : [data];

    try {
        items.forEach((item, index) => {
            const element = renderCallback(item, index);
            if (element) container.appendChild(element);
        });
        
        // Tampilkan container hanya jika ada isi
        container.style.display = ''; 
    } catch (error) {
        container.innerHTML = ''; // Clear partial render jika crash
        container.style.display = 'none';
    }
}

/**
 * Utility: Fetch JSON dengan error handling silent untuk UI.
 */
async function fetchJsonSilent(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        return null; // Kembalikan null, caller harus handle (biasanya tidak merender apa-apa)
    }
}

/**
 * Utility: Format tanggal ke Bahasa Indonesia
 */
function formatDateIndo(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

/**
 * Security: Proteksi konten (Anti Select, Anti DragDrop, Anti Tap Lama, Anti Klik Kanan)
 * Tidak mengganggu interaksi normal seperti klik link, scroll, atau input form.
 */
function enableContentProtection() {
    // 1. Anti Select Text (CSS & JS)
    document.addEventListener('selectstart', (e) => {
        // Izinkan select pada input dan textarea agar user tetap bisa copy-paste di form
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return true;
        }
        e.preventDefault();
        return false;
    });

    // 2. Anti Drag & Drop (Gambar & Elemen)
    document.addEventListener('dragstart', (e) => {
        e.preventDefault();
        return false;
    });

    // 3. Anti Klik Kanan (Context Menu)
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });

    // 4. Anti Tap Lama (Mobile) - Mencegah menu konteks bawaan browser
    let touchTimer;
    document.addEventListener('touchstart', (e) => {
        // Jangan aktifkan jika target adalah input/textarea
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // Set timer untuk mendeteksi tap lama (>500ms)
        touchTimer = setTimeout(() => {
            // Jika masih tertahan setelah 500ms, cegah default behavior (menu konteks)
            // dengan cara mengabaikannya, browser modern biasanya menangani ini dengan CSS
        }, 500);
    }, { passive: true });

    document.addEventListener('touchend', () => {
        clearTimeout(touchTimer);
    });

    document.addEventListener('touchmove', () => {
        clearTimeout(touchTimer);
    });

    // Tambahan: CSS Injection untuk user-select none secara global
    const styleId = 'content-protection-style';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            body {
                -webkit-user-select: none; /* Safari */
                -moz-user-select: none;    /* Firefox */
                -ms-user-select: none;     /* IE10+/Edge */
                user-select: none;         /* Standard */
                -webkit-touch-callout: none; /* iOS Safari: disable callout menu */
            }
            /* Pengecualian untuk elemen form agar tetap bisa input teks */
            input, textarea, [contenteditable="true"] {
                -webkit-user-select: text !important;
                -moz-user-select: text !important;
                -ms-user-select: text !important;
                user-select: text !important;
                -webkit-touch-callout: default !important;
            }
        `;
        document.head.appendChild(style);
    }

}

// Otomatis jalankan proteksi jika DOM sudah siap
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enableContentProtection);
} else {
    enableContentProtection();
}
