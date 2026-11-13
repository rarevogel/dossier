# Dossier

Generates complete fictional person files that look like an intelligence registry file: identification sheet with front and profile photographs, ten-print fingerprint card, background, and an observation log. One web page and an Android app (phone and tablet).

Every person, number and address is invented at random. The agency on the forms (Meridian Records Directorate) does not exist.

    npm install          # fonts (@fontsource: Inter, IBM Plex Mono)
    python3 build.py     # -> dist/dossier.html and android/assets/index.html
    node tests/gen.test.mjs
    cd android && ANDROID_JAR=... KEYSTORE_FILE=... KEYSTORE_PASSWORD=... KEY_ALIAS=dossier ./build.sh

- `web/data.js` – per-country data (names, cities, streets, formats) and appearance ranges
- `web/gen.js` – the person generator (same seed and choices give the same person)
- `web/portrait.js` – the face description (hair, eyes, glasses, build) used in the file and the photo prompt
- `web/photo.js` – builds the prompt and image addresses for the AI photographs (Pollinations; optional API key, stored only on the device)
- `web/vinger/` – the fingerprint generator from [Vingerafdruk](https://github.com/rarevogel/vingerafdruk) (MIT): orientation field (Sherlock–Monro), ridges grown by Gabor filtering (SFinGe idea, WebGL with CPU fallback), minutiae and pores, painted as a live-scan image
- `web/finger.js` – shared random generator and pattern names
- `web/app.js`, `web/index.html` – the file layout and controls
- The keystore is not part of this source.
