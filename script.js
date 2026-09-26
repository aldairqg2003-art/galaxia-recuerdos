// ==========================================
// 🌌 NUESTRA GALAXIA
// ==========================================

// ==========================================
// SUPABASE
// ==========================================

const SUPABASE_URL = "https://agioxyqgonhntmgyxgxr.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_i6gwm4z2Ig0IX29oWWhWXw_npzXPJg9";

const supabaseClient = window.supabase.createClient(
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

const entrarBtn = document.getElementById("entrarBtn");
const subirBtn = document.getElementById("subirBtn");
const fotoInput = document.getElementById("fotoInput");
const galeria = document.getElementById("galeria");
const galeriaFotos = document.getElementById("galeriaFotos");
const contador = document.getElementById("contador");


// ==========================================
// ENTRAR
// ==========================================

if (entrarBtn) {

    entrarBtn.addEventListener("click", function () {

        if (galeria) {

            galeria.scrollIntoView({
                behavior: "smooth"
            });

        }

    });

}


// ==========================================
// SUBIR FOTO
// ==========================================

if (subirBtn && fotoInput) {

    subirBtn.addEventListener("click", function () {

        fotoInput.click();

    });

}


// ==========================================
// SELECCIONAR FOTOS
// ==========================================

if (fotoInput) {

    fotoInput.addEventListener("change", async function (event) {

        const archivos =
            Array.from(event.target.files);

        if (archivos.length === 0) {
            return;
        }

        await procesarFotos(archivos);

        fotoInput.value = "";

    });

}


// ==========================================
// PROCESAR FOTOS
// ==========================================

async function procesarFotos(archivos) {

    try {

        mostrarMensaje(
            "🌸 Preparando fotos..."
        );


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


        if (cantidadActual >= MAX_FOTOS) {

            mostrarMensaje(
                "✨ Ya alcanzaron el máximo de 50 fotos."
            );

            return;
        }


        const espacioDisponible =
            MAX_FOTOS - cantidadActual;


        const fotosParaSubir =
            archivos.slice(
                0,
                espacioDisponible
            );


        let cantidadSubida = 0;


        for (const archivo of fotosParaSubir) {

            const resultado =
                await subirFoto(archivo);


            if (resultado) {

                cantidadSubida++;

            }

        }


        await cargarFotos();


        if (cantidadSubida > 0) {

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

async function subirFoto(archivo) {

    try {

        if (!archivo.type.startsWith("image/")) {

            mostrarMensaje(
                `❌ ${archivo.name} no es una imagen.`
            );

            return false;
        }


        const extension =
            archivo.name
                .split(".")
                .pop()
                .toLowerCase();


        const nombreBase =
            archivo.name
                .replace(/\.[^/.]+$/, "")
                .replace(
                    /[^a-zA-Z0-9-_]/g,
                    "_"
                );


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


        const ruta =
            "recuerdos/" +
            nombreUnico;


        mostrarMensaje(
            "📤 Subiendo " +
            archivo.name +
            "..."
        );


        // ======================================
        // STORAGE
        // ======================================

        const { error: uploadError } =
            await supabaseClient
                .storage
                .from(BUCKET)
                .upload(
                    ruta,
                    archivo,
                    {
                        cacheControl: "3600",
                        upsert: false
                    }
                );


        if (uploadError) {

            console.error(
                "Error Storage:",
                uploadError
            );

            mostrarMensaje(
                "❌ Error al subir la imagen."
            );

            return false;
        }


        // ======================================
        // GUARDAR EN TABLA
        // ======================================

        const { error: databaseError } =
            await supabaseClient
                .from(TABLA)
                .insert({

                    nombre_foto:
                        archivo.name,

                    ruta_foto:
                        ruta,

                    descripcion:
                        "Un recuerdo de nuestra galaxia ✨",

                    subido_por:
                        "Amiga"

                });


        if (databaseError) {

            console.error(
                "Error Base de Datos:",
                databaseError
            );


            // Si falla la BD,
            // eliminar la imagen del Storage.

            await supabaseClient
                .storage
                .from(BUCKET)
                .remove([
                    ruta
                ]);


            mostrarMensaje(
                "❌ No se pudo guardar la foto."
            );

            return false;
        }


        console.log(
            "✅ Foto subida correctamente"
        );


        return true;


    } catch (error) {

        console.error(
            "Error inesperado:",
            error
        );

        return false;

    }

}


// ==========================================
// CARGAR FOTOS
// ==========================================

async function cargarFotos() {

    try {

        const { data, error } =
            await supabaseClient
                .from(TABLA)
                .select("*")
                .order(
                    "fecha_subida",
                    {
                        ascending: true
                    }
                );


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


        actualizarContador(
            data.length
        );


        if (galeriaFotos) {

            galeriaFotos.innerHTML = "";

        }


        if (data.length === 0) {

            mostrarGaleriaVacia();

            return;
        }


        data.forEach(
            function (foto, index) {

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
// CREAR TARJETA
// ==========================================

function crearTarjetaFoto(foto, numero) {

    if (!galeriaFotos) {
        return;
    }


    // URL pública
    const { data } =
        supabaseClient
            .storage
            .from(BUCKET)
            .getPublicUrl(
                foto.ruta_foto
            );


    const url =
        data.publicUrl;


    // ======================================
    // TARJETA
    // ======================================

    const tarjeta =
        document.createElement("div");

    tarjeta.className =
        "foto-card";


    // ======================================
    // IMAGEN
    // ======================================

    const imagen =
        document.createElement("img");

    imagen.src =
        url;

    imagen.alt =
        foto.descripcion ||
        "Recuerdo de nuestra galaxia";

    imagen.loading =
        "lazy";


    // ======================================
    // NÚMERO
    // ======================================

    const numeroFoto =
        document.createElement("span");

    numeroFoto.className =
        "numero-foto";

    numeroFoto.textContent =
        "#" + numero;


    // ======================================
    // INFORMACIÓN
    // ======================================

    const info =
        document.createElement("div");

    info.className =
        "foto-info";


    const nombre =
        document.createElement("p");

    nombre.textContent =
        foto.nombre_foto;


    const fecha =
        document.createElement("small");


    if (foto.fecha_subida) {

        fecha.textContent =
            new Date(
                foto.fecha_subida
            ).toLocaleDateString(
                "es-PE",
                {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                }
            );

    }


    info.appendChild(nombre);

    info.appendChild(fecha);


    // ======================================
    // BOTÓN ELIMINAR
    // ======================================

    const eliminarBtn =
        document.createElement("button");

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
                await eliminarFoto(foto);


            if (resultado) {

                tarjeta.remove();

                await cargarFotos();

                mostrarMensaje(
                    "🗑️ Foto eliminada correctamente."
                );

            } else {

                eliminarBtn.disabled =
                    false;

                eliminarBtn.textContent =
                    "🗑️ Eliminar";

            }

        }
    );


    // ======================================
    // ARMAR TARJETA
    // ======================================

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


    // ======================================
    // ABRIR FOTO
    // ======================================

    imagen.addEventListener(
        "click",
        function () {

            abrirFotoGrande(
                url,
                foto.nombre_foto
            );

        }
    );

}


// ==========================================
// ELIMINAR FOTO
// ==========================================

async function eliminarFoto(foto) {

    try {

        console.log(
            "🗑️ Eliminando:",
            foto.nombre_foto
        );


        // ======================================
        // STORAGE
        // ======================================

        const { error: storageError } =
            await supabaseClient
                .storage
                .from(BUCKET)
                .remove([
                    foto.ruta_foto
                ]);


        if (storageError) {

            console.error(
                "Error eliminando Storage:",
                storageError
            );

            mostrarMensaje(
                "❌ No se pudo eliminar la imagen."
            );

            return false;
        }


        // ======================================
        // BASE DE DATOS
        // ======================================

        const { error: databaseError } =
            await supabaseClient
                .from(TABLA)
                .delete()
                .eq(
                    "id",
                    foto.id
                );


        if (databaseError) {

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

function actualizarContador(cantidad) {

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

function abrirFotoGrande(url, nombre) {

    const modal =
        document.createElement("div");

    modal.className =
        "modal-foto";


    const imagen =
        document.createElement("img");

    imagen.src =
        url;

    imagen.alt =
        nombre;


    const cerrar =
        document.createElement("button");

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


    modal.addEventListener(
        "click",
        function (event) {

            if (event.target === modal) {

                modal.remove();

            }

        }
    );


    modal.appendChild(
        cerrar
    );

    modal.appendChild(
        imagen
    );

    document.body.appendChild(
        modal
    );

}


// ==========================================
// MENSAJES
// ==========================================

function mostrarMensaje(mensaje) {

    console.log(mensaje);


    let aviso =
        document.getElementById(
            "mensajeSistema"
        );


    if (!aviso) {

        aviso =
            document.createElement("div");

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


cargarFotos();

