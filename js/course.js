(function() {
  var params = new URLSearchParams(window.location.search);
  var id = params.get('id');
  if (!id || !COURSES[id]) {
    window.location.href = 'index.html#courses';
    return;
  }

  function renderCourse(c, fbData) {
    var m = Object.assign({}, c, fbData || {});

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
      { icon: '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>', label: 'Formato', value: 'Online en Vivo' },
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
    if (data) renderCourse(COURSES[id], data);
  });
})();
