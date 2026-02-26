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
})();
