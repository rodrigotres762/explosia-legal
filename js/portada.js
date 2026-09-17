/* ============================================================
   LA PORTADA INTERACTIVA
   1. El reproductor de ejemplos (las "historias" animadas).
   2. El interruptor Hoy / Con un agente.
   3. Al imprimir, se abren los desplegables.

   Todo es un agregado. Sin este archivo la pagina se lee entera:
   el reproductor muestra el primer ejemplo ya armado y cada
   tarjeta de "lo que cambia" muestra como es hoy.

   El reloj de los ejemplos va con setTimeout y no con cuadros de
   animacion a proposito: con el panel del navegador oculto o la
   pestana de fondo, requestAnimationFrame no corre y el
   reproductor parecia colgado sin estarlo.
   ============================================================ */

(function () {
  "use strict";

  var menosMovimiento = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function todos(raiz, sel) { return [].slice.call(raiz.querySelectorAll(sel)); }

  /* ============================================================
     1. EL REPRODUCTOR
     Cada escena tiene una duracion (data-dur) y piezas que se
     prenden a su tiempo (data-t, en milisegundos). Los subtitulos
     siguen la misma regla. data-paneles dice que mitad se ve en
     el celular a partir de cada momento.
     ============================================================ */

  function iniciarDemo(raiz) {
    var escenas  = todos(raiz, ".escena");
    var subs     = todos(raiz, ".subs");
    var caps     = todos(raiz, "[data-cap]");
    var segs     = todos(raiz, "[data-seg]");
    var boton    = raiz.querySelector(".demo-play");
    var grande   = raiz.querySelector(".demo-grande");
    var pantalla = raiz.querySelector(".demo-escenas");
    if (!escenas.length || !pantalla) return;

    function leerPasos(cont) {
      return todos(cont, "[data-t]").map(function (el) {
        return { el: el, t: parseInt(el.getAttribute("data-t"), 10) || 0 };
      });
    }
    var pasos = escenas.map(leerPasos);
    var lineas = escenas.map(function (e, i) {
      var s = subs[i];
      return s ? leerPasos(s) : [];
    });
    var paneles = escenas.map(function (esc) {
      return (esc.getAttribute("data-paneles") || "").split(",").filter(Boolean).map(function (p) {
        var par = p.split(":");
        return { t: parseInt(par[0], 10) || 0, panel: par[1] };
      });
    });
    var duraciones = escenas.map(function (esc) {
      return parseInt(esc.getAttribute("data-dur"), 10) || 10000;
    });

    var actual = 0;
    var transcurrido = 0;
    var ultimo = 0;
    var reloj = null;
    var corriendo = false;
    var arranco = false;          // false = todavia es el cartel de presentacion
    var pausoLaPersona = false;   // si la persona pauso, no se reanuda solo
    var pausaPorOculto = false;
    var enVista = false;

    function pintar() {
      var t = transcurrido;

      pasos[actual].forEach(function (p) { p.el.classList.toggle("on", t >= p.t); });

      var ultima = null;
      lineas[actual].forEach(function (p) {
        p.el.classList.remove("actual");
        if (t >= p.t) ultima = p.el;
      });
      if (ultima) ultima.classList.add("actual");

      var panel = "a";
      paneles[actual].forEach(function (p) { if (t >= p.t) panel = p.panel; });
      if (escenas[actual].getAttribute("data-panel") !== panel) {
        escenas[actual].setAttribute("data-panel", panel);
      }

      var avance = Math.min(1, t / duraciones[actual]) * 100;
      segs.forEach(function (s, i) {
        var b = s.querySelector("b");
        if (b) b.style.width = (i < actual ? 100 : i > actual ? 0 : avance) + "%";
      });
      caps.forEach(function (c, i) {
        var b = c.querySelector(".cap-barra");
        if (b) b.style.width = (i === actual ? avance : 0) + "%";
      });
    }

    function mostrar(n) {
      actual = (n + escenas.length) % escenas.length;
      transcurrido = 0;
      escenas.forEach(function (e, i) {
        var esta = i === actual;
        e.classList.toggle("activa", esta);
        if (!esta) {
          // la que se va vuelve a cero, para que la proxima vez empiece de nuevo
          pasos[i].forEach(function (p) { p.el.classList.remove("on"); });
          e.setAttribute("data-panel", "a");
        }
      });
      subs.forEach(function (s, i) { s.classList.toggle("activa", i === actual); });
      caps.forEach(function (c, i) {
        c.setAttribute("aria-selected", i === actual ? "true" : "false");
        c.tabIndex = i === actual ? 0 : -1;
      });
      pintar();
    }

    function tic() {
      reloj = null;
      if (!corriendo) return;
      var ahora = Date.now();
      // si el navegador se durmio un rato, no se saltea media escena
      transcurrido += Math.min(ahora - ultimo, 250);
      ultimo = ahora;
      if (transcurrido >= duraciones[actual]) mostrar(actual + 1);
      else pintar();
      reloj = setTimeout(tic, 70);
    }

    function quitarCartel() {
      if (arranco) return;
      arranco = true;
      raiz.classList.remove("poster");
      mostrar(actual);
    }

    function reproducir() {
      quitarCartel();
      if (corriendo) return;
      corriendo = true;
      ultimo = Date.now();
      raiz.classList.remove("pausado");
      if (boton) boton.setAttribute("aria-label", "Pausar los ejemplos");
      if (!reloj) reloj = setTimeout(tic, 70);
    }

    function pausar() {
      corriendo = false;
      raiz.classList.add("pausado");
      if (boton) boton.setAttribute("aria-label", "Reproducir los ejemplos");
      if (reloj) { clearTimeout(reloj); reloj = null; }
    }

    function elegir(n) {
      pausoLaPersona = false;
      quitarCartel();
      mostrar(n);
      reproducir();
    }

    // El cartel: la primera escena ya armada, con un play grande.
    mostrar(0);
    transcurrido = duraciones[0];
    pintar();
    raiz.classList.add("listo");

    caps.forEach(function (c, i) {
      c.addEventListener("click", function () { elegir(i); });
      c.addEventListener("keydown", function (e) {
        var k = e.key;
        var d = (k === "ArrowRight" || k === "ArrowDown") ? 1 : (k === "ArrowLeft" || k === "ArrowUp") ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var n = (i + d + caps.length) % caps.length;
        caps[n].focus();
        elegir(n);
      });
    });
    segs.forEach(function (s, i) {
      s.addEventListener("click", function () { elegir(i); });
    });

    function alternar() {
      if (corriendo) { pausar(); pausoLaPersona = true; }
      else { pausoLaPersona = false; reproducir(); }
    }
    if (boton) boton.addEventListener("click", alternar);
    if (grande) grande.addEventListener("click", function () { pausoLaPersona = false; reproducir(); });
    pantalla.addEventListener("click", alternar);

    // Arranca solo cuando se ve, y se frena cuando no (otra pestana
    // del sitio, o la persona bajo): no gasta bateria de gusto.
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
          enVista = e.isIntersecting && e.intersectionRatio >= 0.35;
          if (enVista && !pausoLaPersona) reproducir();
          else if (!enVista && corriendo) pausar();
        });
      }, { threshold: [0, 0.35, 0.7] }).observe(pantalla);
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden && corriendo) { pausar(); pausaPorOculto = true; }
      else if (!document.hidden && pausaPorOculto) {
        pausaPorOculto = false;
        if (enVista && !pausoLaPersona) reproducir();
      }
    });

    // "Mira como funciona" de la portada: baja hasta el reproductor y lo arranca.
    todos(document, "[data-ver-demo]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var destino = document.getElementById("demo") || raiz;
        destino.scrollIntoView({ behavior: menosMovimiento ? "auto" : "smooth", block: "start" });
        pausoLaPersona = false;
        if (!arranco) mostrar(0);
        reproducir();
      });
    });
  }

  /* ============================================================
     2. HOY / CON UN AGENTE
     El interruptor da vuelta todas las tarjetas; tocar una sola
     la da vuelta a ella. La pastilla de color se ubica midiendo
     el boton elegido, asi funciona con cualquier largo de texto.
     ============================================================ */

  function iniciarCambios(lista) {
    var interruptor = document.querySelector("[data-interruptor]");
    var botones = interruptor ? todos(interruptor, "[data-modo]") : [];
    var tarjetas = todos(lista, ".cambio");

    function moverPastilla() {
      if (!interruptor) return;
      var activo = interruptor.querySelector('[aria-pressed="true"]');
      if (!activo) return;
      interruptor.style.setProperty("--x", activo.offsetLeft + "px");
      interruptor.style.setProperty("--w", activo.offsetWidth + "px");
    }

    function marcarInterruptor(modo) {
      if (!interruptor) return;
      interruptor.setAttribute("data-modo", modo);
      botones.forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-modo") === modo ? "true" : "false");
      });
      moverPastilla();
    }

    function ponerTarjeta(t, modo, retraso) {
      t.setAttribute("data-estado", modo);
      t.style.setProperty("--retraso", (retraso || 0) + "ms");
      var b = t.querySelector(".cambio-btn");
      if (b) b.setAttribute("aria-pressed", modo === "agente" ? "true" : "false");
    }

    botones.forEach(function (b) {
      b.addEventListener("click", function () {
        var modo = b.getAttribute("data-modo");
        marcarInterruptor(modo);
        tarjetas.forEach(function (t, i) { ponerTarjeta(t, modo, menosMovimiento ? 0 : i * 70); });
      });
    });

    tarjetas.forEach(function (t) {
      var b = t.querySelector(".cambio-btn");
      if (!b) return;
      b.addEventListener("click", function () {
        ponerTarjeta(t, t.getAttribute("data-estado") === "agente" ? "hoy" : "agente", 0);
        // si todas quedaron iguales, el interruptor acompana
        var estados = tarjetas.map(function (x) { return x.getAttribute("data-estado"); });
        if (estados.every(function (e) { return e === estados[0]; })) marcarInterruptor(estados[0]);
      });
    });

    if (interruptor) {
      interruptor.classList.add("listo");
      moverPastilla();
      window.addEventListener("resize", moverPastilla, { passive: true });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(moverPastilla);
      // la pestana de la portada puede estar cerrada al cargar: medir al volver
      if (window.Pestanas && window.Pestanas.alCambiar) {
        // el aviso de cambio de vista lo usa visual.js; aca solo se re-mide
        document.addEventListener("click", function (e) {
          if (e.target && e.target.closest && e.target.closest("[data-vista], [data-ir]")) {
            setTimeout(moverPastilla, 50);
          }
        });
      }
    }
  }

  /* ============================================================
     3. AL IMPRIMIR
     Un desplegable cerrado no se imprime: se abren todos y al
     terminar vuelven como estaban.
     ============================================================ */

  var abiertosParaImprimir = [];
  window.addEventListener("beforeprint", function () {
    abiertosParaImprimir = todos(document, "details:not([open])");
    abiertosParaImprimir.forEach(function (d) { d.open = true; });
  });
  window.addEventListener("afterprint", function () {
    abiertosParaImprimir.forEach(function (d) { d.open = false; });
    abiertosParaImprimir = [];
  });

  function arrancar() {
    var demo = document.querySelector("[data-demo]");
    if (demo) iniciarDemo(demo);
    var cambios = document.querySelector("[data-cambios]");
    if (cambios) iniciarCambios(cambios);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arrancar);
  else arrancar();
})();
