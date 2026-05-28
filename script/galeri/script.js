// ================================================
// GALERI PAGE SCRIPT
// ================================================

// ================================================
// CORE INIT
// ================================================
document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('year').textContent = new Date().getFullYear();
  document.title = `Galeri - ${SITE_CONFIG.school.osis}`;
  renderNavbar();
  renderFooter(3);
  await loadGallery();
  initLightbox();
  initMenuHistoryClear(); // Reset history saat navigasi menu
  initScrollObserver('.galeri-full-item');
  initBackToTop();
});

// ================================================
// LOAD GALERI
// ================================================
async function loadGallery() {
  const grid = document.getElementById('galeriFullGrid');
  if (!grid) return;
  
  grid.innerHTML = '<div class="empty-state"><i class="fa-solid fa-circle-notch fa-spin"></i><p>Memuat galeri...</p></div>';

  try {
    const rawData = await fetchJsonSilent('../../content/galeri.json', 'galeri');
    
    if (!rawData) {
      grid.innerHTML = emptyStateHTML('gallery', 'Belum ada galeri foto. Dokumentasi kegiatan akan segera ditambahkan!');
      return;
    }

    let items = Array.isArray(rawData) ? rawData : (rawData.galeri || rawData.data || []);

    if (!items.length) {
      grid.innerHTML = emptyStateHTML('gallery', 'Belum ada foto yang diunggah ke galeri.');
      return;
    }

    if (items[0]?.date) items.sort((a, b) => new Date(b.date) - new Date(a.date));

    grid.innerHTML = items.map((item, i) => {
      const imgUrl = resolveImage(item.image);
      const imgHTML = imgUrl 
        ? `<img src="${imgUrl}" alt="${item.title || 'Foto Kegiatan'}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">`
        : '';
      const placeholderHTML = `<div style="display:${imgUrl ? 'none' : 'flex'};align-items:center;justify-content:center;height:100%;background:#f3f4f6;"><i class="fa-solid fa-image" style="font-size:2rem;color:var(--gray-400)"></i></div>`;

      return `
        <div class="galeri-full-item fade-up" style="animation-delay:${i * 50}ms">
          ${imgHTML}
          ${placeholderHTML}
          <div class="galeri-full-item__overlay">
            <span class="galeri-full-item__zoom"><i class="fa-solid fa-magnifying-glass-plus"></i></span>
            <div class="galeri-full-item__title">${item.title || 'Tanpa Judul'}</div>
            <div class="galeri-full-item__date">${formatDateID(item.date)}</div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    grid.innerHTML = emptyStateHTML('error', 'Gagal memuat galeri.');
  }
}

// ================================================
// LIGHTBOX
// ================================================
let galleryDataCache = null;

function initLightbox() {
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightboxImg');
  const lbCaption = document.getElementById('lightboxCaption');
  const lbDescription = document.getElementById('lightboxDescription');
  const grid = document.getElementById('galeriFullGrid');
  if (!lb || !lbImg || !grid) return;

  // Simpan data galeri untuk referensi lightbox
  async function getGalleryData() {
    if (galleryDataCache) return galleryDataCache;
    try {
      const rawData = await fetchJsonSilent('../../content/galeri.json', 'galeri');
      let items = Array.isArray(rawData) ? rawData : (rawData.galeri || rawData.data || []);
      if (items[0]?.date) items.sort((a, b) => new Date(b.date) - new Date(a.date));
      galleryDataCache = items;
      return items;
    } catch (err) {
      return [];
    }
  }

  grid.addEventListener('click', async (e) => {
    const item = e.target.closest('.galeri-full-item');
    if (!item) return;
    const img = item.querySelector('img');
    if (img && img.src && img.style.display !== 'none') {
      // Cari data item yang sesuai berdasarkan src gambar
      const items = await getGalleryData();
      const imgSrc = img.src;
      const matchedItem = items.find(it => {
        const resolvedUrl = resolveImage(it.image);
        return resolvedUrl === imgSrc || it.image === imgSrc;
      });

      lbImg.src = img.src;
      
      // Update caption dan description jika ada
      if (lbCaption && matchedItem?.title) {
        lbCaption.textContent = matchedItem.title;
        lbCaption.style.display = 'block';
      } else if (lbCaption) {
        lbCaption.style.display = 'none';
      }
      
      if (lbDescription && matchedItem?.description) {
        lbDescription.textContent = matchedItem.description;
        lbDescription.style.display = 'block';
      } else if (lbDescription) {
        lbDescription.style.display = 'none';
      }
      
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  });

  const close = () => { 
    lb.classList.remove('open'); 
    document.body.style.overflow = '';
  };
  
  document.getElementById('lightboxClose')?.addEventListener('click', close);
  lb.addEventListener('click', e => { if(e.target === lb) close(); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape') close(); });
}
