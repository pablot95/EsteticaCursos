(function() {
  var params = new URLSearchParams(window.location.search);
  var id = params.get('id');
  var plan = params.get('plan') || 'group';

  if (!id || !COURSES[id]) {
    window.location.href = 'index.html#courses';
    return;
  }

  var c = COURSES[id];
  var mergedData = Object.assign({}, c); // will be updated with Firebase data
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

    var orderData = {
      courseId: id,
      courseName: mergedData.name,
      plan: plan,
      firstName: document.getElementById('firstName').value.trim(),
      lastName: document.getElementById('lastName').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'pending'
    };

    db.collection('orders').add(orderData).then(function(docRef) {
      alert('Inscripción registrada. La integración con Mercado Pago se activará próximamente.');
      btn.disabled = false;
      btn.textContent = 'Pagar con Mercado Pago';
    }).catch(function(err) {
      alert('Hubo un error al procesar tu inscripción. Por favor intentá de nuevo.');
      btn.disabled = false;
      btn.textContent = 'Pagar con Mercado Pago';
    });
  });
})();
