/* ============================================================
   LA VITRINA: el movimiento de la portada moderna (24/10/2026)

   Regla que manda sobre todo lo demas: esto es decoracion. Sin
   este archivo, o si algo de aca falla, la pagina se ve entera y
   en su estado final (todos los mensajes del chat, el pedido ya
   facturado, los cuatro pasos prendidos). Este script primero
   esconde y despues anima; si no puede animar, no esconde.

   Tres modos:
   - Completo: entradas con desenfoque, parallax en la portada,
     la notebook que se abre, el panel que crece.
   - Suave (computadora que pidio menos movimiento; la PC de
     Rodrigo tiene los efectos de Windows apagados): lo atado al
     scroll sigue, sin desenfoque y sin nada que se mueva solo.
   - Calma (celular que pidio menos movimiento; el ahorro de
     bateria de Android lo prende solo): nada se desplaza ni
     crece, pero las cosas aparecen con fundido y los ejemplos
     AVANZAN igual. Menos movimiento no es sin dibujo.
   ?movimiento=si (o ?3d=si) fuerza el modo completo.

   Se carga en el <head> sin defer: marca la pagina antes del
   primer dibujo y espera al DOM para arrancar.
   ============================================================ */

(function () {
  var raiz = document.documentElement;
  var gsap = window.gsap;
  if (!gsap) return;   // sin libreria: no se esconde nada

  var forzado = /[?&](movimiento|3d)=si/.test(location.search);
  var pideMenos = window.matchMedia("(prefers-reduced-motion: reduce)").matches && !forzado;
  var escritorio = window.matchMedia("(hover: hover) and (pointer: fine)").matches && window.innerWidth >= 760;
  // Mismo criterio que el anillo 3D (js/visual.js):
  // - celular con menos movimiento (casi siempre el ahorro de bateria): calma, solo fundidos.
  // - computadora con menos movimiento (Windows con los efectos apagados): suave. Lo atado
  //   al scroll sigue, porque se mueve solo mientras la persona baja; sin desenfoque y sin
  //   nada que se mueva solo todo el tiempo (las tarjetitas que flotan, la luz que recorre).
  var calma = pideMenos && !escritorio;
  var suave = pideMenos && escritorio;

  raiz.classList.add("vitrina-js");
  if (!pideMenos) raiz.classList.add("vitrina-mueve");

  var ST = window.ScrollTrigger || null;
  if (ST) gsap.registerPlugin(ST);

  function todos(sel, base) { return [].slice.call((base || document).querySelectorAll(sel)); }
  function uno(sel, base) { return (base || document).querySelector(sel); }

  // Cada ejemplo animado se anota aca, para que la red de seguridad
  // y la impresion los puedan terminar de un saque.
  var secuencias = [];

  /* ============================================================
     1. LO DE ARRIBA DE TODO
     En cualquier pagina, lo marcado con data-intro entra al cargar.
     En la portada, ademas, el logo, las tarjetitas y el parallax.
     ============================================================ */

  function arriba() {
    var piezas = todos("[data-intro]");
    var logo = uno(".hero-logo");
    var chips = todos(".portada-escena .chip");
    var tl = gsap.timeline({ defaults: { ease: "expo.out" } });

    if (calma) {
      tl.to(piezas, { opacity: 1, duration: .7, stagger: .07 });
      if (logo) tl.to(logo, { opacity: 1, duration: .9 }, .15);
      if (chips.length) tl.to(chips, { opacity: 1, duration: .7, stagger: .12 }, .4);
      return;
    }

    if (piezas.length) {
      tl.fromTo(piezas,
        suave ? { opacity: 0, y: 14 } : { opacity: 0, y: 26, filter: "blur(10px)" },
        suave ? { opacity: 1, y: 0, duration: 1, stagger: .07 } :
                { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.2, stagger: .085, clearProps: "filter" });
    }
    if (logo) tl.fromTo(logo, { opacity: 0, scale: .82 }, { opacity: 1, scale: 1, duration: 1.7 }, .2);
    if (chips.length) tl.fromTo(chips, { opacity: 0, scale: .86 }, { opacity: 1, scale: 1, duration: 1.1, stagger: .13 }, .75);

    if (!ST || !uno(".portada")) return;

    // Al bajar, el texto se va y las tarjetitas suben a distinta velocidad.
    gsap.to(".portada-texto", {
      y: -70, opacity: .2, ease: "none",
      scrollTrigger: { trigger: ".portada", start: "top top", end: "bottom top", scrub: true }
    });
    // En el celular estan mas juntas: menos recorrido, asi no se pisan.
    var factor = window.matchMedia("(max-width: 640px)").matches ? .4 : 1;
    chips.forEach(function (c) {
      var vel = (parseFloat(c.getAttribute("data-vel")) || -60) * factor;
      gsap.to(c, {
        y: vel, ease: "none",
        scrollTrigger: { trigger: ".portada", start: "top top", end: "bottom top", scrub: true }
      });
    });
  }

  /* ============================================================
     2. LAS PALABRAS QUE SE PRENDEN
     ============================================================ */

  function partirPalabras(el) {
    var textos = [];
    var paseo = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    while (paseo.nextNode()) textos.push(paseo.currentNode);
    var palabras = [];
    textos.forEach(function (t) {
      var trozos = t.nodeValue.split(/(\s+)/);
      var frag = document.createDocumentFragment();
      trozos.forEach(function (tr) {
        if (!tr) return;
        if (/^\s+$/.test(tr)) { frag.appendChild(document.createTextNode(tr)); return; }
        var s = document.createElement("span");
        s.className = "palabra";
        s.textContent = tr;
        frag.appendChild(s);
        palabras.push(s);
      });
      t.parentNode.replaceChild(frag, t);
    });
    return palabras;
  }

  function manifiesto() {
    if (!ST) return;
    todos("[data-palabras]").forEach(function (el) {
      var palabras = partirPalabras(el);
      // Solo color: no mueve nada, asi que vale igual en modo calma.
      gsap.fromTo(palabras, { opacity: .14 }, {
        opacity: 1, ease: "none", stagger: .1,
        scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: .5 }
      });
    });
  }

  /* ============================================================
     3. LO QUE ENTRA AL BAJAR
     ============================================================ */

  function entradas() {
    var piezas = todos("[data-entra]").filter(function (el) { return !el.closest(".portada"); });
    if (!piezas.length) return;
    var desde = calma ? { opacity: 0 } : { opacity: 0, y: suave ? 14 : 30 };
    var hasta = function (lote) {
      gsap.to(lote, {
        opacity: 1, y: 0, duration: calma ? .7 : 1, ease: "expo.out",
        stagger: lote.length > 6 ? .035 : .08, overwrite: true,
        onComplete: function () { gsap.set(lote, { clearProps: "transform" }); }
      });
    };
    if (!ST) return;

    // Lo que ya quedo arriba (se recargo la pagina a mitad de camino)
    // se muestra de una; lo que se ve, entra; lo de abajo espera.
    var alto = window.innerHeight || 800;
    var ya = [], abajo = [];
    piezas.forEach(function (el) {
      (el.getBoundingClientRect().top < alto * .92 ? ya : abajo).push(el);
    });
    gsap.set(abajo, desde);
    if (ya.length) { gsap.set(ya, desde); hasta(ya); }
    ST.batch(abajo, { start: "top 92%", once: true, onEnter: hasta });
  }

  /* ============================================================
     4. LOS EJEMPLOS
     Cada uno arma una linea de tiempo en pausa y la larga cuando
     se lo ve. El estado inicial lo pone el script, nunca el CSS.
     ============================================================ */

  function anotar(el, tl, inicio) {
    var s = { el: el, tl: tl };
    secuencias.push(s);
    if (!ST) { tl.progress(1); return; }
    var r = el.getBoundingClientRect();
    if (r.bottom < 0) { tl.progress(1); return; }       // ya quedo atras
    // Arriba de todo de una pagina de servicio se ve apenas se entra: arranca
    // sola cuando termina la entrada, sin esperar a que la persona baje.
    if (el.closest(".shero")) { gsap.delayedCall(1.1, function () { tl.play(); }); return; }
    ST.create({ trigger: el, start: inicio || "top 72%", once: true, onEnter: function () { tl.play(); } });
  }

  // --- 4a. El pedido que termina facturado ---
  function flujo(fig) {
    var msj = uno(".flujo-msj", fig);
    var lineas = todos(".flujo-linea", fig);
    var agente = uno(".flujo-agente", fig);
    var res = uno(".flujo-res", fig);
    var filas = todos(".flujo-res li", fig);

    fig.classList.add("preparado");
    filas.forEach(function (f) { f.classList.add("pendiente"); });
    gsap.set(msj, calma ? { opacity: 0 } : { opacity: 0, y: 24, scale: .97 });
    gsap.set(lineas, { "--p": 0 });
    gsap.set([agente, res], { opacity: .35 });

    var tl = gsap.timeline({ paused: true });
    tl.to(msj, { opacity: 1, y: 0, scale: 1, duration: .8, ease: "expo.out" })
      .to(lineas[0], { "--p": 1, duration: .6, ease: "power2.inOut" }, "+=.25")
      .to(agente, { opacity: 1, duration: .4 }, "-=.25")
      .call(function () { fig.classList.add("trabajando"); })
      .to(lineas[1], { "--p": 1, duration: .6, ease: "power2.inOut" }, "+=.6")
      .to(res, { opacity: 1, duration: .4 }, "-=.25");
    filas.forEach(function (f) {
      tl.call(function () { f.classList.remove("pendiente"); }, null, "+=.55");
    });
    tl.call(function () {
      fig.classList.remove("trabajando");
      fig.classList.add("listo");
    }, null, "+=.2");
    anotar(fig, tl);
  }

  // --- 4b. La charla de WhatsApp ---
  function chat(fig) {
    var burbujas = todos(".burbuja", fig);
    var escribe = uno(".escribiendo", fig);
    var linea = uno(".wa-linea", fig);
    var chips = todos(".chip", fig);
    var lista = escribe.parentNode;

    gsap.set(burbujas, calma ? { opacity: 0 } : { opacity: 0, y: 10, scale: .94 });
    gsap.set(chips, calma ? { opacity: 0 } : { opacity: 0, y: 18 });

    var tl = gsap.timeline({ paused: true });
    burbujas.forEach(function (b, i) {
      var sale = b.classList.contains("sale");
      if (sale) {
        tl.call(function () {
          lista.insertBefore(escribe, b);
          escribe.hidden = false;
          linea.textContent = "escribiendo\u2026";
        }, null, "+=.35")
          .fromTo(escribe, { opacity: 0 }, { opacity: 1, duration: .2 })
          .to({}, { duration: calma ? .7 : 1.15 })
          .call(function () {
            escribe.hidden = true;
            linea.textContent = "en l\u00ednea";
          });
      }
      tl.to(b, {
        opacity: 1, y: 0, scale: 1, duration: .5, ease: "expo.out",
        transformOrigin: sale ? "100% 100%" : "0% 100%"
      }, sale ? ">" : (i ? "+=.8" : ">"));
      if (chips[i]) tl.to(chips[i], { opacity: 1, y: 0, duration: .8, ease: "expo.out" }, "<.1");
    });
    // Al terminar, el "escribiendo" vuelve a su lugar (el ultimo).
    tl.call(function () { lista.appendChild(escribe); });
    anotar(fig, tl, "top 68%");
  }

  // --- 4c. La notebook y el celular ---
  function equipos(fig) {
    var tapa = uno(".nb-tapa", fig);
    var pantalla = uno(".nb-pantalla", fig);
    var sitio = uno(".nb-pantalla .sitio", fig);
    var celu = uno(".celu", fig);
    var chips = todos(".chip", fig);

    // Arriba de todo de una pagina (la de /paginas-web/) ya se ve al entrar: ahi
    // la tapa arranca abierta, porque cerrada deja un hueco vacio en la primera
    // pantalla, y la pagina de adentro empieza a recorrerse apenas se baja.
    var arribaDeTodo = !!fig.closest(".shero");
    if (!calma && ST) {
      if (!arribaDeTodo) {
        // La tapa se abre mientras se baja.
        gsap.fromTo(tapa, { rotationX: -82 }, {
          rotationX: 0, ease: "none",
          scrollTrigger: { trigger: fig, start: "top 95%", end: "top 30%", scrub: .6 }
        });
      }
      gsap.fromTo(celu, { y: 90, opacity: 0 }, {
        y: 0, opacity: 1, ease: "none",
        scrollTrigger: arribaDeTodo ?
          { trigger: fig, start: "top 90%", end: "top 45%", scrub: .6 } :
          { trigger: fig, start: "top 70%", end: "top 30%", scrub: .6 }
      });
      // Y la pagina de adentro se recorre sola.
      gsap.to(sitio, {
        y: function () { return -Math.max(0, sitio.offsetHeight - pantalla.clientHeight); },
        ease: "none",
        scrollTrigger: { trigger: fig, start: arribaDeTodo ? "top 60%" : "top 30%", end: "bottom 20%", scrub: .8, invalidateOnRefresh: true }
      });
    }

    gsap.set(chips, calma ? { opacity: 0 } : { opacity: 0, y: 16 });
    var tl = gsap.timeline({ paused: true });
    if (calma) {
      gsap.set([tapa, celu], { opacity: 0 });
      tl.to(tapa, { opacity: 1, duration: .8 }).to(celu, { opacity: 1, duration: .7 }, "-=.4");
    }
    tl.to(chips, { opacity: 1, y: 0, duration: .9, ease: "expo.out", stagger: .25 }, calma ? "-=.2" : .3);
    anotar(fig, tl, "top 55%");
  }

  // --- 4d. El panel ---
  function panel(fig) {
    var ventana = uno(".ventana", fig);
    var barras = todos(".barras i", fig);
    var filas = todos(".fila", fig);
    var numeros = todos("[data-contar]", fig);

    if (!calma && ST) {
      gsap.fromTo(ventana, { scale: .88, y: 50 }, {
        scale: 1, y: 0, ease: "none",
        scrollTrigger: { trigger: fig, start: "top 98%", end: "top 35%", scrub: .6 }
      });
    }

    gsap.set(barras, calma ? { opacity: 0 } : { scaleY: 0 });
    gsap.set(filas, calma ? { opacity: 0 } : { opacity: 0, x: -14 });
    numeros.forEach(function (n) { n.textContent = "0"; });

    var tl = gsap.timeline({ paused: true });
    tl.to(barras, calma ? { opacity: 1, duration: .5, stagger: .08 } : { scaleY: 1, duration: .9, ease: "expo.out", stagger: .07 });
    numeros.forEach(function (n) {
      var meta = parseInt(n.getAttribute("data-contar"), 10) || 0;
      var cuenta = { v: 0 };
      tl.to(cuenta, {
        v: meta, duration: 1.3, ease: "power2.out",
        onUpdate: function () { n.textContent = String(Math.round(cuenta.v)); }
      }, 0);
    });
    tl.to(filas, { opacity: 1, x: 0, duration: .6, ease: "expo.out", stagger: .12 }, .25);
    anotar(fig, tl, "top 62%");
  }

  // --- 4e. Los cuatro pasos ---
  function recorrido(sec) {
    var linea = uno(".recorrido-linea span", sec);
    var etapas = todos(".etapa", sec);
    if (!ST || !linea || !etapas.length) return;

    // En columna, la linea tiene que terminar en el centro del ultimo
    // numero, y eso depende de cuanto texto tienen los pasos.
    var via = linea.parentNode;
    var caja = uno(".recorrido-caja", sec);
    function medir() {
      var ult = etapas[etapas.length - 1];
      if (window.matchMedia("(max-width: 860px)").matches) {
        via.style.bottom = Math.max(0, caja.offsetHeight - ult.offsetTop - 28) + "px";
      } else {
        via.style.bottom = "";
      }
    }
    medir();
    ST.addEventListener("refreshInit", medir);

    etapas.forEach(function (e, i) { e.classList.toggle("activa", i === 0); });
    function prender(p) {
      etapas.forEach(function (e, i) {
        e.classList.toggle("activa", p >= i / (etapas.length - 1) - .02);
      });
    }
    gsap.fromTo(linea, { "--p": 0 }, {
      "--p": 1, ease: "none",
      scrollTrigger: {
        trigger: uno(".recorrido", sec), start: "top 72%", end: "bottom 60%", scrub: .4,
        onUpdate: function (self) { prender(self.progress); },
        onRefresh: function (self) { prender(self.progress); }
      }
    });
  }

  /* ============================================================
     5. LA BARRA DE ARRIBA
     ============================================================ */

  function barra() {
    var b = uno(".barra");
    if (!b) return;

    // En el celular el menu se desliza de costado: que la pagina en la que
    // estas no arranque cortada contra el borde.
    var menu = uno(".barra-menu", b);
    var activa = menu && uno('[aria-current="page"]', menu);
    if (activa && menu.scrollWidth > menu.clientWidth) {
      menu.scrollLeft = Math.max(0, activa.offsetLeft - (menu.clientWidth - activa.offsetWidth) / 2);
    }

    var pedido = false;
    function revisar() {
      pedido = false;
      b.classList.toggle("con-fondo", (window.scrollY || 0) > 8);
    }
    window.addEventListener("scroll", function () {
      if (pedido) return;
      pedido = true;
      requestAnimationFrame(revisar);
    }, { passive: true });
    revisar();
  }

  /* ============================================================
     6. LA RED DE SEGURIDAD
     Vale mas perder una animacion que perder texto. Rescata lo que
     ya deberia verse y quedo transparente, sin tocar lo que espera
     su turno mas abajo, y larga los ejemplos que se ven y no
     arrancaron. Vigila mientras la persona baja.
     ============================================================ */

  var VIGILADOS = "[data-intro], [data-entra], .hero-logo, .portada-escena .chip";

  function rescatar() {
    var alto = window.innerHeight || 0;
    todos(VIGILADOS).forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (!r.width || r.bottom <= 0 || r.top >= alto) return;
      var o = parseFloat(getComputedStyle(el).opacity);
      if (!isNaN(o) && o < .98 && !gsap.isTweening(el)) gsap.set(el, { opacity: 1, y: 0, scale: 1, clearProps: "filter" });
    });
    secuencias.forEach(function (s) {
      var r = s.el.getBoundingClientRect();
      if (r.bottom <= 0 || r.top >= alto * .8) return;
      if (s.tl.progress() === 0 && !s.tl.isActive()) s.tl.play();
    });
  }

  function vigilar() {
    var pendiente = false;
    window.addEventListener("scroll", function () {
      if (pendiente) return;
      pendiente = true;
      setTimeout(function () { pendiente = false; rescatar(); }, 700);
    }, { passive: true });
    setTimeout(rescatar, 4500);
    setTimeout(rescatar, 9000);
  }

  // Si algo explota, se muestra todo tal cual.
  function mostrarTodo() {
    raiz.classList.remove("vitrina-js");
    secuencias.forEach(function (s) { try { s.tl.progress(1); } catch (e) {} });
    try {
      if (ST) ST.getAll().forEach(function (t) { t.kill(); });
      gsap.set(todos(VIGILADOS + ", .palabra, .burbuja, .chip, .barras i, .fila, .nb-tapa, .celu, .ventana, .flujo-agente, .flujo-res, .flujo-msj"),
        { clearProps: "opacity,transform,filter" });
      gsap.set(todos(".flujo-linea, .recorrido-linea span"), { clearProps: "--p" });
    } catch (e) {}
    todos(".pendiente").forEach(function (f) { f.classList.remove("pendiente"); });
    todos(".flujo").forEach(function (f) { f.classList.add("listo"); f.classList.remove("trabajando"); });
    todos(".etapa").forEach(function (e) { e.classList.add("activa"); });
    var esc = uno(".escribiendo");
    if (esc) esc.hidden = true;
  }

  /* ============================================================
     7. EL ARRANQUE
     Cada parte por separado: si una falla, las otras siguen.
     ============================================================ */

  function probar(fn, arg) {
    try { fn(arg); } catch (e) {
      if (window.console) console.error("vitrina:", e);
      mostrarTodo();
    }
  }

  function iniciar() {
    probar(barra);
    probar(arriba);
    probar(manifiesto);
    probar(entradas);
    todos("[data-flujo]").forEach(function (f) { probar(flujo, f); });
    todos("[data-chat]").forEach(function (f) { probar(chat, f); });
    todos("[data-equipos]").forEach(function (f) { probar(equipos, f); });
    todos("[data-panel]").forEach(function (f) { probar(panel, f); });
    todos(".pasos-sec").forEach(function (s) { probar(recorrido, s); });
    vigilar();

    if (ST) {
      // Las fuentes y las imagenes cambian alturas: recalcular.
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
      window.addEventListener("load", function () { ST.refresh(); });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();

  // Al imprimir: todo en su estado final.
  window.addEventListener("beforeprint", mostrarTodo);
})();
