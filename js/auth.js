(function() {
  // If already logged in, redirect to account
  authReadyPromise.then(function(user) {
    if (user) {
      window.location.href = 'mi-cuenta.html';
      return;
    }
  });

  var form = document.getElementById('loginForm');
  var errorEl = document.getElementById('loginError');

  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    var email = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value;

    if (!email || !password) {
      errorEl.textContent = 'Completá todos los campos';
      return;
    }

    var btn = document.getElementById('loginBtn');
    btn.disabled = true;
    btn.textContent = 'Ingresando...';
    errorEl.textContent = '';

    auth.signInWithEmailAndPassword(email, password)
      .then(function(cred) {
        // Check for redirect URL
        var params = new URLSearchParams(window.location.search);
        var redirect = params.get('redirect');
        if (redirect) {
          window.location.href = redirect;
        } else {
          window.location.href = 'mi-cuenta.html';
        }
      })
      .catch(function(err) {
        var msg = 'Email o contraseña incorrectos';
        if (err.code === 'auth/user-not-found') {
          msg = 'No existe una cuenta con este email';
        } else if (err.code === 'auth/wrong-password') {
          msg = 'Contraseña incorrecta';
        } else if (err.code === 'auth/too-many-requests') {
          msg = 'Demasiados intentos. Esperá unos minutos e intentá de nuevo.';
        } else if (err.code === 'auth/invalid-email') {
          msg = 'El email ingresado no es válido';
        }
        errorEl.textContent = msg;
        btn.disabled = false;
        btn.textContent = 'Iniciar Sesión';
      });
  });

  /* --- Recupero de contraseña --- */
  var forgotLink = document.getElementById('forgotPasswordLink');
  var forgotModal = document.getElementById('forgotModal');
  var forgotClose = document.getElementById('forgotModalClose');
  var forgotForm = document.getElementById('forgotForm');
  var forgotStatus = document.getElementById('forgotStatus');

  if (forgotLink && forgotModal) {
    forgotLink.addEventListener('click', function(e) {
      e.preventDefault();
      forgotModal.classList.add('active');
      document.body.style.overflow = 'hidden';
      forgotStatus.textContent = '';
      forgotStatus.className = 'forgot-status';
      var emailField = document.getElementById('forgotEmail');
      var loginEmail = document.getElementById('loginEmail').value.trim();
      if (loginEmail) emailField.value = loginEmail;
      emailField.focus();
    });

    forgotClose.addEventListener('click', closeForgotModal);
    forgotModal.addEventListener('click', function(e) {
      if (e.target === forgotModal) closeForgotModal();
    });

    function closeForgotModal() {
      forgotModal.classList.remove('active');
      document.body.style.overflow = '';
    }

    forgotForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var email = document.getElementById('forgotEmail').value.trim();
      if (!email) {
        forgotStatus.textContent = 'Ingresá tu email';
        forgotStatus.className = 'forgot-status forgot-error';
        return;
      }

      var forgotBtn = document.getElementById('forgotBtn');
      forgotBtn.disabled = true;
      forgotBtn.textContent = 'Enviando...';
      forgotStatus.textContent = '';

      auth.sendPasswordResetEmail(email)
        .then(function() {
          forgotStatus.textContent = '✅ ¡Listo! Revisá tu bandeja de entrada (y spam) para restablecer tu contraseña.';
          forgotStatus.className = 'forgot-status forgot-success';
          forgotBtn.textContent = 'Enviado';
        })
        .catch(function(err) {
          var msg = 'No se pudo enviar el email. Verificá que sea correcto.';
          if (err.code === 'auth/user-not-found') {
            msg = 'No existe una cuenta con ese email.';
          } else if (err.code === 'auth/invalid-email') {
            msg = 'El email ingresado no es válido.';
          } else if (err.code === 'auth/too-many-requests') {
            msg = 'Demasiados intentos. Esperá unos minutos.';
          }
          forgotStatus.textContent = msg;
          forgotStatus.className = 'forgot-status forgot-error';
          forgotBtn.disabled = false;
          forgotBtn.textContent = 'Enviar enlace';
        });
    });
  }
})();
