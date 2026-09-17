/* ============================================================
   LA CAPA VISUAL
   Decide quien recibe el 3D, lo carga solo si corresponde, lo
   mantiene alineado con el diseno y maneja las apariciones al
   bajar.

   Regla que manda sobre todo lo demas: esto es decoracion. Si
   algo de aca se rompe, la pagina tiene que seguir leyendose
   entera. Por eso casi todo esta envuelto en guardas y hay una
   red de seguridad al final.
   ============================================================ */

(function () {
  var raiz = document.documentElement;
  var menosMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============================================================
     1. QUIEN RECIBE EL 3D
     El archivo del 3D pesa. En un telefono flojo no solo se ve
     mal: se ve lento, calienta el aparato y gasta bateria. Asi
     que en esos casos ni siquiera se pide el archivo.
     ============================================================ */

  var forzado = /[?&]3d=si/.test(location.search);

  // Devuelve null si se puede, o el motivo por el que no. Guardar el
  // motivo importa: sin el, "no se ve el 3D" es un misterio que se
  // diagnostica a ciegas. Queda en window.__porQueNoHay3D.
  function motivoSinTresD() {
    if (forzado) return null;

    var con = navigator.connection;
    if (con) {
      if (con.saveData) return "ahorro de datos activado";
      if (/(^|-)2g$/.test(con.effectiveType || "")) return "conexion 2G";
    }
    if (typeof navigator.deviceMemory === "number" && navigator.deviceMemory < 3) {
      return "poca memoria (" + navigator.deviceMemory + " GB)";
    }
    if (typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency < 4) {
      return "pocos nucleos (" + navigator.hardwareConcurrency + ")";
    }

    try {
      var prueba = document.createElement("canvas");
      var gl = prueba.getContext("webgl2") || prueba.getContext("webgl");
      if (!gl) return "el navegador no soporta graficos 3D";
      var perder = gl.getExtension("WEBGL_lose_context");
      if (perder) perder.loseContext();
    } catch (e) {
      return "fallo al probar los graficos 3D: " + e.message;
    }
    return null;
  }

  function puedeCon3D() {
    var motivo = motivoSinTresD();
    window.__porQueNoHay3D = motivo;
    return motivo === null;
  }

  // Version liviana: menos particulas, menos resolucion, sin puntero.
  var liviano = !window.matchMedia("(hover: hover) and (pointer: fine)").matches ||
                window.innerWidth < 760;

  /* ============================================================
     2. EL 3D
     ============================================================ */

  var api = null;
  var visual = null;   // el hueco de la portada donde vive el anillo

  // Menos movimiento pedido en el sistema. Si lo pidio a proposito con
  // ?3d=si, se mueve igual.
  // - En el celular: quieto. Hay 3D pero sin una sola animacion, y solo
  //   se redibuja si algo cambio. Ahi lo suele activar el ahorro de
  //   bateria, y repintar 30 veces por segundo es gastarle bateria justo
  //   a quien quiere ahorrarla.
  // - En la computadora: suave. Windows lo activa con solo apagar los
  //   "Efectos de animacion", y un anillo congelado se leia como un
  //   sitio roto. Gira lento y respira, sin puntero ni inercia.
  var reducido = menosMovimiento && !forzado;
  var quieto = reducido && liviano;
  var suave = reducido && !liviano;

  function centroDe(el) {
    if (!el) return null;
    var r = el.getBoundingClientRect();
    if (!r.width && !r.height) return null;   // esta en una vista cerrada
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function medidaDelAnillo() {
    // El anillo abraza al logo: su diametro sale del tamano real
    // del logo en pantalla, asi que acompana a cualquier medida.
    var logo = document.querySelector(".hero-visual .hero-logo");
    var refAncho = logo ? logo.getBoundingClientRect().width : 0;
    if (!refAncho) refAncho = Math.min(window.innerWidth * 0.22, 210);
    return refAncho * 2.15;
  }

  function reubicar() {
    if (!api) return;
    api.escalar(medidaDelAnillo());
    var c = centroDe(visual);
    if (c) {
      // El rectangulo se mueve solo al hacer scroll, y el anillo lo
      // sigue con retraso: de ahi sale la sensacion de inercia, sin
      // secuestrarle el scroll a nadie.
      api.ubicar(c.x, c.y);
    } else {
      // Vista sin portada: el anillo se corre y se apaga para no
      // pelearse con el texto.
      api.ubicar(window.innerWidth * 0.78, window.innerHeight * 0.34);
    }
  }

  function opacidadSegunScroll() {
    if (!api) return;
    var c = centroDe(visual);
    // Vista sin portada: sobre fondo claro las particulas se leen como
    // ruido encima del texto, asi que ahi el anillo se apaga del todo.
    if (!c) { api.opacidad(0); return; }
    var alto = window.innerHeight || 1;
    // 1 arriba de todo, se va apagando al dejar atras la portada
    if (quieto) { api.opacidad(1); return; }
    var f = Math.max(0, Math.min(1, 1 - (window.scrollY || 0) / (alto * 0.85)));
    api.opacidad(0.28 + f * 0.72);
  }

  var pidiendo = false;
  function alScroll() {
    if (pidiendo) return;
    pidiendo = true;
    requestAnimationFrame(function () {
      pidiendo = false;
      reubicar();
      opacidadSegunScroll();
    });
  }

  function arrancarEscena() {
    if (!window.EscenaExplosIA || !window.EscenaExplosIA.iniciar) return;

    try {
      api = window.EscenaExplosIA.iniciar({ liviano: liviano, estatico: quieto, suave: suave, claro: true });
    } catch (e) {
      api = null;
    }
    if (!api) return;

    visual = document.querySelector(".hero-visual");
    raiz.classList.add("con-3d");

    // Con ?3d=si queda una manija para revisar la escena desde la
    // consola del navegador. En una visita normal no existe.
    if (forzado) window.__escena = api;

    reubicar();
    opacidadSegunScroll();

    // El orden no aparece de golpe: las particulas se acomodan
    // solas mientras la persona esta mirando. Es el mensaje.
    // Salvo con menos movimiento, donde aparece ya armado.
    if (quieto || suave) {
      api.orden(1);
      if (quieto) api.opacidad(1);
    } else if (window.gsap) {
      var estado = { v: 0 };
      window.gsap.to(estado, {
        v: 1,
        duration: 3.1,
        ease: "power2.inOut",
        delay: 0.25,
        onUpdate: function () { api.orden(estado.v); }
      });
    } else {
      api.orden(1);
    }

    window.addEventListener("scroll", alScroll, { passive: true });
    window.addEventListener("resize", alScroll, { passive: true });
    window.addEventListener("orientationchange", alScroll, { passive: true });
  }

  // La version sale de la etiqueta de este mismo archivo, asi
  // alcanza con tocarla en un solo lugar del index para que
  // nadie quede con una copia vieja despues de publicar.
  var version = (function () {
    var mio = (document.currentScript && document.currentScript.src) || "";
    var m = /[?&]v=([^&]+)/.exec(mio);
    return m ? m[1] : "";
  })();

  function cargarEscena() {
    var s = document.createElement("script");
    s.src = "vendor/escena.min.js" + (version ? "?v=" + version : "");
    s.async = true;
    s.onload = arrancarEscena;
    s.onerror = function () { /* sin 3D y sin drama */ };
    document.head.appendChild(s);
  }

  /* ============================================================
     3. LAS APARICIONES AL BAJAR
     Reemplaza al aviso que traia el sitio, que animaba la vista
     entera de una: asi cada bloque entra cuando de verdad lo
     estas por ver.
     ============================================================ */

  var PIEZAS = ".head, .sec-head, .fig, .senses > *, .rubros > *, .mapa > *, .flujo > *, " +
               ".dos-frentes > *, .pasos > *, .qa, .chat-grid > *, .col, .siguiente, " +
               ".diag, .recursos > *, .demo, .cambios > *, .explora > *, .pista";

  var disparadores = [];

  function limpiarDisparadores() {
    disparadores.forEach(function (d) { try { d.kill(); } catch (e) {} });
    disparadores = [];
  }

  function revelar(vista) {
    if (!window.gsap || (menosMovimiento && !forzado)) return;
    var gsap = window.gsap;
    var hayST = typeof window.ScrollTrigger !== "undefined";

    limpiarDisparadores();

    var piezas = [].slice.call(vista.querySelectorAll(PIEZAS));
    if (!piezas.length) return;

    gsap.killTweensOf(piezas);
    gsap.set(piezas, { clearProps: "opacity,transform" });

    var alto = window.innerHeight || 800;
    var arriba = [];
    var abajo = [];

    piezas.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < alto * 0.92) arriba.push(el);
      else abajo.push(el);
    });

    // lo que ya se ve entra de una, escalonado
    if (arriba.length) {
      gsap.from(arriba, {
        opacity: 0, y: 22, duration: .62, ease: "expo.out",
        stagger: { each: .055, amount: Math.min(arriba.length * .055, .5) },
        onComplete: function () { gsap.set(arriba, { clearProps: "opacity,transform" }); }
      });
    }

    // lo de mas abajo espera a que lo mires
    if (hayST && abajo.length) {
      abajo.forEach(function (el) {
        var tw = gsap.from(el, {
          opacity: 0, y: 26, duration: .7, ease: "expo.out",
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            once: true
          },
          onComplete: function () { gsap.set(el, { clearProps: "opacity,transform" }); }
        });
        if (tw.scrollTrigger) disparadores.push(tw.scrollTrigger);
      });
    } else if (abajo.length) {
      gsap.set(abajo, { clearProps: "opacity,transform" });
    }

    if (hayST) window.ScrollTrigger.refresh();
  }

  /* ============================================================
     4. LA RED DE SEGURIDAD
     ============================================================ */

  function repararVisibles() {
    if (!window.gsap) return;
    var alto = window.innerHeight || 0;
    var sel = ".vista.activa " + PIEZAS.split(", ").join(", .vista.activa ");
    [].slice.call(document.querySelectorAll(sel)).forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top >= alto || r.bottom <= 0) return;      // todavia no le toca
      var o = parseFloat(getComputedStyle(el).opacity);
      if (!isNaN(o) && o < .98 && !window.gsap.isTweening(el)) {
        window.gsap.set(el, { clearProps: "opacity,transform" });
      }
    });
  }

  function vigilar() {
    var pendiente = false;
    function revisar() {
      if (pendiente) return;
      pendiente = true;
      setTimeout(function () { pendiente = false; repararVisibles(); }, 600);
    }
    window.addEventListener("scroll", revisar, { passive: true });
    setTimeout(repararVisibles, 4500);
    setTimeout(repararVisibles, 9000);
  }

  /* ============================================================
     5. EL ARRANQUE
     ============================================================ */

  function iniciar() {
    // Las pestanas las maneja el guion que ya estaba. Le pisamos
    // el aviso de cambio de vista para poner el nuestro: guarda
    // un solo aviso, asi que este reemplaza al anterior.
    if (window.Pestanas && window.Pestanas.alCambiar) {
      window.Pestanas.alCambiar(function (vista) {
        revelar(vista);
        // la portada solo existe en la primera vista
        setTimeout(function () { alScroll(); }, 60);
      });

      var activa = document.querySelector(".vista.activa") || document.querySelector(".vista");
      if (activa) revelar(activa);
    }

    if (puedeCon3D()) cargarEscena();

    /* Red de seguridad. Vale mas perder una animacion que perder
       texto. Repara lo que ya deberia verse y esta transparente,
       sin tocar lo que espera su turno mas abajo. Vigila mientras
       la persona baja, no una sola vez. */
    vigilar();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }

  /* Al imprimir: nada a medio animar y sin 3D. */
  window.addEventListener("beforeprint", function () {
    limpiarDisparadores();
    if (window.gsap) {
      window.gsap.set(PIEZAS, { clearProps: "opacity,transform" });
    }
  });
})();
