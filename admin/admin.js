(function() {
  if (sessionStorage.getItem('omee_admin') !== 'true') {
    window.location.href = 'index.html';
    return;
  }

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
  var storage = firebase.storage();

  function formatPrice(num) {
    return '$' + Number(num).toLocaleString('es-AR');
  }

  function showToast(msg, type) {
    var toast = document.getElementById('adminToast');
    toast.textContent = msg;
    toast.className = 'admin-toast ' + (type || 'success');
    setTimeout(function() { toast.classList.add('hidden'); }, 3000);
  }

  /* --- Logout --- */
  document.getElementById('logoutBtn').addEventListener('click', function() {
    sessionStorage.removeItem('omee_admin');
    window.location.href = 'index.html';
  });

  /* --- Tabs --- */
  var tabs = document.querySelectorAll('.admin-tab');
  var coursesPanel = document.getElementById('panelCourses');
  var ordersPanel = document.getElementById('panelOrders');

  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      tabs.forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      var target = tab.getAttribute('data-tab');
      if (target === 'courses') {
        coursesPanel.classList.remove('hidden');
        ordersPanel.classList.add('hidden');
      } else {
        coursesPanel.classList.add('hidden');
        ordersPanel.classList.remove('hidden');
        loadOrders();
      }
    });
  });

  /* --- Courses --- */
  var firebaseData = {};

  function loadCourses() {
    db.collection('courses').get().then(function(snapshot) {
      snapshot.forEach(function(doc) {
        firebaseData[doc.id] = doc.data();
      });
      renderCourses();
    }).catch(function() {
      renderCourses();
    });
  }

  function getMerged(id) {
    var local = COURSES[id] || {};
    var fb = firebaseData[id] || {};
    return Object.assign({}, local, fb);
  }

  function resolveImg(src) {
    if (!src) return '';
    if (src.startsWith('http')) return src;
    return '../' + src;
  }

  function renderCourses() {
    var grid = document.getElementById('adminCoursesGrid');
    var html = '';

    COURSE_ORDER.forEach(function(id) {
      var c = getMerged(id);
      if (!c.name) return;
      var spots = typeof c.spots === 'number' ? c.spots : '\u2014';

      html += '<div class="admin-course-card" data-id="' + id + '">';
      html += '<div class="admin-course-img"><img src="' + resolveImg(c.image) + '" alt="' + c.name + '"></div>';
      html += '<div class="admin-course-info">';
      html += '<h3>' + c.name + '</h3>';
      html += '<div class="admin-course-details">';
      html += '<div class="admin-detail"><span>Grupal</span><strong>' + formatPrice(c.priceGroup) + '</strong></div>';
      html += '<div class="admin-detail"><span>Personalizado</span><strong>' + formatPrice(c.pricePersonal) + '</strong></div>';
      html += '<div class="admin-detail"><span>Cupos</span><strong>' + spots + '</strong></div>';
      html += '</div>';
      html += '<button class="admin-edit-btn" onclick="openEdit(\'' + id + '\')">Editar Curso</button>';
      html += '</div></div>';
    });

    grid.innerHTML = html;
  }

  /* --- Syllabus Editor --- */
  var syllabusBlocks = [];

  function escapeAttr(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderSyllabusEditor() {
    var container = document.getElementById('syllabusEditor');
    var html = '';
    syllabusBlocks.forEach(function(block, idx) {
      html += '<div class="syllabus-edit-block" data-idx="' + idx + '">';
      html += '<div class="syllabus-edit-header">';
      html += '<span class="syllabus-block-num">' + (idx + 1) + '</span>';
      html += '<input type="text" class="syllabus-block-title" value="' + escapeAttr(block.title) + '" placeholder="T\u00edtulo del m\u00f3dulo">';
      html += '<button type="button" class="syllabus-remove-btn" onclick="removeSyllabusBlock(' + idx + ')" title="Eliminar m\u00f3dulo">\u00d7</button>';
      html += '</div>';
      html += '<textarea class="syllabus-block-items" rows="5" placeholder="Un \u00edtem por l\u00ednea">' + escapeHtml(block.items.join('\n')) + '</textarea>';
      html += '</div>';
    });
    container.innerHTML = html;
  }

  function collectSyllabus() {
    var blocks = [];
    document.querySelectorAll('.syllabus-edit-block').forEach(function(el) {
      var title = el.querySelector('.syllabus-block-title').value.trim();
      var itemsText = el.querySelector('.syllabus-block-items').value.trim();
      var items = itemsText ? itemsText.split('\n').filter(function(l) { return l.trim() !== ''; }) : [];
      if (title || items.length > 0) {
        blocks.push({ title: title, items: items });
      }
    });
    return blocks;
  }

  window.removeSyllabusBlock = function(idx) {
    syllabusBlocks = collectSyllabus();
    syllabusBlocks.splice(idx, 1);
    renderSyllabusEditor();
  };

  document.getElementById('addSyllabusBlock').addEventListener('click', function() {
    syllabusBlocks = collectSyllabus();
    syllabusBlocks.push({ title: '', items: [] });
    renderSyllabusEditor();
  });

  /* --- Image Upload --- */
  var newCourseImgFile = null;
  var newTemarioImgFile = null;

  function setupImageUpload(inputId, previewId) {
    var input = document.getElementById(inputId);
    var preview = document.getElementById(previewId);
    var container = input.closest('.admin-img-upload');

    container.addEventListener('click', function(e) {
      if (e.target !== input) input.click();
    });

    input.addEventListener('change', function() {
      if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function(ev) {
          preview.src = ev.target.result;
          preview.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
        if (inputId === 'editCourseImg') {
          newCourseImgFile = input.files[0];
        } else {
          newTemarioImgFile = input.files[0];
        }
      }
    });
  }

  setupImageUpload('editCourseImg', 'editCourseImgPreview');
  setupImageUpload('editTemarioImg', 'editTemarioImgPreview');

  async function uploadImageToStorage(file, courseId, type) {
    var ext = file.name.split('.').pop();
    var filePath = 'courses/' + courseId + '-' + type + '.' + ext;
    var ref = storage.ref(filePath);
    await ref.put(file);
    return await ref.getDownloadURL();
  }

  /* --- Open Edit Modal --- */
  window.openEdit = function(courseId) {
    var c = getMerged(courseId);

    document.getElementById('editCourseId').value = courseId;
    document.getElementById('editModalTitle').textContent = 'Editar: ' + c.name;
    document.getElementById('editName').value = c.name || '';
    document.getElementById('editTagline').value = c.tagline || '';
    document.getElementById('editDuration').value = c.duration || '';
    document.getElementById('editCertificate').value = c.certificate || '';
    document.getElementById('editShortDesc').value = c.shortDesc || '';
    document.getElementById('editPriceGroup').value = c.priceGroup || 0;
    document.getElementById('editPricePersonal').value = c.pricePersonal || 0;
    document.getElementById('editSpots').value = typeof c.spots === 'number' ? c.spots : '';
    document.getElementById('editIncludes').value = (c.includes || []).join('\n');

    // Image previews
    var courseImgPreview = document.getElementById('editCourseImgPreview');
    var temarioImgPreview = document.getElementById('editTemarioImgPreview');
    var imgSrc = resolveImg(c.image);
    var temSrc = resolveImg(c.temarioImage);
    courseImgPreview.src = imgSrc;
    courseImgPreview.style.display = imgSrc ? 'block' : 'none';
    temarioImgPreview.src = temSrc;
    temarioImgPreview.style.display = temSrc ? 'block' : 'none';

    // Reset file inputs
    document.getElementById('editCourseImg').value = '';
    document.getElementById('editTemarioImg').value = '';
    newCourseImgFile = null;
    newTemarioImgFile = null;

    // Syllabus
    syllabusBlocks = (c.syllabus || []).map(function(b) {
      return { title: b.title || '', items: (b.items || []).slice() };
    });
    renderSyllabusEditor();

    document.getElementById('editModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  };

  function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
    document.body.style.overflow = '';
  }

  document.getElementById('editModalClose').addEventListener('click', closeEditModal);
  document.getElementById('editCancel').addEventListener('click', closeEditModal);
  document.getElementById('editModalOverlay').addEventListener('click', closeEditModal);

  /* --- Save Course --- */
  document.getElementById('editForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    var courseId = document.getElementById('editCourseId').value;
    var saveBtn = document.getElementById('editSave');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Guardando...';

    try {
      var updateData = {
        name: document.getElementById('editName').value.trim(),
        tagline: document.getElementById('editTagline').value.trim(),
        duration: document.getElementById('editDuration').value.trim(),
        certificate: document.getElementById('editCertificate').value.trim(),
        shortDesc: document.getElementById('editShortDesc').value.trim(),
        priceGroup: parseInt(document.getElementById('editPriceGroup').value) || 0,
        pricePersonal: parseInt(document.getElementById('editPricePersonal').value) || 0,
        includes: document.getElementById('editIncludes').value.split('\n').filter(function(l) { return l.trim() !== ''; }),
        syllabus: collectSyllabus()
      };

      var spotsVal = document.getElementById('editSpots').value;
      if (spotsVal !== '') {
        updateData.spots = parseInt(spotsVal) || 0;
      }

      // Upload images if changed
      if (newCourseImgFile) {
        showToast('Subiendo imagen del curso...', 'success');
        updateData.image = await uploadImageToStorage(newCourseImgFile, courseId, 'cover');
      }

      if (newTemarioImgFile) {
        showToast('Subiendo imagen del temario...', 'success');
        updateData.temarioImage = await uploadImageToStorage(newTemarioImgFile, courseId, 'temario');
      }

      await db.collection('courses').doc(courseId).set(updateData, { merge: true });
      firebaseData[courseId] = Object.assign(firebaseData[courseId] || {}, updateData);
      renderCourses();
      closeEditModal();
      showToast('Curso actualizado correctamente');
    } catch (err) {
      showToast('Error al guardar: ' + err.message, 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Guardar Cambios';
    }
  });

  /* --- Orders --- */
  var allOrders = [];

  function loadOrders() {
    db.collection('orders').orderBy('createdAt', 'desc').get().then(function(snapshot) {
      allOrders = [];
      snapshot.forEach(function(doc) {
        var data = doc.data();
        data._id = doc.id;
        allOrders.push(data);
      });
      populateFilterOptions();
      renderOrders();
    }).catch(function(err) {
      document.getElementById('ordersEmpty').textContent = 'Error al cargar inscripciones: ' + err.message;
      document.getElementById('ordersEmpty').classList.remove('hidden');
    });
  }

  function populateFilterOptions() {
    var select = document.getElementById('orderFilter');
    var courseIds = [];
    allOrders.forEach(function(o) {
      if (o.courseId && courseIds.indexOf(o.courseId) === -1) {
        courseIds.push(o.courseId);
      }
    });
    var opts = '<option value="all">Todos los cursos</option>';
    courseIds.forEach(function(cid) {
      var name = COURSES[cid] ? COURSES[cid].name : cid;
      opts += '<option value="' + cid + '">' + name + '</option>';
    });
    select.innerHTML = opts;
  }

  function renderOrders() {
    var courseFilter = document.getElementById('orderFilter').value;
    var statusFilter = document.getElementById('statusFilter').value;

    var filtered = allOrders.filter(function(o) {
      if (courseFilter !== 'all' && o.courseId !== courseFilter) return false;
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      return true;
    });

    var tbody = document.getElementById('ordersBody');
    var emptyEl = document.getElementById('ordersEmpty');

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      emptyEl.textContent = 'No se encontraron inscripciones con los filtros seleccionados.';
      emptyEl.classList.remove('hidden');
      return;
    }

    emptyEl.classList.add('hidden');
    var html = '';

    filtered.forEach(function(o) {
      var date = o.createdAt && o.createdAt.toDate ? o.createdAt.toDate().toLocaleDateString('es-AR') : '\u2014';
      var statusClass = o.status === 'paid' ? 'status-paid' : (o.status === 'cancelled' ? 'status-cancelled' : 'status-pending');
      var statusLabel = o.status === 'paid' ? 'Pagado' : (o.status === 'cancelled' ? 'Cancelado' : 'Pendiente');
      var planLabel = o.plan === 'personal' ? 'Personalizado' : 'Grupal';

      html += '<tr>';
      html += '<td>' + date + '</td>';
      html += '<td>' + (o.firstName || '') + ' ' + (o.lastName || '') + '</td>';
      html += '<td>' + (o.email || '') + '</td>';
      html += '<td>' + (o.phone || '') + '</td>';
      html += '<td>' + (o.courseName || o.courseId || '') + '</td>';
      html += '<td>' + planLabel + '</td>';
      html += '<td><span class="order-status ' + statusClass + '">' + statusLabel + '</span></td>';
      html += '<td>';
      if (o.status !== 'paid') {
        html += '<button class="admin-action-btn paid" onclick="updateOrderStatus(\'' + o._id + '\',\'paid\')">Marcar Pagado</button>';
      }
      if (o.status !== 'cancelled') {
        html += '<button class="admin-action-btn cancel" onclick="updateOrderStatus(\'' + o._id + '\',\'cancelled\')">Cancelar</button>';
      }
      html += '</td></tr>';
    });

    tbody.innerHTML = html;
  }

  window.updateOrderStatus = function(orderId, newStatus) {
    db.collection('orders').doc(orderId).update({ status: newStatus }).then(function() {
      allOrders.forEach(function(o) {
        if (o._id === orderId) o.status = newStatus;
      });
      renderOrders();
      var label = newStatus === 'paid' ? 'pagado' : 'cancelado';
      showToast('Estado actualizado a ' + label);
    }).catch(function(err) {
      showToast('Error: ' + err.message, 'error');
    });
  };

  document.getElementById('orderFilter').addEventListener('change', renderOrders);
  document.getElementById('statusFilter').addEventListener('change', renderOrders);

  loadCourses();
})();

