(function() {
  var grid = document.getElementById('coursesGrid');
  var temarioGrid = document.getElementById('temarioGrid');
  if (!grid) return;

  // Cache Firebase data for temario modal clicks
  var cachedFirebaseData = {};

  function getMerged(id, firebaseData) {
    var local = COURSES[id] || {};
    var fb = (firebaseData || cachedFirebaseData)[id] || {};
    return Object.assign({}, local, fb);
  }

  function renderCourseCards(firebaseData) {
    var html = '';
    COURSE_ORDER.forEach(function(id, idx) {
      var c = getMerged(id, firebaseData);
      if (!c.name) return;

      html += '<div class="course-card reveal stagger-' + ((idx % 3) + 1) + '">';
      html += '<a href="course.html?id=' + id + '" class="course-card-img">';
      html += '<img src="' + c.image + '" alt="' + c.name + '" width="400" height="300" loading="lazy">';
      html += '</a>';
      html += '<div class="course-card-body">';
      html += '<h3 class="course-card-title">' + c.name + '</h3>';
      html += '<div class="course-card-price">Grupal: ' + formatPrice(c.priceGroup) + '<br>Personalizado: ' + formatPrice(c.pricePersonal) + '</div>';
      html += '<a href="course.html?id=' + id + '" class="course-card-link">';
      html += 'Ver Detalles <svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
      html += '</a>';
      html += '</div></div>';
    });

    grid.innerHTML = html;
    if (window.initNewReveals) window.initNewReveals();
  }

  function renderTemarios(firebaseData) {
    if (!temarioGrid) return;
    var html = '';
    COURSE_ORDER.forEach(function(id, idx) {
      var c = getMerged(id, firebaseData);
      if (!c.temarioImage) return;
      html += '<div class="temario-card reveal stagger-' + ((idx % 5) + 1) + '" data-course="' + id + '">';
      html += '<img src="' + c.temarioImage + '" alt="Temario ' + c.name + '" width="260" height="360" loading="lazy">';
      html += '</div>';
    });
    temarioGrid.innerHTML = html;

    temarioGrid.querySelectorAll('.temario-card').forEach(function(card) {
      card.addEventListener('click', function() {
        var courseId = card.getAttribute('data-course');
        var c = getMerged(courseId);
        if (!c.name) return;

        var modal = document.getElementById('temarioModal');
        var modalImg = document.getElementById('temarioModalImg');
        var modalBtn = document.getElementById('temarioModalBtn');

        modalImg.src = c.temarioImage;
        modalImg.alt = 'Temario ' + c.name;
        modalBtn.href = 'course.html?id=' + courseId;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      });
    });

    if (window.initNewReveals) window.initNewReveals();
  }

  function initTemarioModal() {
    var modal = document.getElementById('temarioModal');
    var closeBtn = document.getElementById('temarioModalClose');
    var overlay = modal ? modal.querySelector('.temario-modal-overlay') : null;

    function closeModal() {
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (overlay) overlay.addEventListener('click', closeModal);

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeModal();
    });
  }

  // Initial render with local data only
  renderCourseCards({});
  renderTemarios({});
  initTemarioModal();

  // Fetch Firebase data and re-render everything with merged data
  fetchAllCourses().then(function(data) {
    if (data && Object.keys(data).length > 0) {
      cachedFirebaseData = data;
      renderCourseCards(data);
      renderTemarios(data);
    }
  });
})();
