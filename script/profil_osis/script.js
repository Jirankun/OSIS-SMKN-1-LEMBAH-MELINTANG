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
      
      return `
        <div class="card inti-card${isKetua} fade-up" style="animation-delay:${i * 100}ms">
          ${imgUrl 
            ? `<img src="${imgUrl}" alt="${m.name}" class="inti-card__img" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">`
            : ''}
          <div class="inti-card__placeholder" style="display:${imgUrl ? 'none' : 'flex'}">
            <i class="fa-solid fa-user"></i>
          </div>
          <div class="inti-card__name">${m.name || 'Tanpa Nama'}</div>
          <span class="inti-card__role">${m.role || 'Anggota'}</span>
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
