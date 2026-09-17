#!/bin/sh
# Sube el numero de version de los archivos propios en index.html.
# Hay que correrlo despues de tocar css/visual.css, css/portada.css,
# js/visual.js, js/portada.js, js/inicio.js, js/diagnostico.js o la escena,
# si no los visitantes que ya
# entraron se quedan con la copia vieja guardada en su navegador.
# Los seis llevan siempre el mismo numero.
set -e
cd "$(dirname "$0")"
actual=$(grep -o 'visual\.css?v=[0-9]*' index.html | head -1 | sed 's/.*v=//')
nueva=$((actual + 1))
for f in css/visual.css css/portada.css js/visual.js js/portada.js js/inicio.js js/diagnostico.js; do
  sed -i "s#$f?v=$actual#$f?v=$nueva#" index.html
done
echo "version $actual -> $nueva"
