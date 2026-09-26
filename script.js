// ==========================================
// 🌌 NUESTRA GALAXIA
// ==========================================


// ==========================================
// SUPABASE
// ==========================================

const SUPABASE_URL =
    "https://agioxyqgonhntmgyxgxr.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_i6gwm4z2Ig0IX29oWWhWXw_npzXPJg9";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ==========================================
// CONFIGURACIÓN
// ==========================================

const MAX_FOTOS = 50;
const BUCKET = "fotos";
const TABLA = "recuerdos";


// ==========================================
// ELEMENTOS
// ==========================================

const entrarBtn =
    document.getElementById("entrarBtn");

const subirBtn =
    document.getElementById("subirBtn");

const fotoInput =
    document.getElementById("fotoInput");

const galeria =
    document.getElementById("galeria");

const galeriaFotos =
    document.getElementById("galeriaFotos");

const contador =
    document.getElementById("contador");


// ==========================================
// ENTRAR
// ==========================================

if (entrarBtn) {

    entrarBtn.addEventListener(
        "click",
        function () {

            if (galeria) {

                galeria.scrollIntoView({
                    behavior: "smooth"
                });

            }

        }
    );

}


// ==========================================
// BOTÓN SUBIR FOTO
// ==========================================

if (subirBtn && fotoInput) {

    subirBtn.addEventListener(
        "click",
        function () {

            fotoInput.click();

        }
    );

}


// ==========================================
// SELECCIONAR FOTOS
// ==========================================

if (fotoInput) {

    fotoInput.addEventListener(
        "change",
        async function (event) {

            const archivos =
                Array.from(
                    event.target.files
                );

            if (archivos.length === 0) {
                return;
            }

            await procesarFotos(
                archivos
            );

            // Limpiar el input
            fotoInput.value = "";

        }
    );

}


// ==========================================
// PROCESAR FOTOS
// ==========================================

async function procesarFotos(archivos) {

    try {

        mostrarMensaje(
            "🌸 Preparando fotos..."
        );


        // ==========================================
        // CONSULTAR CUÁNTAS FOTOS EXISTEN
        // ==========================================

        const { data, error } =
            await supabaseClient
                .from(TABLA)
                .select("id");


        if (error) {

            console.error(
                "Error consultando fotos:",
                error
            );

            mostrarMensaje(
                "❌ No se pudieron consultar las fotos."
            );

            return;
        }


        const cantidadActual =
            data.length;


        // ==========================================
        // COMPROBAR LÍMITE
        // ==========================================

        if (
            cantidadActual >=
            MAX_FOTOS
        ) {

            mostrarMensaje(
                "✨ Ya alcanzaron el máximo de 50 fotos."
            );

            return;
        }


        const espacioDisponible =
            MAX_FOTOS -
            cantidadActual;


        const fotosParaSubir =
            archivos.slice(
                0,
                espacioDisponible
            );


        let cantidadSubida = 0;


        // ==========================================
        // SUBIR UNA POR UNA
        // ==========================================

        for (
            const archivo
            of fotosParaSubir
        ) {


            // ==========================================
            // PEDIR MENSAJE
            // ==========================================

            const mensaje =
                prompt(
                    "🌸 Escribe un mensaje para este recuerdo:"
                );


            // ==========================================
            // SI CANCELA
            // ==========================================

            if (
                mensaje === null
            ) {

                mostrarMensaje(
                    "✨ Subida cancelada."
                );

                continue;
            }


            // ==========================================
            // SI DEJA VACÍO
            // ==========================================

            const mensajeFinal =
                mensaje.trim() !== ""
                    ? mensaje.trim()
                    : "Un recuerdo de nuestra galaxia ✨";


            // ==========================================
            // SUBIR FOTO
            // ==========================================

            const resultado =
                await subirFoto(
                    archivo,
                    mensajeFinal
                );


            if (resultado) {

                cantidadSubida++;

            }

        }


        // ==========================================
        // ACTUALIZAR GALERÍA
        // ==========================================

        await cargarFotos();


        if (
            cantidadSubida > 0
        ) {

            mostrarMensaje(
                `✨ ${cantidadSubida} foto(s) agregada(s).`
            );

        }


    } catch (error) {

        console.error(
            "Error procesando fotos:",
            error
        );

        mostrarMensaje(
            "❌ Ocurrió un error al procesar las fotos."
        );

    }

}


