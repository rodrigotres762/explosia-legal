/* ============================================================
   LA ESCENA
   Un campo de particulas que empieza desordenado y se acomoda
   solo en el anillo del logo. Es el mensaje del sitio hecho
   imagen: lo desprolijo se ordena solo.

   Todo lo de este archivo es decoracion. Si no carga, si el
   telefono no da o si la persona pidio menos movimiento, la
   pagina se ve igual con el fondo de siempre.
   ============================================================ */

import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  BufferGeometry,
  BufferAttribute,
  Points,
  ShaderMaterial,
  AdditiveBlending,
  Color,
  Vector3,
  Matrix4
} from "three";

/* ---------- La forma ordenada: el atomo del logo ----------
   Un anillo principal y tres orbitas cruzadas. No es una
   figura decorativa cualquiera: es la marca. */

function puntoEnAnillo(radio, grosor, salida) {
  var a = Math.random() * Math.PI * 2;
  var r = radio + (Math.random() - 0.5) * grosor;
  salida.set(Math.cos(a) * r, Math.sin(a) * r, (Math.random() - 0.5) * grosor * 0.7);
  return salida;
}

function puntoEnOrbita(radioMayor, radioMenor, giroZ, inclinacionX, grosor, salida) {
  var a = Math.random() * Math.PI * 2;
  var x = Math.cos(a) * radioMayor + (Math.random() - 0.5) * grosor;
  var y = Math.sin(a) * radioMenor + (Math.random() - 0.5) * grosor;
  var z = (Math.random() - 0.5) * grosor;

  // inclinacion sobre X
  var cx = Math.cos(inclinacionX), sx = Math.sin(inclinacionX);
  var y2 = y * cx - z * sx;
  var z2 = y * sx + z * cx;

  // giro sobre Z
  var cz = Math.cos(giroZ), sz = Math.sin(giroZ);
  salida.set(x * cz - y2 * sz, x * sz + y2 * cz, z2);
  return salida;
}

function construirGeometria(cantidad, radio) {
  var destino = new Float32Array(cantidad * 3);
  var caos = new Float32Array(cantidad * 3);
  var semilla = new Float32Array(cantidad);
  var tono = new Float32Array(cantidad);

  var v = new Vector3();
  // Tres orbitas, ninguna igual a la otra: la simetria perfecta
  // se lee como un dibujo mecanico, no como algo vivo.
  var orbitas = [
    { mayor: radio * 1.30, menor: radio * 0.34, giro: 0.28, incl: 1.02 },
    { mayor: radio * 1.21, menor: radio * 0.46, giro: 2.31, incl: 1.34 },
    { mayor: radio * 1.36, menor: radio * 0.28, giro: 4.71, incl: 0.86 }
  ];

  for (var i = 0; i < cantidad; i++) {
    var i3 = i * 3;
    var sorteo = Math.random();

    if (sorteo < 0.52) {
      // el anillo principal, el mas denso y brillante
      puntoEnAnillo(radio, radio * 0.085, v);
      tono[i] = 0.62 + Math.random() * 0.38;
    } else if (sorteo < 0.94) {
      // las tres orbitas
      var o = orbitas[(Math.random() * orbitas.length) | 0];
      puntoEnOrbita(o.mayor, o.menor, o.giro, o.incl, radio * 0.055, v);
      tono[i] = 0.22 + Math.random() * 0.5;
    } else {
      // un poco de polvo suelto alrededor, para que no quede recortado
      var a = Math.random() * Math.PI * 2;
      var b = Math.acos(2 * Math.random() - 1);
      var r = radio * (1.28 + Math.random() * 0.85);
      v.set(
        Math.sin(b) * Math.cos(a) * r,
        Math.sin(b) * Math.sin(a) * r * 0.7,
        Math.cos(b) * r * 0.6
      );
      tono[i] = Math.random() * 0.3;
    }

    destino[i3] = v.x;
    destino[i3 + 1] = v.y;
    destino[i3 + 2] = v.z;

    // el caos del que vienen: una nube ancha y desordenada
    var ca = Math.random() * Math.PI * 2;
    var cb = Math.acos(2 * Math.random() - 1);
    var cr = radio * (1.15 + Math.pow(Math.random(), 0.6) * 1.95);
    caos[i3] = Math.sin(cb) * Math.cos(ca) * cr;
    caos[i3 + 1] = Math.sin(cb) * Math.sin(ca) * cr * 0.8;
    caos[i3 + 2] = Math.cos(cb) * cr;

    semilla[i] = Math.random();
  }

  var geo = new BufferGeometry();
  // "position" tiene que existir para que three calcule el frustum;
  // usamos el destino y desactivamos el descarte por camara mas abajo.
  geo.setAttribute("position", new BufferAttribute(destino, 3));
  geo.setAttribute("aDestino", new BufferAttribute(destino, 3));
  geo.setAttribute("aCaos", new BufferAttribute(caos, 3));
  geo.setAttribute("aSemilla", new BufferAttribute(semilla, 1));
  geo.setAttribute("aTono", new BufferAttribute(tono, 1));
  return geo;
}

