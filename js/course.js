(function() {
  var params = new URLSearchParams(window.location.search);
  var id = params.get('id');
  if (!id || !COURSES[id]) {
    window.location.href = 'index.html#courses';
    return;
  }

  var mergedCourse = Object.assign({}, COURSES[id]);

  function renderCourse(c, fbData) {
    var m = Object.assign({}, c, fbData || {});
    mergedCourse = m;

    document.title = m.name + ' | OMEE Reina Catalina';
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', m.shortDesc);

    document.getElementById('courseHeroImg').src = m.image;
    document.getElementById('courseHeroImg').alt = m.name;
    document.getElementById('courseCoverImg').src = m.image;
    document.getElementById('courseCoverImg').alt = m.name;
    document.getElementById('courseTitle').textContent = m.name;
    document.getElementById('courseTagline').textContent = m.tagline;
    document.getElementById('courseDesc').textContent = m.shortDesc;

    var highlightsHTML = '';
    var highlights = [
      { icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>', label: 'Duración', value: m.duration },
      { icon: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>', label: 'Certificación', value: m.certificate },
      { icon: '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>', label: 'Formato', value: m.formato || 'Online en Vivo' },
      { icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>', label: 'Práctica', value: 'Con Modelos Reales' }
    ];

    highlights.forEach(function(h) {
      highlightsHTML += '<div class="highlight-item">';
      highlightsHTML += '<div class="highlight-icon"><svg viewBox="0 0 24 24">' + h.icon + '</svg></div>';
      highlightsHTML += '<div><h4>' + h.label + '</h4><p>' + h.value + '</p></div>';
      highlightsHTML += '</div>';
    });
    document.getElementById('courseHighlights').innerHTML = highlightsHTML;

    // Sidebar
    var pGroup = m.priceGroup;
    var pPersonal = m.pricePersonal;

    var shtml = '';
    shtml += '<div class="price-option selected" data-plan="group" onclick="selectPlan(this,\'group\')">';
    shtml += '<h4>Grupal</h4>';
    shtml += '<div class="price">' + formatPrice(pGroup) + '</div>';
    shtml += '</div>';

    shtml += '<div class="price-option" data-plan="personal" onclick="selectPlan(this,\'personal\')">';
    shtml += '<h4>Personalizado</h4>';
    shtml += '<div class="price">' + formatPrice(pPersonal) + ' <small>atención exclusiva</small></div>';
    shtml += '</div>';

    if (typeof m.spots === 'number') {
      if (m.spots > 0) {
        shtml += '<div class="spots-badge available">' + m.spots + ' cupos disponibles</div>';
      } else {
        shtml += '<div class="spots-badge">Sin cupos</div>';
      }
    }

    shtml += '<a href="checkout.html?id=' + id + '&plan=group" class="btn btn-primary sidebar-enroll-btn" id="enrollBtn">Inscribirme</a>';

    shtml += '<ul class="sidebar-features">';
    (m.includes || []).forEach(function(item) {
      shtml += '<li><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>' + item + '</li>';
    });
    shtml += '</ul>';

    document.getElementById('sidebarBody').innerHTML = shtml;

    // Syllabus
    var syllabusHTML = '';
    (m.syllabus || []).forEach(function(block, idx) {
      syllabusHTML += '<div class="syllabus-block reveal stagger-' + ((idx % 4) + 1) + '">';
      syllabusHTML += '<h3><span class="block-num">' + (idx + 1) + '</span>' + block.title + '</h3>';
      syllabusHTML += '<ul>';
      (block.items || []).forEach(function(item) {
        syllabusHTML += '<li>' + item + '</li>';
      });
      syllabusHTML += '</ul></div>';
    });
    document.getElementById('syllabusGrid').innerHTML = syllabusHTML;

    if (window.initNewReveals) window.initNewReveals();
  }

  function renderModules(modules, purchased) {
    var area = document.getElementById('modulesArea');
    var grid = document.getElementById('modulesGrid');
    var subtitle = document.getElementById('modulesSubtitle');

    if (!modules || modules.length === 0) {
      area.style.display = 'none';
      return;
    }

    area.style.display = 'block';

    if (!purchased) {
      subtitle.textContent = 'Inscribite en este curso para desbloquear todo el contenido exclusivo.';
    }

    var html = '';
    modules.forEach(function(mod, idx) {
      var lockClass = purchased ? 'module-unlocked' : 'module-locked';
      html += '<div class="module-card ' + lockClass + ' reveal stagger-' + ((idx % 4) + 1) + '">';

      // Module header
      html += '<div class="module-header">';
      html += '<span class="module-num">' + (idx + 1) + '</span>';
      html += '<h3>' + (mod.title || 'Módulo ' + (idx + 1)) + '</h3>';
      if (!purchased) {
        html += '<span class="module-lock-icon"><svg viewBox="0 0 24 24" width="20" height="20"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 11V7a5 5 0 0110 0v4" fill="none" stroke="currentColor" stroke-width="2"/></svg></span>';
      } else {
        html += '<span class="module-unlock-icon"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" fill="none" stroke="currentColor" stroke-width="2"/><polyline points="22 4 12 14.01 9 11.01" fill="none" stroke="currentColor" stroke-width="2"/></svg></span>';
      }
      html += '</div>';

      // Module items
      html += '<div class="module-items">';
      if (mod.items && mod.items.length > 0) {
        mod.items.forEach(function(item) {
          html += '<div class="module-item">';

          if (item.type === 'video') {
            html += '<div class="module-item-icon video-icon"><svg viewBox="0 0 24 24" width="18" height="18"><polygon points="5 3 19 12 5 21 5 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg></div>';
          } else {
            html += '<div class="module-item-icon pdf-icon"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="none" stroke="currentColor" stroke-width="2"/><polyline points="14 2 14 8 20 8" fill="none" stroke="currentColor" stroke-width="2"/></svg></div>';
          }

          html += '<span class="module-item-title">' + (item.title || 'Sin título') + '</span>';

          if (purchased && item.url) {
            if (item.type === 'video') {
              html += '<button class="module-play-btn" onclick="playModuleVideo(\'' + escapeAttrJS(item.url) + '\', \'' + escapeAttrJS(item.title || '') + '\')">Reproducir</button>';
            } else {
              html += '<a href="' + item.url + '" target="_blank" rel="noopener" class="module-download-btn">Descargar</a>';
            }
          } else if (!purchased) {
            html += '<span class="module-item-locked">Bloqueado</span>';
          }

          html += '</div>';
        });
      } else {
        html += '<p class="module-empty">Contenido próximamente.</p>';
      }
      html += '</div>';

      html += '</div>';
    });

    grid.innerHTML = html;

    if (window.initNewReveals) window.initNewReveals();
  }

  function escapeAttrJS(str) {
    return String(str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
  }

  // Video player modal
  window.playModuleVideo = function(url, title) {
    var existing = document.getElementById('videoPlayerModal');
    if (existing) existing.remove();

    var embedUrl = url;
    // Convert YouTube URLs to embed format
    var ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
    if (ytMatch) {
      embedUrl = 'https://www.youtube.com/embed/' + ytMatch[1] + '?autoplay=1';
    }
    // Convert Vimeo URLs
    var vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      embedUrl = 'https://player.vimeo.com/video/' + vimeoMatch[1] + '?autoplay=1';
    }

    var modal = document.createElement('div');
    modal.id = 'videoPlayerModal';
    modal.className = 'video-modal';

    var html = '<div class="video-modal-overlay"></div>';
    html += '<div class="video-modal-content">';
    html += '<div class="video-modal-header"><h3>' + (title || 'Video') + '</h3>';
    html += '<button class="video-modal-close" aria-label="Cerrar">&times;</button></div>';

    if (ytMatch || vimeoMatch) {
      html += '<div class="video-modal-player"><iframe src="' + embedUrl + '" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>';
    } else {
      html += '<div class="video-modal-player"><video controls autoplay controlsList="nodownload nofullscreen noremoteplayback" disablePictureInPicture oncontextmenu="return false;" src="' + url + '"></video></div>';
    }

    html += '</div>';
    modal.innerHTML = html;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    setTimeout(function() { modal.classList.add('active'); }, 50);

    modal.querySelector('.video-modal-overlay').addEventListener('click', closeVideoModal);
    modal.querySelector('.video-modal-close').addEventListener('click', closeVideoModal);

    document.addEventListener('keydown', function handler(e) {
      if (e.key === 'Escape') {
        closeVideoModal();
        document.removeEventListener('keydown', handler);
      }
    });
  };

  function closeVideoModal() {
    var modal = document.getElementById('videoPlayerModal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(function() {
        modal.remove();
        document.body.style.overflow = '';
      }, 300);
    }
  }

  window.selectPlan = function(el, plan) {
    document.querySelectorAll('.price-option').forEach(function(o) { o.classList.remove('selected'); });
    el.classList.add('selected');
    var btn = document.getElementById('enrollBtn');
    if (btn) btn.href = 'checkout.html?id=' + id + '&plan=' + plan;
  };

  // Initial render with local data
  renderCourse(COURSES[id], null);

  // Fetch Firebase data and re-render with merged data
  fetchCourseData(id).then(function(data) {
    if (data) {
      renderCourse(COURSES[id], data);
      mergedCourse = Object.assign({}, COURSES[id], data);
    }

    // Check auth state and render modules
    authReadyPromise.then(function(user) {
      var purchased = false;
      if (user && currentUserData) {
        purchased = hasPurchasedCourse(id);
      }
      renderModules(mergedCourse.modules || [], purchased);
    });
  });
})();