// ==========================================
// SUBIR UNA FOTO
// ==========================================

async function subirFoto(
    archivo,
    mensaje
) {

    try {


        // ==========================================
        // COMPROBAR QUE SEA IMAGEN
        // ==========================================

        if (
            !archivo.type.startsWith(
                "image/"
            )
        ) {

            mostrarMensaje(
                `❌ ${archivo.name} no es una imagen.`
            );

            return false;
        }


        // ==========================================
        // EXTENSIÓN
        // ==========================================

        const extension =
            archivo.name
                .split(".")
                .pop()
                .toLowerCase();


        // ==========================================
        // NOMBRE BASE
        // ==========================================

        const nombreBase =
            archivo.name
                .replace(
                    /\.[^/.]+$/,
                    ""
                )
                .replace(
                    /[^a-zA-Z0-9-_]/g,
                    "_"
                );


        // ==========================================
        // NOMBRE ÚNICO
        // ==========================================

        const nombreUnico =
            Date.now() +
            "_" +
            Math.random()
                .toString(36)
                .substring(2, 9) +
            "_" +
            nombreBase +
            "." +
            extension;


        // ==========================================
        // RUTA
        // ==========================================

        const ruta =
            "recuerdos/" +
            nombreUnico;


        mostrarMensaje(
            "📤 Subiendo recuerdo..."
        );


        // ==========================================
        // STORAGE
        // ==========================================

        const {
            error: uploadError
        } =
            await supabaseClient
                .storage
                .from(BUCKET)
                .upload(
                    ruta,
                    archivo,
                    {
                        cacheControl:
                            "3600",

                        upsert:
                            false
                    }
                );


        if (
            uploadError
        ) {

            console.error(
                "Error Storage:",
                uploadError
            );

            mostrarMensaje(
                "❌ Error al subir la imagen."
            );

            return false;
        }


        // ==========================================
        // GUARDAR EN BASE DE DATOS
        // ==========================================

        const {
            error: databaseError
        } =
            await supabaseClient
                .from(TABLA)
                .insert({

                    nombre_foto:
                        archivo.name,

                    ruta_foto:
                        ruta,

                    // AQUÍ SE GUARDA EL MENSAJE
                    descripcion:
                        mensaje,

                    subido_por:
                        "Amiga"

                });


        // ==========================================
        // SI FALLA LA BASE DE DATOS
        // ==========================================

        if (
            databaseError
        ) {

            console.error(
                "Error Base de Datos:",
                databaseError
            );


            // Borrar la imagen
            // si no pudo guardarse
            // el registro

            await supabaseClient
                .storage
                .from(BUCKET)
                .remove([
                    ruta
                ]);


            mostrarMensaje(
                "❌ No se pudo guardar el recuerdo."
            );

            return false;
        }


        console.log(
            "✅ Recuerdo guardado correctamente"
        );


        return true;


    } catch (error) {

        console.error(
            "Error inesperado:",
            error
        );

        mostrarMensaje(
            "❌ Ocurrió un error inesperado."
        );

        return false;

    }

}


// ==========================================
// CARGAR FOTOS
// ==========================================

async function cargarFotos() {

    try {


        const {
            data,
            error
        } =
            await supabaseClient
                .from(TABLA)
                .select("*")
                .order(
                    "fecha_subida",
                    {
                        ascending:
                            true
                    }
                );


        // ==========================================
        // ERROR
        // ==========================================

        if (error) {

            console.error(
                "Error cargando fotos:",
                error
            );

            mostrarMensaje(
                "❌ No se pudieron cargar las fotos."
            );

            return;
        }


        // ==========================================
        // CONTADOR
        // ==========================================

        actualizarContador(
            data.length
        );


        // ==========================================
        // LIMPIAR GALERÍA
        // ==========================================

        if (galeriaFotos) {

            galeriaFotos.innerHTML =
                "";

        }


        // ==========================================
        // GALERÍA VACÍA
        // ==========================================

        if (
            data.length === 0
        ) {

            mostrarGaleriaVacia();

            return;
        }


        // ==========================================
        // CREAR TARJETAS
        // ==========================================

        data.forEach(
            function (
                foto,
                index
            ) {

                crearTarjetaFoto(
                    foto,
                    index + 1
                );

            }
        );


    } catch (error) {

        console.error(
            "Error cargando galería:",
            error
        );

    }

}