/* ---------- Los shaders ---------- */

var VERTEX = [
  "attribute vec3 aCaos;",
  "attribute vec3 aDestino;",
  "attribute float aSemilla;",
  "attribute float aTono;",
  "uniform float uTiempo;",
  "uniform float uOrden;",
  "uniform float uTamano;",
  "uniform float uPixelRatio;",
  "uniform float uFuerzaPuntero;",
  "uniform vec3 uPuntero;",
  "varying float vTono;",
  "varying float vBrillo;",
  "void main() {",
  // cada particula llega en su momento: el orden no aparece de golpe
  "  float retraso = aSemilla * 0.4;",
  "  float t = clamp((uOrden - retraso) / max(1.0 - retraso, 0.0001), 0.0, 1.0);",
  "  t = t * t * (3.0 - 2.0 * t);",
  "  vec3 pos = mix(aCaos, aDestino, t);",
  // deriva permanente: aun ordenado, nunca queda del todo quieto
  "  float f = 0.5 + aSemilla * 0.7;",
  "  float amplitud = 0.055 + (1.0 - t) * 0.42;",
  "  pos.x += sin(uTiempo * f + aSemilla * 6.283) * amplitud;",
  "  pos.y += cos(uTiempo * f * 0.85 + aSemilla * 4.113) * amplitud;",
  "  pos.z += sin(uTiempo * f * 0.65 + aSemilla * 2.717) * amplitud;",
  // el puntero aparta las particulas a su paso
  "  vec3 haciaAfuera = pos - uPuntero;",
  "  float dist2 = dot(haciaAfuera, haciaAfuera);",
  "  float empuje = uFuerzaPuntero * exp(-dist2 * 0.10);",
  "  pos += normalize(haciaAfuera + vec3(0.0001)) * empuje;",
  "  vec4 mv = modelViewMatrix * vec4(pos, 1.0);",
  "  gl_Position = projectionMatrix * mv;",
  "  float tam = uTamano * (0.5 + aSemilla * 0.9);",
  "  gl_PointSize = tam * uPixelRatio * (14.0 / max(-mv.z, 0.1));",
  "  vTono = aTono;",
  "  vBrillo = 0.55 + t * 0.62 + empuje * 0.85;",
  "}"
].join("\n");

var FRAGMENT = [
  "precision mediump float;",
  "uniform vec3 uFrio;",
  "uniform vec3 uMedio;",
  "uniform vec3 uCaliente;",
  "uniform float uOpacidad;",
  "varying float vTono;",
  "varying float vBrillo;",
  "void main() {",
  "  vec2 c = gl_PointCoord - vec2(0.5);",
  "  float d = dot(c, c);",
  "  if (d > 0.25) discard;",
  "  float alfa = smoothstep(0.25, 0.0, d);",
  "  alfa = pow(alfa, 1.7);",
  "  vec3 col = mix(uFrio, uMedio, smoothstep(0.0, 0.55, vTono));",
  "  col = mix(col, uCaliente, smoothstep(0.55, 1.0, vTono));",
  "  gl_FragColor = vec4(col * vBrillo, alfa * uOpacidad);",
  "}"
].join("\n");

/* ---------- El armado ---------- */

