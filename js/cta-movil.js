/* ============================================================
   LA BARRA DE WHATSAPP DEL CELULAR
   Aparece abajo de todo cuando la persona ya bajo un poco y no
   tiene a la vista otro boton de WhatsApp (los que llevan
   data-oculta-barra). En pantallas anchas no existe: eso lo
   resuelve el CSS, aca solo se decide cuando se muestra.
   Si este archivo no carga, no pasa nada: cada pagina tiene sus
   propios botones.
   ============================================================ */
(function () {
  var barra = document.querySelector(".barra-cta");
  if (!barra) return;

  var movil = window.matchMedia("(max-width: 767px)");
  var DESDE = 320;          // pixeles de scroll antes de mostrarla
  var otros = [];           // { el, visible } de los otros botones

  function hayOtroALaVista() {
    for (var i = 0; i < otros.length; i++) {
      if (otros[i].visible) return true;
    }
    return false;
  }

  function actualizar() {
    var y = window.scrollY || window.pageYOffset || 0;
    var mostrar = movil.matches && y > DESDE && !hayOtroALaVista();
    if (mostrar !== barra.classList.contains("visible")) {
      barra.classList.toggle("visible", mostrar);
    }
  }

  var marcados = document.querySelectorAll("[data-oculta-barra]");
  if (marcados.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        for (var i = 0; i < otros.length; i++) {
          if (otros[i].el === e.target) otros[i].visible = e.isIntersecting;
        }
      });
      actualizar();
    });
    for (var i = 0; i < marcados.length; i++) {
      otros.push({ el: marcados[i], visible: false });
      io.observe(marcados[i]);
    }
  }

  var pendiente = false;
  window.addEventListener("scroll", function () {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(function () {
      pendiente = false;
      actualizar();
    });
  }, { passive: true });

  if (movil.addEventListener) movil.addEventListener("change", actualizar);
  else if (movil.addListener) movil.addListener(actualizar);

  actualizar();
})();
