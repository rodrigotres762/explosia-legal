/* ============================================================
   3. EL DIAGNOSTICO
   Arma el mensaje de WhatsApp con lo que la persona marco. No
   manda nada a ningun lado: el mensaje sale desde su telefono.
   Sin JavaScript el boton igual funciona, con un mensaje general.
   ============================================================ */
(function () {
  var form = document.getElementById("diag");
  if (!form) return;

  var cuenta    = document.getElementById("diag-cuenta");
  var cuentaTxt = document.getElementById("diag-cuenta-txt");
  var vacio     = document.getElementById("diag-vacio");
  var lista     = document.getElementById("diag-lista");
  var equipoTxt = document.getElementById("diag-equipo");
  var cta       = document.getElementById("diag-cta");
  var aviso     = document.getElementById("diag-copiado");
  var quieto    = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NUMERO    = "5491130270119";
  var items     = {};   // valor de la tarea -> su renglon en la lista
  var mensaje   = "";   // el ultimo mensaje armado
  var hayAlgo   = false;

  // Todos los demas botones de WhatsApp de la pagina. Una vez que la
  // persona marco algo, toque el que toque tiene que llevar su
  // diagnostico: mientras marca, lo que tiene a la vista es el boton
  // flotante de abajo a la derecha (el del diagnostico queda mas abajo),
  // y el "Escribinos" de arriba se ve siempre. Cada uno mandaba su
  // propio mensaje y el diagnostico se perdia.
  var enlaces = [].slice.call(document.querySelectorAll('a[href*="wa.me/' + NUMERO + '"]'))
    .filter(function (a) { return a !== cta; });
  enlaces.forEach(function (a) {
    a.setAttribute("data-href-original", a.getAttribute("href"));
    if (a.hasAttribute("aria-label")) a.setAttribute("data-aria-original", a.getAttribute("aria-label"));
  });
  var flotante = document.querySelector(".wa-flotante");
  var barraTxt = flotante ? flotante.querySelector(".wa-flotante-txt") : null;
  var barraOriginal = barraTxt ? barraTxt.textContent : "";

  function etiqueta(input) {
    return input.nextElementSibling ? input.nextElementSibling.textContent.trim() : input.value;
  }

  function renglon(input) {
    var li = document.createElement("li");
    var b = document.createElement("b");
    var s = document.createElement("span");
    b.textContent = etiqueta(input);
    s.textContent = input.getAttribute("data-hace") || "";
    li.appendChild(b);
    li.appendChild(s);
    return li;
  }

  function actualizar(animar) {
    var equipo = form.querySelector('input[name="equipo"]:checked');
    var tareas = [].slice.call(form.querySelectorAll('input[name="tarea"]:checked'));
    var n = tareas.length;

    if (cuenta.textContent !== String(n)) {
      cuenta.textContent = n;
      if (animar && !quieto && cuenta.animate) {
        cuenta.animate(
          [{ transform: "scale(1.28)" }, { transform: "scale(1)" }],
          { duration: 380, easing: "cubic-bezier(.34,1.56,.64,1)" }
        );
      }
    }
    cuentaTxt.textContent = n === 0 ? "tareas marcadas"
                          : n === 1 ? "tarea que se puede automatizar"
                          : "tareas que se pueden automatizar";
    vacio.hidden = n > 0;

    // Se sacan las desmarcadas y se agregan las nuevas en su lugar,
    // sin mover las que ya estaban: asi no se reanima toda la lista.
    var elegidas = {};
    tareas.forEach(function (t) { elegidas[t.value] = true; });
    Object.keys(items).forEach(function (v) {
      if (!elegidas[v]) { lista.removeChild(items[v]); delete items[v]; }
    });
    tareas.forEach(function (t, i) {
      if (items[t.value]) return;
      var ref = null;
      for (var j = i + 1; j < tareas.length; j++) {
        if (items[tareas[j].value]) { ref = items[tareas[j].value]; break; }
      }
      items[t.value] = lista.insertBefore(renglon(t), ref);
    });

    if (equipo) {
      equipoTxt.textContent = equipo.getAttribute("data-texto") || "";
      equipoTxt.hidden = false;
    } else {
      equipoTxt.hidden = true;
    }

    var lineas = ["Hola! Hice el diagn\u00f3stico en la web de ExplosIA."];
    if (equipo) lineas.push("Equipo: " + equipo.getAttribute("data-msg") + ".");
    if (n) {
      lineas.push("Lo que m\u00e1s se repite:");
      tareas.forEach(function (t) { lineas.push("\u2022 " + etiqueta(t)); });
    }
    lineas.push("Quiero ver qu\u00e9 se puede automatizar.");
    mensaje = lineas.join("\n");
    var enlace = "https://wa.me/" + NUMERO + "?text=" + encodeURIComponent(mensaje);
    cta.href = enlace;

    hayAlgo = !!equipo || n > 0;
    enlaces.forEach(function (a) {
      a.setAttribute("href", hayAlgo ? enlace : a.getAttribute("data-href-original"));
      if (a.hasAttribute("data-aria-original")) {
        a.setAttribute("aria-label", hayAlgo ? "Enviar mi diagn\u00f3stico por WhatsApp"
                                             : a.getAttribute("data-aria-original"));
      }
    });
    if (barraTxt) barraTxt.textContent = hayAlgo ? "Enviar mi diagn\u00f3stico" : barraOriginal;
    // con algo marcado, el boton flotante lo anuncia con su cartel
    // solo un rato: fijo tapaba el resultado del diagnostico en pantallas chicas
    if (flotante) {
      clearTimeout(flotante.__cartel);
      flotante.classList.toggle("con-texto", hayAlgo && !!animar);
      if (hayAlgo && animar) {
        flotante.__cartel = setTimeout(function () { flotante.classList.remove("con-texto"); }, 4500);
      }
    }
  }

  // WhatsApp no siempre respeta el texto que le llega en el link: segun
  // como este la app (recien abierta, con un borrador en ese chat, o con
  // WhatsApp Web abierto en otra pestana) puede abrir el chat vacio. Eso
  // pasa del lado de WhatsApp y desde aca no se puede evitar, asi que
  // ademas se copia el mensaje: si el chat llega vacio, se pega.
  function copiarViejo(texto) {
    try {
      var t = document.createElement("textarea");
      t.value = texto;
      t.setAttribute("readonly", "");
      t.style.cssText = "position:fixed;top:0;left:-9999px;opacity:0";
      document.body.appendChild(t);
      t.select();
      t.setSelectionRange(0, texto.length);
      var ok = document.execCommand("copy");
      document.body.removeChild(t);
      return ok;
    } catch (e) {
      return false;
    }
  }

  function avisar() {
    aviso.textContent = "Por las dudas tambi\u00e9n te lo copiamos: si el chat de WhatsApp aparece vac\u00edo, pegalo ah\u00ed.";
    aviso.hidden = false;
  }

  function copiar(texto) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(avisar, function () {
        if (copiarViejo(texto)) avisar();
      });
    } else if (copiarViejo(texto)) {
      avisar();
    }
  }

  // En captura: corre antes de que el navegador salga para WhatsApp.
  document.addEventListener("click", function (e) {
    if (!hayAlgo || !aviso) return;
    var a = e.target && e.target.closest ? e.target.closest('a[href*="wa.me/' + NUMERO + '"]') : null;
    if (a) copiar(mensaje);
  }, true);

  form.addEventListener("submit", function (e) { e.preventDefault(); });
  form.addEventListener("change", function () {
    if (aviso) aviso.hidden = true;   // lo copiado ya no es lo marcado
    actualizar(true);
  });
  // por si el navegador recordo lo marcado al volver atras
  window.addEventListener("pageshow", function () { actualizar(false); });
  actualizar(false);
})();
