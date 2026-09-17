/* ============================================================
   1. LAS PESTANAS
   Van primero y no dependen de nada: si la libreria de animacion
   no carga, la navegacion sigue funcionando igual.
   Sin JavaScript no se agrega la clase "pestanas" y entonces se
   ven todas las vistas una abajo de la otra.
   ============================================================ */
var Pestanas = (function () {
  var vistas  = [].slice.call(document.querySelectorAll(".vista"));
  var botones = [].slice.call(document.querySelectorAll(".menu button[data-vista]"));
  if (!vistas.length || !botones.length) return null;

  document.body.classList.add("pestanas");

  var alCambiar = null;

  function ir(id, mover) {
    var destino = document.getElementById("v-" + id);
    if (!destino) return;

    vistas.forEach(function (v) { v.classList.toggle("activa", v === destino); });
    botones.forEach(function (b) {
      if (b.dataset.vista === id) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });

    // En el celular el menu se desliza de costado: que la pestana
    // elegida no quede escondida afuera.
    var menu = document.querySelector(".menu");
    var activo = menu && menu.querySelector('[aria-current="page"]');
    if (menu && activo && menu.scrollWidth > menu.clientWidth) {
      menu.scrollLeft = Math.max(0, activo.offsetLeft - (menu.clientWidth - activo.offsetWidth) / 2);
    }

    if (history.replaceState) history.replaceState(null, "", "#" + id);

    if (mover) {
      var suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: suave ? "smooth" : "auto" });
    }
    if (alCambiar) alCambiar(destino);
  }

  botones.forEach(function (b) {
    b.addEventListener("click", function () { ir(b.dataset.vista, true); });
  });
  [].slice.call(document.querySelectorAll("[data-ir]")).forEach(function (b) {
    b.addEventListener("click", function (e) {
      if (b.tagName === "A") e.preventDefault();
      ir(b.dataset.ir, true);
    });
  });
  window.addEventListener("hashchange", function () {
    var id = (location.hash || "").replace("#", "");
    if (!id || document.getElementById("v-" + id)) ir(id || vistas[0].id.replace("v-", ""), false);
  });

  // Arranque: si el link traia una pestana, se abre esa.
  var inicial = (location.hash || "").replace("#", "");
  if (!document.getElementById("v-" + inicial)) inicial = vistas[0].id.replace("v-", "");
  ir(inicial, false);

  return { ir: ir, alCambiar: function (fn) { alCambiar = fn; } };
})();

/* ============================================================
   2. EL MOVIMIENTO
   Todo lo de abajo es decoracion. Si falta, la pagina funciona.
   ============================================================ */
(function () {
  if (typeof gsap === "undefined") return;
  if (typeof ScrollTrigger !== "undefined") gsap.registerPlugin(ScrollTrigger);

  var mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", function () {

    /* --- entrada de la portada (solo si se abre en la portada) --- */
    if (document.querySelector("#v-inicio.activa")) {
      gsap.timeline({ defaults: { ease: "expo.out" } })
        .from(".hero-logo",        { opacity: 0, y: 26, scale: .9, duration: .9 })
        .from(".hero .eyebrow",    { opacity: 0, y: 14, duration: .6 }, "-=.55")
        .from(".hero-h1",          { opacity: 0, y: 10, duration: .5 }, "-=.45")
        .from(".hero .hero-title", { opacity: 0, y: 22, duration: .8 }, "-=.35")
        .from(".hero-sub",         { opacity: 0, y: 18, duration: .7 }, "-=.55")
        .from(".hero-cta > *",     { opacity: 0, y: 14, duration: .6, stagger: .09 }, "-=.45")
        .from(".hero-trust li",    { opacity: 0, y: 10, duration: .5, stagger: .06 }, "-=.4");
    }

    /* --- el logo mira hacia donde esta el puntero --- */
    var logo = document.querySelector(".hero-logo");
    var hero = document.querySelector(".hero");
    if (logo && hero && window.matchMedia("(hover: hover)").matches) {
      var rx = gsap.quickTo(logo, "rotationX", { duration: .6, ease: "power3.out" });
      var ry = gsap.quickTo(logo, "rotationY", { duration: .6, ease: "power3.out" });
      hero.addEventListener("pointermove", function (e) {
        var r = hero.getBoundingClientRect();
        rx(gsap.utils.clamp(-11, 11, -((e.clientY - r.top - r.height / 2) / r.height) * 22));
        ry(gsap.utils.clamp(-11, 11,  ((e.clientX - r.left - r.width  / 2) / r.width)  * 22));
      });
      hero.addEventListener("pointerleave", function () { rx(0); ry(0); });
    }
  });

  // Las fuentes y el logo cambian las alturas al terminar de cargar.
  if (typeof ScrollTrigger !== "undefined") {
    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
  }

  // Red de seguridad: a los 4 segundos no puede quedar un bloque invisible.
  // Preferimos perder una animacion antes que perder texto. Solo se rescata
  // lo que YA deberia verse: lo de mas abajo espera su turno al bajar.
  // (La otra red, con el mismo criterio, vive en js/visual.js.)
  setTimeout(function () {
    document.querySelectorAll(".vista.activa .hero-texto > *, .vista.activa .hero-cta > *, " +
                             ".vista.activa .hero-logo, .vista.activa .hero-trust li")
      .forEach(function (el) {
        var r = el.getBoundingClientRect();
        var enPantalla = r.top < (window.innerHeight || 0) && r.bottom > 0;
        if (enPantalla && parseFloat(getComputedStyle(el).opacity) < .98) {
          gsap.set(el, { clearProps: "opacity,transform" });
        }
      });
  }, 4000);

  // Al imprimir o guardar como PDF: se muestran TODAS las vistas y nada a medio animar.
  window.addEventListener("beforeprint", function () {
    if (typeof ScrollTrigger !== "undefined") {
      ScrollTrigger.getAll().forEach(function (t) { t.kill(false); });
    }
    gsap.globalTimeline.progress(1);
    gsap.set(".hero-logo, .hero-texto > *, .hero-cta > *, .hero-trust li", { clearProps: "all" });
  });
})();