// ==========================================
// CREAR TARJETA DE FOTO
// ==========================================

function crearTarjetaFoto(
    foto,
    numero
) {

    if (!galeriaFotos) {
        return;
    }


    // ==========================================
    // OBTENER URL PÚBLICA
    // ==========================================

    const { data } =
        supabaseClient
            .storage
            .from(BUCKET)
            .getPublicUrl(
                foto.ruta_foto
            );


    const url =
        data.publicUrl;


    // ==========================================
    // TARJETA
    // ==========================================

    const tarjeta =
        document.createElement(
            "div"
        );

    tarjeta.className =
        "foto-card";


    // ==========================================
    // IMAGEN
    // ==========================================

    const imagen =
        document.createElement(
            "img"
        );


    imagen.src =
        url;


    imagen.alt =
        foto.descripcion ||
        "Recuerdo de nuestra galaxia";


    imagen.loading =
        "lazy";


    // ==========================================
    // NÚMERO
    // ==========================================

    const numeroFoto =
        document.createElement(
            "span"
        );


    numeroFoto.className =
        "numero-foto";


    numeroFoto.textContent =
        "#" +
        numero;


    // ==========================================
    // INFORMACIÓN
    // ==========================================

    const info =
        document.createElement(
            "div"
        );


    info.className =
        "foto-info";


    // ==========================================
    // MENSAJE
    // ==========================================

    const mensaje =
        document.createElement(
            "p"
        );


    mensaje.className =
        "mensaje-recuerdo";


    mensaje.textContent =
        foto.descripcion ||
        "Un recuerdo de nuestra galaxia ✨";


    info.appendChild(
        mensaje
    );


    // ==========================================
    // BOTÓN ELIMINAR
    // ==========================================

    const eliminarBtn =
        document.createElement(
            "button"
        );


    eliminarBtn.className =
        "eliminar-foto";


    eliminarBtn.type =
        "button";


    eliminarBtn.textContent =
        "🗑️ Eliminar";


    eliminarBtn.addEventListener(
        "click",
        async function (event) {


            event.stopPropagation();


            const confirmar =
                confirm(
                    "¿Seguro que quieres eliminar esta foto?"
                );


            if (!confirmar) {
                return;
            }


            eliminarBtn.disabled =
                true;


            eliminarBtn.textContent =
                "⏳ Eliminando...";


            const resultado =
                await eliminarFoto(
                    foto
                );


            if (
                resultado
            ) {

                tarjeta.remove();


                await cargarFotos();


                mostrarMensaje(
                    "🗑️ Recuerdo eliminado correctamente."
                );


            } else {


                eliminarBtn.disabled =
                    false;


                eliminarBtn.textContent =
                    "🗑️ Eliminar";

            }

        }
    );


    // ==========================================
    // ARMAR TARJETA
    // ==========================================

    tarjeta.appendChild(
        imagen
    );


    tarjeta.appendChild(
        numeroFoto
    );


    tarjeta.appendChild(
        info
    );


    tarjeta.appendChild(
        eliminarBtn
    );


    galeriaFotos.appendChild(
        tarjeta
    );


    // ==========================================
    // ABRIR FOTO GRANDE
    // ==========================================

    imagen.addEventListener(
        "click",
        function () {

            abrirFotoGrande(
                url,
                foto.descripcion
            );

        }
    );

}


// ==========================================
// ELIMINAR FOTO
// ==========================================

