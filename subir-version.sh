#!/bin/sh
# Sube el numero de version de los archivos propios en index.html.
# Hay que correrlo despues de tocar css/visual.css, js/visual.js o la
# escena, si no los visitantes que ya entraron se quedan con la copia
# vieja guardada en su navegador.
set -e
cd "$(dirname "$0")"
actual=$(grep -o 'visual\.css?v=[0-9]*' index.html | head -1 | sed 's/.*v=//')
nueva=$((actual + 1))
sed -i "s/visual\.css?v=$actual/visual.css?v=$nueva/; s/visual\.js?v=$actual/visual.js?v=$nueva/" index.html
echo "version $actual -> $nueva"
