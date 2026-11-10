const PREFIJO      = "cts_";
const CLAVE_SESION = PREFIJO + "sesion";

function leerStorage(clave) {
  try {
    const texto = localStorage.getItem(clave);
    return texto ? JSON.parse(texto) : null;
  } catch (error) {
    return null;
  }
}

function escribirStorage(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
    return true;
  } catch (error) {
    return false;
  }
}

//Generacion de sal (dato aleatorio) y Hasheo de la clave
function generarSal() {
  const bytes = new Uint8Array(8);
  if (window.crypto && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function hashClave(clave, sal) {
  const texto = sal + ":" + clave;

  if (window.crypto && crypto.subtle) {
    const bytes  = new TextEncoder().encode(texto);
    const buffer = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  //Respaldo simple por si el navegador no tiene crypto.subtle
  let h = 5381;
  for (let i = 0; i < texto.length; i++) h = ((h << 5) + h + texto.charCodeAt(i)) | 0;
  return "x" + (h >>> 0).toString(16);
}

function normalizarUsuario(usuario) {
  return String(usuario).trim().toLowerCase();
}

async function registrarUsuario(usuario, clave) {
  const nombre = normalizarUsuario(usuario);

  if (!/^[a-z0-9._-]{3,20}$/.test(nombre)) {
    return { ok: false, mensaje: "El usuario debe tener entre 3 y 20 caracteres: letras, números, punto, guion o guion bajo." };
  }
  if (clave.length < 6) {
    return { ok: false, mensaje: "La contraseña debe tener al menos 6 caracteres." };
  }
  if (leerStorage(PREFIJO + "user_" + nombre)) {
    return { ok: false, mensaje: "Ese usuario ya existe. Elige otro o inicia sesión." };
  }

  const sal  = generarSal();
  const hash = await hashClave(clave, sal);

  if (!escribirStorage(PREFIJO + "user_" + nombre, { sal, hash })) {
    return { ok: false, mensaje: "No se pudo guardar la cuenta. Revisa que tu navegador permita guardar datos." };
  }

  escribirStorage(CLAVE_SESION, nombre);   // queda con la sesión iniciada
  return { ok: true };
}

async function iniciarSesion(usuario, clave) {
  const nombre  = normalizarUsuario(usuario);
  const cuenta  = leerStorage(PREFIJO + "user_" + nombre);
  const errorGenerico = { ok: false, mensaje: "Usuario o contraseña incorrectos." };

  if (!cuenta) return errorGenerico;

  const hash = await hashClave(clave, cuenta.sal);
  if (hash !== cuenta.hash) return errorGenerico;

  escribirStorage(CLAVE_SESION, nombre);
  return { ok: true };
}

function usuarioActual() {
  return leerStorage(CLAVE_SESION);
}

function cerrarSesion() {
  try { localStorage.removeItem(CLAVE_SESION); } catch (error) {}
  location.href = "login.html";
}

function cargarDatos() {
  const usuario = usuarioActual();
  const vacio = { sueldoFijo: 0, sueldoExtra: 0, gastos: [], cuotas: [] };
  if (!usuario) return vacio;

  const guardado = leerStorage(PREFIJO + "datos_" + usuario);
  if (!guardado) return vacio;

  return {
    sueldoFijo:  Number(guardado.sueldoFijo)  || 0,
    sueldoExtra: Number(guardado.sueldoExtra) || 0,
    gastos: Array.isArray(guardado.gastos) ? guardado.gastos : [],
    cuotas: Array.isArray(guardado.cuotas) ? guardado.cuotas : [],
  };
}

function guardarDatos(datos) {
  const usuario = usuarioActual();
  if (!usuario) return false;
  return escribirStorage(PREFIJO + "datos_" + usuario, datos);
}
