const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

// 1x1 valid PNG pixel in Base64
const SAMPLE_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const samplePngBuffer = Buffer.from(SAMPLE_PNG_BASE64, 'base64');

async function runTests() {
  console.log('====================================================');
  console.log(' MIFTHAHUL ULOOM - MEDIA UPLOAD & SECURITY TEST SUITE');
  console.log('====================================================\n');

  let adminCookie = '';
  let studentCookie = '';

  // Step 1: Login as Admin
  console.log('1. Authenticating as Super Admin...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });

  if (!loginRes.ok) {
    throw new Error(`Admin login failed: ${loginRes.status}`);
  }
  const rawSetCookie = loginRes.headers.get('set-cookie');
  adminCookie = rawSetCookie.split(';')[0];
  console.log('✓ Admin authenticated successfully.\n');

  // Step 2: Test Public Uploads
  console.log('2. Testing Public Media Uploads (Branding, Hero, Gallery, Events, Teachers, Achievements)...');
  const categories = [
    { cat: 'branding', label: 'Madrasa Logo' },
    { cat: 'hero', label: 'Hero Image' },
    { cat: 'principal', label: 'Principal Photo' },
    { cat: 'gallery', label: 'Gallery Image' },
    { cat: 'events', label: 'Event Banner' },
    { cat: 'teachers', label: 'Teacher Portrait' },
    { cat: 'achievements', label: 'Achievement Certificate' }
  ];

  const uploadedUrls = {};

  for (const { cat, label } of categories) {
    const formData = new FormData();
    const blob = new Blob([samplePngBuffer], { type: 'image/png' });
    formData.append('file', blob, `test-${cat}.png`);
    formData.append('category', cat);

    const uploadRes = await fetch(`${BASE_URL}/api/media/upload`, {
      method: 'POST',
      headers: { 'Cookie': adminCookie },
      body: formData
    });

    const resJson = await uploadRes.json();
    if (!uploadRes.ok || !resJson.url) {
      throw new Error(`Failed to upload ${label}: ${JSON.stringify(resJson)}`);
    }
    uploadedUrls[cat] = resJson.url;
    console.log(`  ✓ ${label} uploaded: ${resJson.url}`);
  }
  console.log('✓ All 7 public media categories uploaded and verified.\n');

  // Step 3: Test Private Student Photo Upload
  console.log('3. Testing Private Student Photo Upload (Isolated in storage/students/)...');
  const studentFormData = new FormData();
  const studentBlob = new Blob([samplePngBuffer], { type: 'image/png' });
  studentFormData.append('file', studentBlob, 'student-portrait.png');
  studentFormData.append('category', 'students');
  studentFormData.append('studentId', '1');

  const studentUploadRes = await fetch(`${BASE_URL}/api/media/upload`, {
    method: 'POST',
    headers: { 'Cookie': adminCookie },
    body: studentFormData
  });

  const studentUploadJson = await studentUploadRes.json();
  if (!studentUploadRes.ok || !studentUploadJson.url) {
    throw new Error(`Student photo upload failed: ${JSON.stringify(studentUploadJson)}`);
  }
  const filename = new URL(`${BASE_URL}${studentUploadJson.url}`).searchParams.get('file');
  const privateDiskPath = path.join(process.cwd(), 'storage', 'students', filename);
  console.log(`  ✓ Private File path: ${privateDiskPath}`);

  const existsInPrivateStorage = fs.existsSync(privateDiskPath);
  if (!existsInPrivateStorage) {
    throw new Error(`File was not created on disk in private storage folder: ${privateDiskPath}`);
  }
  console.log('  ✓ Verified on-disk presence in private storage/students/\n');

  // Step 4: Test Security & Privacy Isolation
  console.log('4. Testing Access Control on Private Student Photos...');
  
  // 4a. Unauthenticated access MUST be 403 Forbidden
  console.log('  - Testing Unauthenticated access to /api/media/student-photo...');
  const unauthRes = await fetch(`${BASE_URL}${studentUploadJson.url}`);
  if (unauthRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden for unauthenticated request, got: ${unauthRes.status}`);
  }
  console.log('  ✓ PASS: Unauthenticated access blocked with 403 Forbidden (Privacy Protected).');

  // 4b. Authenticated Admin access MUST succeed with 200 OK and image/png
  console.log('  - Testing Authorized Super Admin access to /api/media/student-photo...');
  const authRes = await fetch(`${BASE_URL}${studentUploadJson.url}`, {
    headers: { 'Cookie': adminCookie }
  });
  if (authRes.status !== 200) {
    throw new Error(`Expected 200 OK for authorized admin, got: ${authRes.status}`);
  }
  const contentType = authRes.headers.get('content-type');
  console.log(`  ✓ PASS: Authorized Admin stream returned status 200 OK (${contentType}).\n`);

  // Step 5: Test Setting Active Branding Assets & Live Settings
  console.log('5. Testing Active Website Asset Assignment & Dynamic Public Display...');
  const setLogoRes = await fetch(`${BASE_URL}/api/media/manage`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': adminCookie
    },
    body: JSON.stringify({
      action: 'SET_ACTIVE_ASSET',
      key: 'logo_url',
      url: uploadedUrls.branding
    })
  });
  const setLogoJson = await setLogoRes.json();
  if (!setLogoRes.ok) {
    throw new Error(`Set logo failed: ${JSON.stringify(setLogoJson)}`);
  }
  console.log('  ✓ Logo set as active institution branding.');

  const setHeroRes = await fetch(`${BASE_URL}/api/media/manage`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': adminCookie
    },
    body: JSON.stringify({
      action: 'SET_ACTIVE_ASSET',
      key: 'hero_image_url',
      url: uploadedUrls.hero
    })
  });
  console.log('  ✓ Hero photo set as active homepage background.');

  // Step 6: Verify Public Content API
  console.log('6. Verifying Public Website Content reflects updated images...');
  const publicContentRes = await fetch(`${BASE_URL}/api/public/content`);
  const publicContent = await publicContentRes.json();
  if (publicContent.settings.logo_url !== uploadedUrls.branding) {
    throw new Error(`Public settings logo mismatch. Expected ${uploadedUrls.branding}, got ${publicContent.settings.logo_url}`);
  }
  if (publicContent.settings.hero_image_url !== uploadedUrls.hero) {
    throw new Error(`Public settings hero mismatch. Expected ${uploadedUrls.hero}, got ${publicContent.settings.hero_image_url}`);
  }
  console.log('  ✓ Public settings successfully reflects active logo and hero image URLs.\n');

  // Step 7: Media Listing API
  console.log('7. Testing Media Library Listing API (/api/media/manage)...');
  const mediaListRes = await fetch(`${BASE_URL}/api/media/manage`, {
    headers: { 'Cookie': adminCookie }
  });
  const mediaListJson = await mediaListRes.json();
  if (!mediaListRes.ok || !mediaListJson.media || mediaListJson.media.length === 0) {
    throw new Error(`Media listing failed or empty: ${JSON.stringify(mediaListJson)}`);
  }
  console.log(`  ✓ Successfully listed ${mediaListJson.media.length} media files across all categories.\n`);

  console.log('====================================================');
  console.log(' ⭐ ALL MEDIA SYSTEM TESTS PASSED SUCCESSFULLY! ⭐');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
