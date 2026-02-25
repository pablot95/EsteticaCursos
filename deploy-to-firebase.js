const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('\n  ERROR: Falta el archivo serviceAccountKey.json');
  console.error('  1. Andá a Firebase Console -> Configuración del proyecto -> Cuentas de servicio');
  console.error('  2. Hacé click en "Generar nueva clave privada"');
  console.error('  3. Guardá el archivo como "serviceAccountKey.json" en la carpeta raíz del proyecto\n');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'esteticacursosrc.firebasestorage.app'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

const COURSES_DATA = require('./js/courses-data-export.js');

async function uploadImage(localPath) {
  var fullPath = path.join(__dirname, localPath);
  if (!fs.existsSync(fullPath)) {
    console.log('  ⚠ Imagen no encontrada: ' + localPath);
    return localPath;
  }

  var destination = 'courses/' + path.basename(localPath);

  try {
    await bucket.upload(fullPath, {
      destination: destination,
      metadata: {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000'
      }
    });

    var file = bucket.file(destination);
    await file.makePublic();

    var publicUrl = 'https://storage.googleapis.com/' + bucket.name + '/' + destination;
    console.log('  ✓ ' + localPath + ' -> ' + publicUrl);
    return publicUrl;
  } catch (err) {
    console.log('  ✗ Error subiendo ' + localPath + ': ' + err.message);
    return localPath;
  }
}

async function deployCourseData() {
  console.log('\n========================================');
  console.log('  DEPLOY CURSOS A FIREBASE');
  console.log('========================================\n');

  var courseIds = Object.keys(COURSES_DATA.COURSES);

  for (var i = 0; i < courseIds.length; i++) {
    var id = courseIds[i];
    var course = COURSES_DATA.COURSES[id];

    console.log('\n[' + (i + 1) + '/' + courseIds.length + '] ' + course.name);
    console.log('  Subiendo imágenes...');

    var imageUrl = await uploadImage(course.image);
    var temarioUrl = course.temarioImage ? await uploadImage(course.temarioImage) : '';

    var courseDoc = {
      name: course.name,
      tagline: course.tagline,
      image: imageUrl,
      temarioImage: temarioUrl,
      duration: course.duration,
      shortDesc: course.shortDesc,
      includes: course.includes,
      priceGroup: course.priceGroup,
      pricePersonal: course.pricePersonal,
      certificate: course.certificate,
      syllabus: course.syllabus
    };

    await db.collection('courses').doc(id).set(courseDoc, { merge: true });
    console.log('  ✓ Datos guardados en Firestore');
  }

  await db.collection('config').doc('courseOrder').set({
    order: COURSES_DATA.COURSE_ORDER
  });
  console.log('\n✓ Orden de cursos guardado');

  console.log('\n========================================');
  console.log('  DEPLOY COMPLETADO');
  console.log('========================================\n');
  process.exit(0);
}

deployCourseData().catch(function(err) {
  console.error('Error fatal:', err);
  process.exit(1);
});
