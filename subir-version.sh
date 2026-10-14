#!/bin/sh
# Sube el numero de version (?v=N) de los archivos propios en TODAS las paginas
# que los cargan. Hay que correrlo despues de tocar css/visual.css,
# css/portada.css, css/secciones.css, js/visual.js, js/portada.js, js/inicio.js,
# js/diagnostico.js, js/redirigir.js o la escena; si no, los visitantes que ya
# entraron se quedan con la copia vieja guardada en su navegador.
# Todos llevan siempre el mismo numero, y en todas las paginas.
# Desde el 14/10/2026 son cuatro paginas: la portada, /agentes-de-ia/ (la portada
# vieja), /paginas-web/ y /software-personalizado/. Si se suma otra que cargue
# alguno de estos archivos, va en PAGINAS.
set -e
cd "$(dirname "$0")"
PAGINAS="index.html agentes-de-ia/index.html paginas-web/index.html software-personalizado/index.html"
ARCHIVOS="css/visual.css css/portada.css css/secciones.css js/visual.js js/portada.js js/inicio.js js/diagnostico.js js/redirigir.js"
actual=$(grep -o 'visual\.css?v=[0-9]*' index.html | head -1 | sed 's/.*v=//')
nueva=$((actual + 1))
for p in $PAGINAS; do
  for f in $ARCHIVOS; do
    # vale tanto "css/x.css?v=" (portada) como "../css/x.css?v=" (subcarpetas)
    sed -i "s#$f?v=$actual\"#$f?v=$nueva\"#g" "$p"
  done
done
# Ninguna pagina puede quedar con la version vieja
if grep -l "?v=$actual\"" $PAGINAS; then
  echo "ERROR: esas paginas quedaron con ?v=$actual" >&2
  exit 1
fi
echo "version $actual -> $nueva"
