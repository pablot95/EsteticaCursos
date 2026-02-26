(function() {
  authReadyPromise.then(function(user) {
    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    document.getElementById('accountEmail').textContent = user.email;

    var grid = document.getElementById('accountCoursesGrid');
    var noCoursesEl = document.getElementById('noCourses');

    // Load user data and purchased courses
    loadUserData(user.uid).then(function(userData) {
      if (!userData || !userData.purchasedCourses || userData.purchasedCourses.length === 0) {
        noCoursesEl.style.display = 'block';
        return;
      }

      // Fetch all course data to merge with local
      fetchAllCourses().then(function(firebaseData) {
        var html = '';
        userData.purchasedCourses.forEach(function(courseId) {
          var local = COURSES[courseId] || {};
          var fb = firebaseData[courseId] || {};
          var c = Object.assign({}, local, fb);

          if (!c.name) return;

          html += '<div class="account-course-card reveal">';
          html += '<div class="account-course-img">';
          html += '<img src="' + c.image + '" alt="' + c.name + '" width="400" height="300" loading="lazy">';
          html += '<span class="account-badge">Comprado</span>';
          html += '</div>';
          html += '<div class="account-course-body">';
          html += '<h3>' + c.name + '</h3>';
          html += '<p>' + (c.shortDesc || '') + '</p>';
          html += '<a href="course.html?id=' + courseId + '" class="btn btn-primary">Acceder al Contenido</a>';
          html += '</div>';
          html += '</div>';
        });

        if (html) {
          grid.innerHTML = html;
          if (window.initNewReveals) window.initNewReveals();
        } else {
          noCoursesEl.style.display = 'block';
        }
      });
    });
  });
})();
