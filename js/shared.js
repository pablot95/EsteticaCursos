var firebaseConfig = {
  apiKey: "AIzaSyAYWbHR4STyKrWg-z3eXElVt6LtCj0TpnE",
  authDomain: "esteticacursosrc.firebaseapp.com",
  projectId: "esteticacursosrc",
  storageBucket: "esteticacursosrc.firebasestorage.app",
  messagingSenderId: "507599790305",
  appId: "1:507599790305:web:9da1cdcbf3652d562f97a0"
};

firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();
var auth = firebase.auth();

function formatPrice(num) {
  return '$' + num.toLocaleString('es-AR');
}

/* --- Auth helpers --- */
var currentUser = null;
var currentUserData = null;

function generatePassword(len) {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  var pass = '';
  for (var i = 0; i < (len || 8); i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

function loadUserData(uid) {
  return db.collection('users').doc(uid).get().then(function(doc) {
    if (doc.exists) {
      currentUserData = doc.data();
      return currentUserData;
    }
    currentUserData = null;
    return null;
  });
}

function hasPurchasedCourse(courseId) {
  if (!currentUserData || !currentUserData.purchasedCourses) return false;
  return currentUserData.purchasedCourses.indexOf(courseId) !== -1;
}

function updateAuthNav() {
  var navItems = document.querySelectorAll('.auth-nav-item');
  navItems.forEach(function(el) { el.remove(); });

  var nav = document.getElementById('mainNav');
  if (!nav) return;

  if (currentUser) {
    var accountLink = document.createElement('a');
    accountLink.href = (window.location.pathname.indexOf('/admin/') !== -1 ? '../' : '') + 'mi-cuenta.html';
    accountLink.textContent = 'Mi Cuenta';
    accountLink.className = 'auth-nav-item nav-cta';
    nav.appendChild(accountLink);

    var logoutLink = document.createElement('a');
    logoutLink.href = '#';
    logoutLink.textContent = 'Salir';
    logoutLink.className = 'auth-nav-item';
    logoutLink.addEventListener('click', function(e) {
      e.preventDefault();
      auth.signOut().then(function() {
        window.location.reload();
      });
    });
    nav.insertBefore(logoutLink, accountLink);
  } else {
    var loginLink = document.createElement('a');
    loginLink.href = (window.location.pathname.indexOf('/admin/') !== -1 ? '../' : '') + 'login.html';
    loginLink.textContent = 'Iniciar Sesión';
    loginLink.className = 'auth-nav-item nav-cta';
    nav.appendChild(loginLink);
  }
}

var authReadyPromise = new Promise(function(resolve) {
  auth.onAuthStateChanged(function(user) {
    currentUser = user;
    if (user) {
      loadUserData(user.uid).then(function() {
        updateAuthNav();
        resolve(user);
      });
    } else {
      currentUserData = null;
      updateAuthNav();
      resolve(null);
    }
  });
});

async function fetchCourseData(courseId) {
  try {
    var doc = await db.collection('courses').doc(courseId).get();
    if (doc.exists) {
      return doc.data();
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function fetchAllCourses() {
  try {
    var snapshot = await db.collection('courses').get();
    var data = {};
    snapshot.forEach(function(doc) {
      data[doc.id] = doc.data();
    });
    return data;
  } catch (e) {
    return {};
  }
}

(function() {
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  function initReveals() {
    document.querySelectorAll('.reveal').forEach(function(el) {
      observer.observe(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReveals);
  } else {
    initReveals();
  }

  window.initNewReveals = function() {
    document.querySelectorAll('.reveal:not(.active)').forEach(function(el) {
      observer.observe(el);
    });
  };
})();

(function() {
  var header = document.getElementById('siteHeader');
  if (!header) return;
  
  var scrollThreshold = 80;
  var ticking = false;

  window.addEventListener('scroll', function() {
    if (!ticking) {
      window.requestAnimationFrame(function() {
        if (window.scrollY > scrollThreshold) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
        ticking = false;
      });
      ticking = true;
    }
  });

  if (window.scrollY > scrollThreshold) {
    header.classList.add('scrolled');
  }
})();

(function() {
  var toggle = document.getElementById('menuToggle');
  var nav = document.getElementById('mainNav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', function() {
    toggle.classList.toggle('active');
    nav.classList.toggle('open');
    document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
  });

  nav.querySelectorAll('a').forEach(function(link) {
    link.addEventListener('click', function() {
      toggle.classList.remove('active');
      nav.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
})();

window.addEventListener('load', function() {
  var preloader = document.getElementById('preloader');
  if (preloader) {
    setTimeout(function() {
      preloader.classList.add('hidden');
      setTimeout(function() {
        preloader.style.display = 'none';
      }, 600);
    }, 400);
  }
});
