/* Links viejos: la portada de automatizaciones se mudo a /agentes-de-ia/ el 14/10/2026.
   Quien llega con /#hacemos (o cualquiera de las pestanas de antes) sigue al mismo lugar.
   "#inicio" no se redirige: el sitio viejo ponia /#inicio en cada visita, asi que
   esos links buscaban la portada, y la portada es esta. */
(function () {
  var viejos = ["hacemos", "funciona", "ejemplos", "hablemos", "demo", "diagnostico"];
  var h = (location.hash || "").replace("#", "");
  if (viejos.indexOf(h) !== -1) location.replace("agentes-de-ia/#" + h);
})();
