#!/usr/bin/env python3
"""Builds one self-contained dossier.html (fonts and code inlined) and copies it into the Android app."""
import base64, os, re, shutil
here = os.path.dirname(os.path.abspath(__file__))
web = os.path.join(here, 'web'); fs = os.path.join(here, 'node_modules', '@fontsource')
RANGE = {'latin': 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2212',
         'latin-ext': 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113'}
def font(family, pkg, weight):
    out = ''
    for sub in ('latin-ext', 'latin'):
        p = os.path.join(fs, pkg, 'files', f'{pkg}-{sub}-{weight}-normal.woff2')
        data = base64.b64encode(open(p, 'rb').read()).decode()
        out += f"@font-face{{font-family:'{family}';font-weight:{weight};font-display:swap;src:url(data:font/woff2;base64,{data}) format('woff2');unicode-range:{RANGE[sub]}}}\n"
    return out
fonts = ''.join(font('Inter', 'inter', w) for w in (400, 500, 600, 700)) + font('IBM Plex Mono', 'ibm-plex-mono', 400) + font('IBM Plex Mono', 'ibm-plex-mono', 500)
def module(name):
    s = open(os.path.join(web, name)).read()
    s = re.sub(r'^import .*?;\n', '', s, flags=re.M)
    return re.sub(r'^export ', '', s, flags=re.M)
script = '\n'.join(module(n) for n in ['data.js', 'finger.js', 'portrait.js', 'gen.js', 'photo.js', 'app.js'])
vinger = '\n'.join(open(os.path.join(web, 'vinger', n)).read().replace('"use strict";', '') for n in ['field.js', 'gabor.js', 'analyze.js', 'paint.js', 'balance.js'])
vinger = '(function () {\n"use strict";\n' + vinger + '\nwindow.Vinger = { makePlan, Gabor, analyze, balance, paint, generate, FINGERS, W, H };\n})();'
html = open(os.path.join(web, 'index.html')).read().replace('/*@FONTS*/', fonts).replace('/*@VINGER*/', vinger.replace('</script', '<\\/script')).replace('/*@SCRIPT*/', script)
os.makedirs(os.path.join(here, 'dist'), exist_ok=True)
out = os.path.join(here, 'dist', 'dossier.html'); open(out, 'w').write(html)
assets = os.path.join(here, 'android', 'assets'); os.makedirs(assets, exist_ok=True)
shutil.copy(out, os.path.join(assets, 'index.html'))
print(out, len(html), 'bytes')
