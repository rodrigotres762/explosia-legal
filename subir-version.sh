#!/bin/sh
# Sube el numero de version (?v=N) de los archivos propios en TODAS las paginas
# que los cargan. Hay que correrlo despues de tocar cualquiera de ARCHIVOS o la
# escena; si no, los visitantes que ya entraron se quedan con la copia vieja
# guardada en su navegador.
# Todos llevan siempre el mismo numero, y en todas las paginas.
# Desde el 24/10/2026 (rediseno) tambien los servicios y el blog cargan archivos
# con version (comun.css, servicios.css, vitrina.js), asi que van todas. Si se
# suma otra pagina que cargue alguno de estos archivos, va en PAGINAS.
# css/secciones.css ya no existe: lo que tenia paso a servicios.css.
set -e
cd "$(dirname "$0")"
PAGINAS="index.html agentes-de-ia/index.html paginas-web/index.html software-personalizado/index.html
servicios/whatsapp-ia/index.html servicios/automatizacion-crm/index.html servicios/integracion-n8n/index.html
blog/index.html blog/que-es-un-agente-de-ia/index.html blog/que-tareas-se-pueden-automatizar/index.html blog/automatizar-whatsapp-negocio/index.html"
ARCHIVOS="css/visual.css css/portada.css css/comun.css css/vitrina.css css/servicios.css js/visual.js js/portada.js js/inicio.js js/diagnostico.js js/redirigir.js js/vitrina.js"
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
