/**
 * Firebase Auth Pre-Request Script
 * Automatically refreshes Firebase ID token when expired
 * 
 * Add this to Collection → Scripts → Pre-request
 * Requires environment variables:
 * - FIREBASE_EMAIL
 * - FIREBASE_PASSWORD
 * - FIREBASE_API_KEY (from Firebase console)
 * - BASE_URL (for backend endpoint)
 * 
 * Produces environment variables:
 * - FIREBASE_ID_TOKEN
 * - TOKEN_EXPIRY (epoch seconds)
 */

function needsToken() {
  const token = pm.environment.get('FIREBASE_ID_TOKEN');
  const exp = parseInt(pm.environment.get('TOKEN_EXPIRY') || '0', 10);
  const now = Math.floor(Date.now() / 1000);
  return !token || !exp || (exp - now) < 60; // refresh 60s early
}

if (needsToken()) {
  const email = pm.environment.get('FIREBASE_EMAIL');
  const password = pm.environment.get('FIREBASE_PASSWORD');
  const apiKey = pm.environment.get('FIREBASE_API_KEY');

  if (!email || !password || !apiKey) {
    console.log('Skipping auth: Missing FIREBASE_EMAIL, FIREBASE_PASSWORD, or FIREBASE_API_KEY');
  } else {
    const body = {
      email: email,
      password: password,
      returnSecureToken: true
    };

    pm.sendRequest({
      url: 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + apiKey,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      body: {
        mode: 'raw',
        raw: JSON.stringify(body)
      }
    }, function(err, res) {
      if (err || !res) {
        console.error('Firebase auth failed', err);
        return;
      }

      const json = res.json();
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = parseInt(json.expiresIn || '3600', 10);

      pm.environment.set('FIREBASE_ID_TOKEN', json.idToken);
      pm.environment.set('TOKEN_EXPIRY', (now + expiresIn).toString());
      
      console.log('✓ Firebase ID token refreshed');
    });
  }
}