export function iniciar(opciones) {
  opciones = opciones || {};
  var lienzo = opciones.lienzo || document.getElementById("escena");
  if (!lienzo) return null;

  var liviano = !!opciones.liviano;
  var cantidad = opciones.cantidad || (liviano ? 5200 : 17000);
  var radio = 4.1;

  var renderizador;
  try {
    renderizador = new WebGLRenderer({
      canvas: lienzo,
      alpha: true,
      antialias: false,
      powerPreference: liviano ? "default" : "high-performance",
      failIfMajorPerformanceCaveat: false
    });
  } catch (e) {
    return null;
  }

  var topeDpr = liviano ? 1.5 : 1.75;
  var dpr = Math.min(window.devicePixelRatio || 1, topeDpr);
  renderizador.setPixelRatio(dpr);
  renderizador.setClearAlpha(0);

  var escena = new Scene();
  var camara = new PerspectiveCamera(46, 1, 0.1, 120);
  camara.position.set(0, 0, 15.5);

  var geometria = construirGeometria(cantidad, radio);

  var uniforms = {
    uTiempo: { value: 0 },
    uOrden: { value: 0 },
    uTamano: { value: liviano ? 2.5 : 2.1 },
    uPixelRatio: { value: dpr },
    uFuerzaPuntero: { value: 0 },
    uPuntero: { value: new Vector3(0, 0, 0) },
    uOpacidad: { value: 0 },
    uFrio: { value: new Color(0x1b57a8) },
    uMedio: { value: new Color(0x3d9be0) },
    uCaliente: { value: new Color(0x7fd4f5) }
  };

  var material = new ShaderMaterial({
    uniforms: uniforms,
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: AdditiveBlending
  });

  var nube = new Points(geometria, material);
  nube.frustumCulled = false;
  escena.add(nube);

  /* ---------- medidas ---------- */

  var ancho = 0, alto = 0;

  function medir() {
    ancho = window.innerWidth;
    alto = window.innerHeight;
    camara.aspect = ancho / Math.max(alto, 1);

    // en pantallas angostas el anillo tiene que entrar igual
    var base = 15.5;
    if (camara.aspect < 1) base = 15.5 / Math.max(camara.aspect * 1.05, 0.42);
    camara.position.z = Math.min(base, 34);

    camara.updateProjectionMatrix();
    renderizador.setSize(ancho, alto, false);
  }

  medir();

  var temporizadorMedida = null;
  function alRedimensionar() {
    clearTimeout(temporizadorMedida);
    temporizadorMedida = setTimeout(medir, 120);
  }
  window.addEventListener("resize", alRedimensionar);
  window.addEventListener("orientationchange", alRedimensionar);

  /* ---------- el puntero ---------- */

  var punteroDestino = new Vector3(0, 0, 0);
  var punteroMundo = new Vector3(0, 0, 0);
  var inversaNube = new Matrix4();
  var fuerzaDestino = 0;
  var hayPuntero = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function alMover(e) {
    var nx = (e.clientX / ancho) * 2 - 1;
    var ny = -((e.clientY / alto) * 2 - 1);
    var mitadAlto = Math.tan((camara.fov * Math.PI) / 360) * camara.position.z;
    var mitadAncho = mitadAlto * camara.aspect;
    punteroDestino.set(nx * mitadAncho, ny * mitadAlto, 0);
    fuerzaDestino = 1.5;
  }

  function alSalir() {
    fuerzaDestino = 0;
  }

  if (hayPuntero && !liviano) {
    window.addEventListener("pointermove", alMover, { passive: true });
    window.addEventListener("pointerleave", alSalir);
    document.addEventListener("mouseleave", alSalir);
  }

  /* ---------- el giro lento ---------- */

  var giroDestinoY = 0;
  var giroDestinoX = 0;

  if (hayPuntero && !liviano) {
    window.addEventListener("pointermove", function (e) {
      giroDestinoY = ((e.clientX / ancho) * 2 - 1) * 0.22;
      giroDestinoX = ((e.clientY / alto) * 2 - 1) * 0.14;
    }, { passive: true });
  }

  /* ---------- el ciclo ---------- */

  var corriendo = true;
  var pedido = null;
  var ultimo = performance.now();
  var tiempo = 0;
  var opacidadDestino = 0;
  var pasoMinimo = liviano ? 1000 / 32 : 0;
  var acumulado = 0;

  function actualizar(delta) {
    tiempo += delta;
    uniforms.uTiempo.value = tiempo;

    // todo lo que se mueve, se mueve siguiendo a su destino sin saltos
    uniforms.uOpacidad.value += (opacidadDestino - uniforms.uOpacidad.value) * Math.min(delta * 2.2, 1);
    uniforms.uFuerzaPuntero.value += (fuerzaDestino - uniforms.uFuerzaPuntero.value) * Math.min(delta * 3.5, 1);
    punteroMundo.lerp(punteroDestino, Math.min(delta * 4.5, 1));

    nube.rotation.z += delta * 0.045;
    nube.rotation.y += (giroDestinoY - nube.rotation.y) * Math.min(delta * 2.2, 1);
    nube.rotation.x += (giroDestinoX - nube.rotation.x) * Math.min(delta * 2.2, 1);

    var e = nube.scale.x + (escalaDestino - nube.scale.x) * Math.min(delta * 2.6, 1);
    nube.scale.set(e, e, e);

    nube.position.x += (destinoX - nube.position.x) * Math.min(delta * 3.0, 1);
    nube.position.y += (destinoY - nube.position.y) * Math.min(delta * 3.0, 1);

    // el anillo se mueve y gira: hay que llevar el puntero al espacio
    // del objeto, si no el empuje apunta a cualquier lado
    nube.updateMatrixWorld();
    inversaNube.copy(nube.matrixWorld).invert();
    uniforms.uPuntero.value.copy(punteroMundo).applyMatrix4(inversaNube);

    renderizador.render(escena, camara);
  }

  function cuadro(ahora) {
    pedido = requestAnimationFrame(cuadro);
    var delta = Math.min((ahora - ultimo) / 1000, 0.05);
    ultimo = ahora;

    if (pasoMinimo > 0) {
      acumulado += delta * 1000;
      if (acumulado < pasoMinimo) return;
      acumulado = 0;
    }

    actualizar(delta);
  }

  function arrancar() {
    if (pedido !== null || !corriendo) return;
    ultimo = performance.now();
    pedido = requestAnimationFrame(cuadro);
  }

  function frenar() {
    if (pedido !== null) {
      cancelAnimationFrame(pedido);
      pedido = null;
    }
  }

  // con la pestana de fondo no gastamos ni bateria ni GPU
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) frenar();
    else arrancar();
  });

  // si el navegador se queda sin contexto no dejamos la pagina rota
  lienzo.addEventListener("webglcontextlost", function (e) {
    e.preventDefault();
    corriendo = false;
    frenar();
  });

  arrancar();

  /* ---------- donde se planta el anillo ----------
     Le pasamos el centro de un elemento de la pagina en
     coordenadas de pantalla y el anillo se acomoda ahi.
     Asi el 3D queda alineado con el diseno en cualquier
     tamano de pantalla, sin numeros magicos. */

  var destinoX = 0, destinoY = 0;
  var escalaDestino = 1;
  var primeraEscala = true;

  // El diseno manda: le decimos que diametro en pixeles tiene que
  // ocupar el anillo y la escena se acomoda a eso, en cualquier
  // pantalla. Sin numeros magicos atados a un monitor.
  function escalarA(diametroPx) {
    var mitadAlto = Math.tan((camara.fov * Math.PI) / 360) * camara.position.z;
    var mundoPorPixel = (mitadAlto * 2) / Math.max(alto, 1);
    escalaDestino = Math.max(((diametroPx / 2) * mundoPorPixel) / radio, 0.05);
    // la primera vez no se anima: nace ya del tamano correcto
    if (primeraEscala) {
      primeraEscala = false;
      nube.scale.set(escalaDestino, escalaDestino, escalaDestino);
    }
  }

  function ubicarEnPantalla(px, py) {
    var ndcX = (px / ancho) * 2 - 1;
    var ndcY = -((py / alto) * 2 - 1);
    var mitadAlto = Math.tan((camara.fov * Math.PI) / 360) * camara.position.z;
    var mitadAncho = mitadAlto * camara.aspect;
    destinoX = ndcX * mitadAncho;
    destinoY = ndcY * mitadAlto;
  }

  return {
    // 0 = caos, 1 = ordenado
    orden: function (valor) {
      uniforms.uOrden.value = valor;
    },
    ubicar: ubicarEnPantalla,
    escalar: escalarA,
    // Un cuadro a pedido, sin depender del ciclo del navegador.
    // Sirve para dejar una imagen fija cuando no hay animacion.
    pintar: function (delta) { actualizar(typeof delta === "number" ? delta : 0.016); },
    remedir: medir,
    opacidad: function (valor) {
      opacidadDestino = valor;
    },
    opacidadActual: function () {
      return uniforms.uOpacidad.value;
    },
    uniforms: uniforms,
    destruir: function () {
      corriendo = false;
      frenar();
      window.removeEventListener("resize", alRedimensionar);
      window.removeEventListener("orientationchange", alRedimensionar);
      geometria.dispose();
      material.dispose();
      renderizador.dispose();
    }
  };
}
