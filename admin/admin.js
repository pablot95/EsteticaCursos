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
  var usersPanel = document.getElementById('panelUsers');

  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      tabs.forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      var target = tab.getAttribute('data-tab');
      coursesPanel.classList.add('hidden');
      ordersPanel.classList.add('hidden');
      usersPanel.classList.add('hidden');
      if (target === 'courses') {
        coursesPanel.classList.remove('hidden');
      } else if (target === 'orders') {
        ordersPanel.classList.remove('hidden');
        loadOrders();
      } else if (target === 'users') {
        usersPanel.classList.remove('hidden');
        loadUsers();
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

  /* --- Modules (Exclusive Content) Editor --- */
  var moduleBlocks = [];

  function renderModulesEditor() {
    var container = document.getElementById('modulesEditor');
    var html = '';
    moduleBlocks.forEach(function(mod, idx) {
      html += '<div class="module-edit-block" data-midx="' + idx + '">';
      html += '<div class="syllabus-edit-header">';
      html += '<span class="syllabus-block-num" style="background:#C5A55A;">' + (idx + 1) + '</span>';
      html += '<input type="text" class="syllabus-block-title module-block-title" value="' + escapeAttr(mod.title) + '" placeholder="Título del módulo">';
      html += '<button type="button" class="syllabus-remove-btn" onclick="removeModuleBlock(' + idx + ')" title="Eliminar módulo">\u00d7</button>';
      html += '</div>';
      html += '<div class="module-items-editor" id="moduleItems_' + idx + '">';
      (mod.items || []).forEach(function(item, iIdx) {
        html += renderModuleItemRow(idx, iIdx, item);
      });
      html += '</div>';
      html += '<button type="button" class="admin-add-item-btn" onclick="addModuleItem(' + idx + ')">+ Agregar Video/PDF</button>';
      html += '</div>';
    });
    container.innerHTML = html;
  }

  function renderModuleItemRow(modIdx, itemIdx, item) {
    var html = '<div class="module-item-row" data-iidx="' + itemIdx + '">';
    html += '<select class="module-item-type" onchange="updateModuleItemType(' + modIdx + ',' + itemIdx + ',this.value)">';
    html += '<option value="video"' + (item.type === 'video' ? ' selected' : '') + '>Video</option>';
    html += '<option value="pdf"' + (item.type === 'pdf' ? ' selected' : '') + '>PDF</option>';
    html += '</select>';
    html += '<input type="text" class="module-item-title" value="' + escapeAttr(item.title) + '" placeholder="Título del contenido">';
    html += '<input type="url" class="module-item-url" value="' + escapeAttr(item.url) + '" placeholder="URL o subí un archivo →">';
    html += '<label class="module-upload-label" title="Subir archivo">';
    html += '<input type="file" class="module-upload-input" accept="video/*,.pdf,.mp4,.mov,.avi,.webm" onchange="handleModuleFileUpload(this,' + modIdx + ',' + itemIdx + ')" style="display:none;">';
    html += '<span class="module-upload-btn">📁 Subir</span>';
    html += '</label>';
    html += '<button type="button" class="syllabus-remove-btn" onclick="removeModuleItem(' + modIdx + ',' + itemIdx + ')" title="Eliminar">×</button>';
    html += '</div>';
    return html;
  }

  window.handleModuleFileUpload = async function(input, modIdx, itemIdx) {
    if (!input.files || !input.files[0]) return;
    var file = input.files[0];
    var courseId = document.getElementById('editCourseId').value;

    // Validate file size (max 500MB)
    if (file.size > 500 * 1024 * 1024) {
      showToast('El archivo es demasiado grande (máx 500MB)', 'error');
      return;
    }

    var uploadBtn = input.parentElement.querySelector('.module-upload-btn');
    var urlInput = input.closest('.module-item-row').querySelector('.module-item-url');
    uploadBtn.textContent = '⏳ Subiendo...';
    uploadBtn.style.pointerEvents = 'none';

    try {
      var ext = file.name.split('.').pop();
      var safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      var storagePath = 'modules/' + courseId + '/mod' + modIdx + '_item' + itemIdx + '_' + safeName;
      var ref = storage.ref(storagePath);
      var uploadTask = ref.put(file);

      uploadTask.on('state_changed', function(snapshot) {
        var pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        uploadBtn.textContent = '⏳ ' + pct + '%';
      });

      await uploadTask;
      var downloadUrl = await ref.getDownloadURL();
      urlInput.value = downloadUrl;
      uploadBtn.textContent = '✅ Listo';
      showToast('Archivo subido correctamente');
    } catch (err) {
      showToast('Error al subir: ' + err.message, 'error');
      uploadBtn.textContent = '📁 Subir';
    } finally {
      uploadBtn.style.pointerEvents = '';
    }
  };

  function collectModules() {
    var blocks = [];
    document.querySelectorAll('.module-edit-block').forEach(function(el) {
      var title = el.querySelector('.module-block-title').value.trim();
      var items = [];
      el.querySelectorAll('.module-item-row').forEach(function(row) {
        var type = row.querySelector('.module-item-type').value;
        var itemTitle = row.querySelector('.module-item-title').value.trim();
        var url = row.querySelector('.module-item-url').value.trim();
        if (itemTitle || url) {
          items.push({ type: type, title: itemTitle, url: url });
        }
      });
      if (title || items.length > 0) {
        blocks.push({ title: title, items: items });
      }
    });
    return blocks;
  }

  window.removeModuleBlock = function(idx) {
    moduleBlocks = collectModules();
    moduleBlocks.splice(idx, 1);
    renderModulesEditor();
  };

  window.addModuleItem = function(modIdx) {
    moduleBlocks = collectModules();
    if (!moduleBlocks[modIdx]) return;
    moduleBlocks[modIdx].items.push({ type: 'video', title: '', url: '' });
    renderModulesEditor();
  };

  window.removeModuleItem = function(modIdx, itemIdx) {
    moduleBlocks = collectModules();
    if (moduleBlocks[modIdx] && moduleBlocks[modIdx].items) {
      moduleBlocks[modIdx].items.splice(itemIdx, 1);
    }
    renderModulesEditor();
  };

  window.updateModuleItemType = function() {
    // Type updates in real-time via select, no action needed
  };

  document.getElementById('addModuleBlock').addEventListener('click', function() {
    moduleBlocks = collectModules();
    moduleBlocks.push({ title: '', items: [] });
    renderModulesEditor();
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

    // Modules (Exclusive Content)
    moduleBlocks = (c.modules || []).map(function(m) {
      return {
        title: m.title || '',
        items: (m.items || []).map(function(it) {
          return { type: it.type || 'video', title: it.title || '', url: it.url || '' };
        })
      };
    });
    renderModulesEditor();

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
        syllabus: collectSyllabus(),
        modules: collectModules()
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
      var order = null;
      allOrders.forEach(function(o) {
        if (o._id === orderId) {
          o.status = newStatus;
          order = o;
        }
      });
      renderOrders();
      var label = newStatus === 'paid' ? 'pagado' : 'cancelado';
      showToast('Estado actualizado a ' + label);

      // If marked as paid, grant course access to the user
      if (newStatus === 'paid' && order && order.courseId) {
        grantCourseAccess(order);
      }
    }).catch(function(err) {
      showToast('Error: ' + err.message, 'error');
    });
  };

  function grantCourseAccess(order) {
    var courseId = order.courseId;

    if (order.userUid) {
      // Direct UID reference: update user doc
      db.collection('users').doc(order.userUid).update({
        purchasedCourses: firebase.firestore.FieldValue.arrayUnion(courseId)
      }).then(function() {
        showToast('Acceso al curso otorgado al alumno');
      }).catch(function(err) {
        console.error('Error granting access by UID:', err);
        // Fallback: try by email
        if (order.email) grantCourseByEmail(order.email, courseId);
      });
    } else if (order.email) {
      grantCourseByEmail(order.email, courseId);
    }
  }

  function grantCourseByEmail(email, courseId) {
    db.collection('users').where('email', '==', email).limit(1).get()
      .then(function(snap) {
        if (!snap.empty) {
          var userDoc = snap.docs[0];
          return userDoc.ref.update({
            purchasedCourses: firebase.firestore.FieldValue.arrayUnion(courseId)
          });
        } else {
          showToast('No se encontró usuario con email ' + email + '. El alumno debe registrarse primero.', 'error');
        }
      })
      .then(function() {
        showToast('Acceso al curso otorgado al alumno');
      })
      .catch(function(err) {
        showToast('Error al otorgar acceso: ' + err.message, 'error');
      });
  }

  document.getElementById('orderFilter').addEventListener('change', renderOrders);
  document.getElementById('statusFilter').addEventListener('change', renderOrders);

  /* --- Users --- */
  function loadUsers() {
    db.collection('users').orderBy('createdAt', 'desc').get().then(function(snapshot) {
      var users = [];
      snapshot.forEach(function(doc) {
        var data = doc.data();
        data._id = doc.id;
        users.push(data);
      });
      renderUsers(users);
    }).catch(function(err) {
      var emptyEl = document.getElementById('usersEmpty');
      emptyEl.textContent = 'Error al cargar usuarios: ' + err.message;
      emptyEl.classList.remove('hidden');
    });
  }

  function renderUsers(users) {
    var tbody = document.getElementById('usersBody');
    var emptyEl = document.getElementById('usersEmpty');

    if (users.length === 0) {
      tbody.innerHTML = '';
      emptyEl.classList.remove('hidden');
      return;
    }

    emptyEl.classList.add('hidden');
    var html = '';

    users.forEach(function(u) {
      var date = u.createdAt && u.createdAt.toDate ? u.createdAt.toDate().toLocaleDateString('es-AR') : '\u2014';
      var courses = (u.purchasedCourses || []).map(function(cid) {
        return COURSES[cid] ? COURSES[cid].name : cid;
      }).join(', ') || 'Ninguno';

      html += '<tr>';
      html += '<td>' + (u.firstName || '') + ' ' + (u.lastName || '') + '</td>';
      html += '<td>' + (u.email || '') + '</td>';
      html += '<td>' + (u.phone || '') + '</td>';
      html += '<td>' + courses + '</td>';
      html += '<td>' + date + '</td>';
      html += '</tr>';
    });

    tbody.innerHTML = html;
  }

  loadCourses();
})();

