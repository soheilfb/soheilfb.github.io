# soheilfb.github.io

Personal site of Soheil Fallah Bagherinezhad, PhD candidate at the University of Trento.
Live at https://soheilfb.github.io/

Plain HTML, CSS and a little JavaScript, no build step. GitHub Pages serves the `master` branch as is.

```
index.html          the whole site (one page)
contact.html        old URL, redirects to index.html#contact
css/style.css       all styles; colours are the variables at the top
js/trace.js         the hero plot (name sent as 4-bit samples)
fonts/              Archivo variable font (SIL Open Font License, see OFL.txt)
img/                portrait.jpg / portrait-360.jpg (used), favicon.svg
```

To update: edit the text in `index.html` and push. To change the photo, replace `img/portrait.jpg`
and `img/portrait-360.jpg` with square images (591 px and 360 px).
To preview locally: `python -m http.server` in this folder, then open http://localhost:8000