async function eliminarFoto(
    foto
) {

    try {


        console.log(
            "🗑️ Eliminando:",
            foto.ruta_foto
        );


        // ==========================================
        // ELIMINAR DEL STORAGE
        // ==========================================

        const {
            error: storageError
        } =
            await supabaseClient
                .storage
                .from(BUCKET)
                .remove([
                    foto.ruta_foto
                ]);


        if (
            storageError
        ) {

            console.error(
                "Error eliminando Storage:",
                storageError
            );

            mostrarMensaje(
                "❌ No se pudo eliminar la imagen."
            );

            return false;
        }


        // ==========================================
        // ELIMINAR DE LA BASE DE DATOS
        // ==========================================

        const {
            error: databaseError
        } =
            await supabaseClient
                .from(TABLA)
                .delete()
                .eq(
                    "id",
                    foto.id
                );


        if (
            databaseError
        ) {

            console.error(
                "Error eliminando registro:",
                databaseError
            );

            mostrarMensaje(
                "❌ No se pudo eliminar el registro."
            );

            return false;
        }


        return true;


    } catch (error) {

        console.error(
            "Error eliminando:",
            error
        );

        mostrarMensaje(
            "❌ Ocurrió un error al eliminar."
        );

        return false;

    }

}


// ==========================================
// CONTADOR
// ==========================================

function actualizarContador(
    cantidad
) {

    if (!contador) {
        return;
    }


    contador.textContent =
        cantidad +
        " / " +
        MAX_FOTOS +
        " fotos";

}


// ==========================================
// GALERÍA VACÍA
// ==========================================

function mostrarGaleriaVacia() {

    if (!galeriaFotos) {
        return;
    }


    galeriaFotos.innerHTML = `

        <div class="galeria-vacia">

            <div class="galaxia-icono">
                🌻
            </div>

            <h3>
                Nuestra galaxia está esperando recuerdos
            </h3>

            <p>
                Sube nuestra primera foto ✨
            </p>

        </div>

    `;

}


// ==========================================
// ABRIR FOTO GRANDE
// ==========================================

function abrirFotoGrande(
    url,
    mensaje
) {


    const modal =
        document.createElement(
            "div"
        );


    modal.className =
        "modal-foto";


    // ==========================================
    // IMAGEN
    // ==========================================

    const imagen =
        document.createElement(
            "img"
        );


    imagen.src =
        url;


    imagen.alt =
        mensaje ||
        "Recuerdo";


    // ==========================================
    // MENSAJE EN FOTO GRANDE
    // ==========================================

    const texto =
        document.createElement(
            "p"
        );


    texto.className =
        "modal-mensaje";


    texto.textContent =
        mensaje ||
        "Un recuerdo de nuestra galaxia ✨";


    // ==========================================
    // BOTÓN CERRAR
    // ==========================================

    const cerrar =
        document.createElement(
            "button"
        );


    cerrar.className =
        "cerrar-modal";


    cerrar.type =
        "button";


    cerrar.textContent =
        "×";


    cerrar.addEventListener(
        "click",
        function () {

            modal.remove();

        }
    );


    // ==========================================
    // CERRAR HACIENDO CLIC AFUERA
    // ==========================================

    modal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                modal
            ) {

                modal.remove();

            }

        }
    );


    // ==========================================
    // AGREGAR ELEMENTOS
    // ==========================================

    modal.appendChild(
        cerrar
    );


    modal.appendChild(
        imagen
    );


    modal.appendChild(
        texto
    );


    document.body.appendChild(
        modal
    );

}


// ==========================================
// MENSAJES DEL SISTEMA
// ==========================================

function mostrarMensaje(
    mensaje
) {


    console.log(
        mensaje
    );


    let aviso =
        document.getElementById(
            "mensajeSistema"
        );


    if (!aviso) {


        aviso =
            document.createElement(
                "div"
            );


        aviso.id =
            "mensajeSistema";


        document.body.appendChild(
            aviso
        );

    }


    aviso.textContent =
        mensaje;


    aviso.classList.add(
        "mostrar"
    );


    clearTimeout(
        aviso.timeout
    );


    aviso.timeout =
        setTimeout(
            function () {

                aviso.classList.remove(
                    "mostrar"
                );

            },
            3500
        );

}


// ==========================================
// INICIO
// ==========================================

console.log(
    "🌌 Galaxia de Recuerdos iniciada"
);


console.log(
    "✅ Supabase conectado"
);


// ==========================================
// CARGAR RECUERDOS
// ==========================================

cargarFotos();
