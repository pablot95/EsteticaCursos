(function() {
  var params = new URLSearchParams(window.location.search);
  var id = params.get('id');
  var plan = params.get('plan') || 'group';

  if (!id || !COURSES[id]) {
    window.location.href = 'index.html#courses';
    return;
  }

  var c = COURSES[id];
  var mergedData = Object.assign({}, c);
  var backLink = document.getElementById('checkoutBack');
  backLink.href = 'course.html?id=' + id;

  document.title = 'Inscripción - ' + c.name + ' | Reina Catalina';

  function renderSummary() {
    var price = plan === 'personal' ? mergedData.pricePersonal : mergedData.priceGroup;
    var planLabel = plan === 'personal' ? 'Personalizado' : 'Grupal';

    var html = '';
    html += '<div class="summary-course-name">' + mergedData.name + '</div>';
    html += '<div class="summary-detail"><span>Plan</span><span>' + planLabel + '</span></div>';
    html += '<div class="summary-detail"><span>Duración</span><span>' + mergedData.duration + '</span></div>';
    html += '<div class="summary-detail"><span>Certificación</span><span>' + mergedData.certificate + '</span></div>';
    html += '<div class="summary-total"><span>Total</span><span>' + formatPrice(price) + '</span></div>';

    document.getElementById('summaryBody').innerHTML = html;
    document.title = 'Inscripción - ' + mergedData.name + ' | Reina Catalina';
  }

  renderSummary();

  fetchCourseData(id).then(function(data) {
    if (data) {
      Object.assign(mergedData, data);
      renderSummary();
    }
  });

  var form = document.getElementById('checkoutForm');

  function validateField(input) {
    var error = input.parentElement.querySelector('.error-msg');
    var value = input.value.trim();

    if (!value) {
      error.textContent = 'Este campo es obligatorio';
      input.classList.add('error');
      return false;
    }

    if (input.type === 'email') {
      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        error.textContent = 'Ingresá un email válido';
        input.classList.add('error');
        return false;
      }
    }

    if (input.type === 'tel') {
      var phoneClean = value.replace(/[\s\-\(\)\+]/g, '');
      if (phoneClean.length < 8 || !/^\d+$/.test(phoneClean)) {
        error.textContent = 'Ingresá un teléfono válido';
        input.classList.add('error');
        return false;
      }
    }

    error.textContent = '';
    input.classList.remove('error');
    return true;
  }

  form.querySelectorAll('input').forEach(function(input) {
    input.addEventListener('blur', function() { validateField(input); });
    input.addEventListener('input', function() {
      if (input.classList.contains('error')) validateField(input);
    });
  });

  function showCredentialsModal(email, password, isNew) {
    var overlay = document.createElement('div');
    overlay.className = 'credentials-modal-overlay';

    var modal = document.createElement('div');
    modal.className = 'credentials-modal';

    var html = '<div class="credentials-modal-icon">';
    html += '<svg viewBox="0 0 24 24" width="48" height="48"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#27ae60" stroke-width="2" fill="none"/><polyline points="22 4 12 14.01 9 11.01" stroke="#27ae60" stroke-width="2" fill="none"/></svg>';
    html += '</div>';
    html += '<h2>¡Inscripción Exitosa!</h2>';

    if (isNew) {
      html += '<p>Se creó tu cuenta y ya tenés acceso al contenido del curso.</p>';
      html += '<div class="credentials-box">';
      html += '<div class="credential-row"><span>Email:</span><strong>' + email + '</strong></div>';
      html += '<div class="credential-row"><span>Contraseña:</span><strong>' + password + '</strong></div>';
      html += '</div>';
      html += '<p class="credentials-warning">⚠️ <strong>Guardá esta contraseña</strong> — la necesitás para acceder al contenido de tus cursos.</p>';
    } else {
      html += '<p>Ya tenés una cuenta con este email. Usá tus credenciales existentes para acceder al contenido del curso.</p>';
    }

    html += '<div class="credentials-actions">';
    html += '<a href="mi-cuenta.html" class="btn btn-primary">Ir a Mi Cuenta</a>';
    html += '</div>';

    modal.innerHTML = html;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    setTimeout(function() { overlay.classList.add('active'); }, 50);
  }

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    var inputs = form.querySelectorAll('input[required]');
    var allValid = true;

    inputs.forEach(function(input) {
      if (!validateField(input)) allValid = false;
    });

    if (!allValid) return;

    var btn = document.getElementById('checkoutBtn');
    btn.disabled = true;
    btn.textContent = 'Procesando...';

    var firstName = document.getElementById('firstName').value.trim();
    var lastName = document.getElementById('lastName').value.trim();
    var email = document.getElementById('email').value.trim();
    var phone = document.getElementById('phone').value.trim();

    var generatedPassword = generatePassword(8);
    var isNewUser = false;
    var userUid = null;

    // Try to create Firebase Auth user
    auth.createUserWithEmailAndPassword(email, generatedPassword)
      .then(function(cred) {
        isNewUser = true;
        userUid = cred.user.uid;

        // Create user profile in Firestore with course access
        return db.collection('users').doc(userUid).set({
          email: email,
          firstName: firstName,
          lastName: lastName,
          phone: phone,
          purchasedCourses: [id],
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      })
      .catch(function(err) {
        if (err.code === 'auth/email-already-in-use') {
          // User already exists, try to sign in to get UID
          isNewUser = false;
          return auth.signInWithEmailAndPassword(email, generatedPassword)
            .then(function(cred) {
              userUid = cred.user.uid;
              // Grant course access
              return db.collection('users').doc(userUid).update({
                purchasedCourses: firebase.firestore.FieldValue.arrayUnion(id)
              });
            })
            .catch(function() {
              // Can't sign in (wrong password), look up by email in Firestore
              return db.collection('users').where('email', '==', email).limit(1).get()
                .then(function(snap) {
                  if (!snap.empty) {
                    userUid = snap.docs[0].id;
                    // Grant course access
                    return snap.docs[0].ref.update({
                      purchasedCourses: firebase.firestore.FieldValue.arrayUnion(id)
                    });
                  }
                });
            });
        }
        throw err;
      })
      .then(function() {
        // Save order as paid
        var orderData = {
          courseId: id,
          courseName: mergedData.name,
          plan: plan,
          firstName: firstName,
          lastName: lastName,
          email: email,
          phone: phone,
          userUid: userUid || null,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          status: 'paid'
        };

        return db.collection('orders').add(orderData);
      })
      .then(function() {
        btn.disabled = false;
        btn.textContent = 'Completar Inscripción';
        showCredentialsModal(email, generatedPassword, isNewUser);
      })
      .catch(function(err) {
        console.error(err);
        // Fallback: save order without user account
        var orderData = {
          courseId: id,
          courseName: mergedData.name,
          plan: plan,
          firstName: firstName,
          lastName: lastName,
          email: email,
          phone: phone,
          userUid: null,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          status: 'paid'
        };

        db.collection('orders').add(orderData).then(function() {
          alert('Inscripción completada. Accedé a Mi Cuenta para ver tu curso.');
          btn.disabled = false;
          btn.textContent = 'Completar Inscripción';
        }).catch(function() {
          alert('Hubo un error. Por favor intentá de nuevo.');
          btn.disabled = false;
          btn.textContent = 'Completar Inscripción';
        });
      });
  });
})();
