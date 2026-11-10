//Cargar datos
const usuario = usuarioActual();
const datos   = cargarDatos();    

let gastos = datos.gastos;        
let cuotas = datos.cuotas;        

const listaGastos   = document.getElementById("listaGastos");
const listaCuotas   = document.getElementById("listaCuotas");
const sueldoFijo    = document.getElementById("sueldoFijo");
const sueldoExtra   = document.getElementById("sueldoExtra");
const totalIngresos = document.getElementById("totalIngresos");
const totalGastos   = document.getElementById("totalGastos");
const totalLibre    = document.getElementById("totalLibre");
const tarjetaLibre  = document.getElementById("tarjetaLibre");
const etiquetaLibre = document.getElementById("etiquetaLibre");
const aviso         = document.getElementById("aviso");
const nombreUsuario = document.getElementById("nombreUsuario");
const mesActual     = document.getElementById("mesActual");
const btnSalir      = document.getElementById("btnSalir");

//Gastos
const modalGastoEl = document.getElementById("modalGasto");
const modalGasto   = new bootstrap.Modal(modalGastoEl);
const formGasto    = document.getElementById("formGasto");
const gastoNombre  = document.getElementById("gastoNombre");
const gastoMonto   = document.getElementById("gastoMonto");

//Cuotas
const modalCuotaEl = document.getElementById("modalCuota");
const modalCuota   = new bootstrap.Modal(modalCuotaEl);
const formCuota    = document.getElementById("formCuota");
const cuotaNombre  = document.getElementById("cuotaNombre");
const cuotaMonto   = document.getElementById("cuotaMonto");
const cuotaActual  = document.getElementById("cuotaActual");
const cuotaTotal   = document.getElementById("cuotaTotal");

function aNumero(texto) {
  return parseInt(String(texto).replace(/\D/g, ""), 10) || 0;
}

function aPesos(numero) {
  return "$ " + numero.toLocaleString("es-CL");
}

function formatearInput(input) {
  const n = aNumero(input.value);
  input.value = n ? n.toLocaleString("es-CL") : "";
}

function crearBotonBorrar(nombre, alHacerClic) {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "btn-borrar";
  boton.setAttribute("aria-label", "Eliminar " + nombre);
  boton.innerHTML = '<i class="bi bi-x-lg"></i>';
  boton.addEventListener("click", alHacerClic);
  return boton;
}

function mostrarGastos() {
  listaGastos.innerHTML = "";

  if (gastos.length === 0) {
    const vacio = document.createElement("li");
    vacio.className = "vacio";
    vacio.textContent = "Aún no tienes gastos fijos.";
    listaGastos.appendChild(vacio);
    return;
  }

  gastos.forEach((gasto, indice) => {
    const li = document.createElement("li");

    const nombre = document.createElement("span");
    nombre.className = "nombre";
    nombre.textContent = gasto.nombre;

    const monto = document.createElement("span");
    monto.textContent = aPesos(gasto.monto);

    li.append(nombre, monto, crearBotonBorrar(gasto.nombre, () => eliminarGasto(indice)));
    listaGastos.appendChild(li);
  });
}

function mostrarCuotas() {
  listaCuotas.innerHTML = "";

  if (cuotas.length === 0) {
    const vacio = document.createElement("p");
    vacio.className = "vacio mb-0";
    vacio.textContent = "Aún no tienes compras en cuotas.";
    listaCuotas.appendChild(vacio);
    return;
  }

  cuotas.forEach((cuota, indice) => {
    const faltan = cuota.total - cuota.actual;

    const claseBadge = cuota.actual / cuota.total >= 0.75 ? "badge-verde" : "badge-naranja";

    let textoFaltan;
    if (faltan === 0)      textoFaltan = "Última cuota";
    else if (faltan === 1) textoFaltan = "Falta 1";
    else                   textoFaltan = "Faltan " + faltan;

    const fila = document.createElement("div");
    fila.className = "fila-cuota";

    const nombre = document.createElement("span");
    nombre.className = "fw-medium";
    nombre.textContent = cuota.nombre;

    const detalle = document.createElement("div");
    detalle.className = "d-flex align-items-center gap-2 flex-wrap justify-content-end";

    const monto = document.createElement("span");
    monto.className = "text-secondary small";
    monto.textContent = aPesos(cuota.monto) + " por mes";

    const badge = document.createElement("span");
    badge.className = "badge " + claseBadge;
    badge.textContent = "Cuota " + cuota.actual + " de " + cuota.total;

    const resto = document.createElement("span");
    resto.className = "small";
    resto.textContent = textoFaltan;

    detalle.append(monto, badge, resto, crearBotonBorrar(cuota.nombre, () => eliminarCuota(indice)));
    fila.append(nombre, detalle);
    listaCuotas.appendChild(fila);
  });
}

