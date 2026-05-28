// ================================================
// PROFIL OSIS PAGE SCRIPT
// ================================================

// ================================================
// CORE INIT
// ================================================
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('year').textContent = new Date().getFullYear();
  document.title = `Profil OSIS - ${SITE_CONFIG.school.osis}`;
  renderNavbar();
  renderFooter(3);
  loadTeamInti();
  loadTeamDivisi();
  initScrollObserver('.inti-card, .division-card');
  initBackToTop();
});

// ================================================
// LIGHTBOX FUNCTIONS
// ================================================
let lightboxModal = null;
let lightboxImage = null;
let lightboxName = null;
let lightboxRole = null;

function initLightbox() {
  lightboxModal = document.getElementById('lightboxModal');
  lightboxImage = document.getElementById('lightboxImage');
  lightboxName = document.getElementById('lightboxName');
  lightboxRole = document.getElementById('lightboxRole');
  
  if (!lightboxModal) return;
  
  // Close button
  const closeBtn = lightboxModal.querySelector('.lightbox-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeLightbox());
  }
  
  // Backdrop click
  const backdrop = lightboxModal.querySelector('.lightbox-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', () => closeLightbox());
  }
  
  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightboxModal.classList.contains('active')) {
      closeLightbox();
    }
  });
}

function openLightbox(imageSrc, name, role) {
  if (!lightboxModal) initLightbox();
  if (!lightboxModal) return;
  
  lightboxImage.src = imageSrc;
  lightboxImage.alt = name;
  lightboxName.textContent = name;
  lightboxRole.textContent = role;
  
  // Remove closing class if exists
  lightboxModal.classList.remove('closing');
  
  // Show modal
  lightboxModal.classList.add('active');
  lightboxModal.setAttribute('aria-hidden', 'false');
  
  // Prevent body scroll
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  if (!lightboxModal) return;
  
  // Add closing animation
  lightboxModal.classList.add('closing');
  
  // Wait for animation to finish
  setTimeout(() => {
    lightboxModal.classList.remove('active', 'closing');
    lightboxModal.setAttribute('aria-hidden', 'true');
    
    // Restore body scroll
    document.body.style.overflow = '';
  }, 300);
}

// ================================================
// LOAD PENGURUS INTI
// ================================================
async function loadTeamInti() {
  const grid = document.getElementById('gridInti');
  if (!grid) return;
  
  grid.innerHTML = '<div class="empty-state"><i class="fa-solid fa-circle-notch fa-spin"></i><p>Memuat pengurus inti...</p></div>';
  
  try {
    const rawData = await fetchJsonSilent('../../content/team_1.json', 'pengurus inti');
    
    if (!rawData) {
      grid.innerHTML = emptyStateHTML('users', 'Data pengurus inti belum tersedia.');
      return;
    }
    
    const members = Array.isArray(rawData) ? rawData : (rawData.team || rawData.data || []);

    if (!members.length) {
      grid.innerHTML = emptyStateHTML('users', 'Belum ada data pengurus inti.');
      return;
    }

    grid.innerHTML = members.map((m, i) => {
      const imgUrl = resolveImage(m.image);
      const isKetua = i === 0 ? ' inti-card--ketua' : '';
      const displayName = m.name || 'Tanpa Nama';
      const displayRole = m.role || 'Anggota';
      
      return `
        <div class="card inti-card${isKetua} fade-up" style="animation-delay:${i * 100}ms; cursor: pointer;" onclick="openLightbox('${imgUrl}', '${displayName.replace(/'/g, "\\'")}', '${displayRole.replace(/'/g, "\\'")}')">
          ${imgUrl 
            ? `<img src="${imgUrl}" alt="${displayName}" class="inti-card__img" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">`
            : ''}
          <div class="inti-card__placeholder" style="display:${imgUrl ? 'none' : 'flex'}">
            <i class="fa-solid fa-user"></i>
          </div>
          <div class="inti-card__name">${displayName}</div>
          <span class="inti-card__role">${displayRole}</span>
        </div>
      `;
    }).join('');
  } catch (e) {
    console.error('[Profil OSIS] Error:', e);
    grid.innerHTML = emptyStateHTML('error', 'Gagal memuat pengurus inti.');
  }
}

// ================================================
// LOAD TIM DIVISI
// ================================================
async function loadTeamDivisi() {
  const container = document.getElementById('gridDivisi');
  if (!container) return;
  
  container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-circle-notch fa-spin"></i><p>Memuat data divisi...</p></div>';
  
  try {
    const rawData = await fetchJsonSilent('../../content/team_2.json', 'data divisi');
    
    if (!rawData) {
      container.innerHTML = emptyStateHTML('users', 'Data divisi belum tersedia.');
      return;
    }
    
    const divisions = Array.isArray(rawData) ? rawData : (rawData.divisions || rawData.data || []);

    if (!divisions.length) {
      container.innerHTML = emptyStateHTML('users', 'Belum ada data divisi.');
      return;
    }

    container.innerHTML = divisions.map((div, idx) => `
      <div class="division-card fade-up" style="animation-delay:${idx * 100}ms">
        <h3 class="division-card__title"><i class="fa-solid fa-layer-group"></i> ${div.division || 'Divisi'}</h3>
        <div class="division-members">
          ${(div.members || []).map(m => {
            const imgUrl = resolveImage(m.image);
            return `
              <div class="member-mini">
                ${imgUrl 
                  ? `<img src="${imgUrl}" alt="${m.name}" class="member-mini__img" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">`
                  : ''}
                <div class="member-mini__placeholder" style="display:${imgUrl ? 'none' : 'flex'}">
                  <i class="fa-solid fa-user"></i>
                </div>
                <div class="member-mini__name">${m.name || 'Tanpa Nama'}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `).join('');
  } catch (e) {
    console.error('[Profil OSIS] Error divisi:', e);
    container.innerHTML = emptyStateHTML('error', 'Gagal memuat data divisi.');
  }
}
