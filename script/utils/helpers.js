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
        console.log(`[Info] Kontainer #${containerId} kosong, tidak ada data untuk ditampilkan.`);
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
        console.error(`[Error] Gagal merender #${containerId}:`, error);
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
        console.error(`[Fetch Error] Gagal mengambil data dari ${url}:`, error.message);
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