function calcularTotales() {
  const ingresos    = aNumero(sueldoFijo.value) + aNumero(sueldoExtra.value);
  const sumaGastos  = gastos.reduce((suma, g) => suma + g.monto, 0);
  const sumaCuotas  = cuotas.reduce((suma, c) => suma + c.monto, 0);
  const gastosTotal = sumaGastos + sumaCuotas;
  const libre       = ingresos - gastosTotal;

  totalIngresos.textContent = aPesos(ingresos);
  totalGastos.textContent   = aPesos(gastosTotal);

  const noAlcanza = libre < 0;
  totalLibre.textContent    = noAlcanza ? "- " + aPesos(Math.abs(libre)) : aPesos(libre);
  etiquetaLibre.textContent = noAlcanza ? "Te faltan" : "Te queda libre";
  tarjetaLibre.classList.toggle("total-libre", !noAlcanza);   // verde
  tarjetaLibre.classList.toggle("total-falta", noAlcanza);    // rojo

  mostrarAviso(ingresos, libre);
}

function mostrarAviso(ingresos, libre) {
  aviso.classList.remove("aviso-peligro", "aviso-alerta", "aviso-info");

  if (ingresos === 0) {
    aviso.classList.add("aviso-info");
    aviso.textContent = "Ingresa tu sueldo para ver cuánto te queda este mes.";
  } else if (libre < 0) {
    aviso.classList.add("aviso-peligro");
    aviso.textContent = "Tu sueldo no te alcanza: tus gastos y cuotas superan tus ingresos por " +
      aPesos(Math.abs(libre)) + ". Revisa tus gastos o tus compras en cuotas.";
  } else if (libre < ingresos * 0.1) {
    aviso.classList.add("aviso-alerta");
    aviso.textContent = "Cuidado: solo te quedan " + aPesos(libre) +
      " (menos del 10% de tus ingresos). Un imprevisto podría dejarte sin fondos.";
  } else {
    aviso.textContent = "";
    aviso.classList.add("d-none");
    return;
  }
  aviso.classList.remove("d-none");
}

function guardar() {
  guardarDatos({
    sueldoFijo:  aNumero(sueldoFijo.value),
    sueldoExtra: aNumero(sueldoExtra.value),
    gastos,
    cuotas,
  });
}

function actualizarTodo() {
  mostrarGastos();
  mostrarCuotas();
  calcularTotales();
  guardar();
}

function eliminarGasto(indice) {
  gastos.splice(indice, 1);
  actualizarTodo();
}

function eliminarCuota(indice) {
  cuotas.splice(indice, 1);
  actualizarTodo();
}

//Formulario de Gasto
formGasto.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const nombre = gastoNombre.value.trim();
  const monto  = aNumero(gastoMonto.value);

  gastoNombre.classList.toggle("is-invalid", nombre === "");
  gastoMonto.classList.toggle("is-invalid", monto <= 0);
  if (nombre === "" || monto <= 0) return;

  gastos.push({ nombre, monto });
  actualizarTodo();
  modalGasto.hide();
});

//Modal Gastos
modalGastoEl.addEventListener("show.bs.modal", () => {
  formGasto.reset();
  gastoNombre.classList.remove("is-invalid");
  gastoMonto.classList.remove("is-invalid");
});
modalGastoEl.addEventListener("shown.bs.modal", () => gastoNombre.focus());

//Formulario de Cuota
formCuota.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const nombre = cuotaNombre.value.trim();
  const monto  = aNumero(cuotaMonto.value);
  const actual = aNumero(cuotaActual.value);
  const total  = aNumero(cuotaTotal.value);

  const totalOk  = total >= 1 && total <= 72;
  const actualOk = actual >= 1 && actual <= total;

  cuotaNombre.classList.toggle("is-invalid", nombre === "");
  cuotaMonto.classList.toggle("is-invalid", monto <= 0);
  cuotaTotal.classList.toggle("is-invalid", !totalOk);
  cuotaActual.classList.toggle("is-invalid", !actualOk);
  if (nombre === "" || monto <= 0 || !totalOk || !actualOk) return;

  cuotas.push({ nombre, monto, actual, total });
  actualizarTodo();
  modalCuota.hide();
});

//Modal Cuota
modalCuotaEl.addEventListener("show.bs.modal", () => {
  formCuota.reset();
  [cuotaNombre, cuotaMonto, cuotaActual, cuotaTotal].forEach(c => c.classList.remove("is-invalid"));
});
modalCuotaEl.addEventListener("shown.bs.modal", () => cuotaNombre.focus());

//Eventos de Gasto y Cuota
gastoMonto.addEventListener("input", () => formatearInput(gastoMonto));
cuotaMonto.addEventListener("input", () => formatearInput(cuotaMonto));

//Al cambiar el sueldo, recalcular todo
sueldoFijo.addEventListener("input",  () => { formatearInput(sueldoFijo);  calcularTotales(); guardar(); });
sueldoExtra.addEventListener("input", () => { formatearInput(sueldoExtra); calcularTotales(); guardar(); });

//Inicio
nombreUsuario.textContent = usuario;

const mes = new Date().toLocaleDateString("es-CL", { month: "long" });
mesActual.textContent = mes.charAt(0).toUpperCase() + mes.slice(1);

sueldoFijo.value  = datos.sueldoFijo  ? datos.sueldoFijo.toLocaleString("es-CL")  : "";
sueldoExtra.value = datos.sueldoExtra ? datos.sueldoExtra.toLocaleString("es-CL") : "";

btnSalir.addEventListener("click", cerrarSesion);
actualizarTodo();
