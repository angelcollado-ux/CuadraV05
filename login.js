//Si la sesion ya esta iniciada, ir directo al apgina principal
if (usuarioActual()) location.replace("index.html");

const formLogin    = document.getElementById("formLogin");
const formRegistro = document.getElementById("formRegistro");
const msgLogin     = document.getElementById("msgLogin");
const msgRegistro  = document.getElementById("msgRegistro");

function mostrarError(caja, texto) {
  caja.textContent = texto;
  caja.classList.remove("d-none");
}

function ocultarError(caja) {
  caja.textContent = "";
  caja.classList.add("d-none");
}

//Formulario de Inicio de Sesion
formLogin.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  ocultarError(msgLogin);

  const usuario = document.getElementById("loginUsuario").value;
  const clave   = document.getElementById("loginClave").value;

  if (usuario.trim() === "" || clave === "") {
    mostrarError(msgLogin, "Escribe tu usuario y tu contraseña.");
    return;
  }

  const resultado = await iniciarSesion(usuario, clave);
  if (resultado.ok) {
    location.href = "index.html";
  } else {
    mostrarError(msgLogin, resultado.mensaje);
  }
});

//Formulario de Registro de Cuenta
formRegistro.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  ocultarError(msgRegistro);

  const usuario = document.getElementById("regUsuario").value;
  const clave   = document.getElementById("regClave").value;
  const clave2  = document.getElementById("regClave2").value;

  if (clave !== clave2) {
    mostrarError(msgRegistro, "Las contraseñas no coinciden.");
    return;
  }

  const resultado = await registrarUsuario(usuario, clave);
  if (resultado.ok) {
    location.href = "index.html";
  } else {
    mostrarError(msgRegistro, resultado.mensaje);
  }
});
