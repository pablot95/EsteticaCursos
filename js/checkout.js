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

  document.title = 'Inscripción - ' + c.name + ' | OMEE Reina Catalina';

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
    document.title = 'Inscripción - ' + mergedData.name + ' | OMEE Reina Catalina';
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

  function buildWhatsAppUrl(firstName, lastName, email, courseName, planLabel) {
    var phone = '5491150949218';
    var msg = '¡Hola! Acabo de inscribirme en un curso 🎓\n\n';
    msg += '📚 *Curso:* ' + courseName + '\n';
    msg += '📋 *Plan:* ' + planLabel + '\n';
    msg += '👤 *Nombre:* ' + firstName + ' ' + lastName + '\n';
    msg += '📧 *Email:* ' + email + '\n\n';
    msg += 'Quedo a la espera de la confirmación de pago. ¡Gracias!';
    return 'https://wa.me/' + phone + '?text=' + encodeURIComponent(msg);
  }

  function showCredentialsModal(email, password, isNew, firstName, lastName) {
    var overlay = document.createElement('div');
    overlay.className = 'credentials-modal-overlay';

    var modal = document.createElement('div');
    modal.className = 'credentials-modal';

    var planLabel = plan === 'personal' ? 'Personalizado' : 'Grupal';
    var wspUrl = buildWhatsAppUrl(firstName, lastName, email, mergedData.name, planLabel);

    var html = '<div class="credentials-modal-icon">';
    html += '<svg viewBox="0 0 24 24" width="48" height="48"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#27ae60" stroke-width="2" fill="none"/><polyline points="22 4 12 14.01 9 11.01" stroke="#27ae60" stroke-width="2" fill="none"/></svg>';
    html += '</div>';
    html += '<h2>¡Inscripción Registrada!</h2>';

    if (isNew) {
      html += '<p>Se creó tu cuenta para acceder al contenido del curso una vez confirmado el pago.</p>';
      html += '<div class="credentials-box">';
      html += '<div class="credential-row"><span>Email:</span><strong>' + email + '</strong></div>';
      html += '<div class="credential-row"><span>Contraseña:</span><strong>' + password + '</strong></div>';
      html += '</div>';
      html += '<p class="credentials-warning">⚠️ <strong>Guardá esta contraseña</strong> — la necesitás para acceder al contenido de tus cursos.</p>';
    } else {
      html += '<p>Ya tenés una cuenta con este email. Usá tus credenciales existentes para acceder al contenido del curso una vez confirmado el pago.</p>';
    }

    html += '<p style="margin-top:1rem;text-align:center;">Ahora enviá los datos de tu compra por WhatsApp para confirmar el pago:</p>';
    html += '<div class="credentials-actions">';
    html += '<a href="' + wspUrl + '" target="_blank" rel="noopener" class="btn btn-primary btn-whatsapp">';
    html += '<svg viewBox="0 0 24 24" width="20" height="20" style="vertical-align:middle;margin-right:6px;fill:#fff;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.396 0-4.604-.794-6.39-2.135l-.252-.19-3.06 1.025 1.025-3.06-.19-.252A9.935 9.935 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>';
    html += 'Enviar por WhatsApp</a>';
    html += '<a href="mi-cuenta.html" class="btn btn-outline">Ir a Mi Cuenta</a>';
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

        // Create user profile in Firestore
        return db.collection('users').doc(userUid).set({
          email: email,
          firstName: firstName,
          lastName: lastName,
          phone: phone,
          purchasedCourses: [],
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
            })
            .catch(function() {
              // Can't sign in (wrong password), look up by email in Firestore
              return db.collection('users').where('email', '==', email).limit(1).get()
                .then(function(snap) {
                  if (!snap.empty) {
                    userUid = snap.docs[0].id;
                  }
                });
            });
        }
        throw err;
      })
      .then(function() {
        // Save order
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
          status: 'pending'
        };

        return db.collection('orders').add(orderData);
      })
      .then(function() {
        btn.disabled = false;
        btn.textContent = 'Pagar con Mercado Pago';
        showCredentialsModal(email, generatedPassword, isNewUser, firstName, lastName);
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
          status: 'pending'
        };

        db.collection('orders').add(orderData).then(function() {
          var planLabel = plan === 'personal' ? 'Personalizado' : 'Grupal';
          var wspUrl = buildWhatsAppUrl(firstName, lastName, email, mergedData.name, planLabel);
          alert('Inscripción registrada. Te redirigimos a WhatsApp para confirmar el pago.');
          btn.disabled = false;
          btn.textContent = 'Pagar con Mercado Pago';
          window.open(wspUrl, '_blank');
        }).catch(function() {
          alert('Hubo un error. Por favor intentá de nuevo.');
          btn.disabled = false;
          btn.textContent = 'Pagar con Mercado Pago';
        });
      });
  });
})();
