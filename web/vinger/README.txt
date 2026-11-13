These files come from https://github.com/rarevogel/vingerafdruk (commit f3d5509), MIT licence, see LICENSE.
field.js, gabor.js, analyze.js and paint.js are unchanged except for the module.exports line in field.js;
balance.js holds balance() and generate() from that app's app.js.
build.py wraps them in one function so their names (W, H, rng, ...) do not clash with the dossier code;
only window.Vinger is exposed.
