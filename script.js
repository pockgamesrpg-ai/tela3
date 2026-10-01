```javascript
const startShare = document.getElementById("startShare");
const stopShare = document.getElementById("stopShare");

const screenPreview =
    document.getElementById("screenPreview");

const emptyPreview =
    document.getElementById("emptyPreview");

const message =
    document.getElementById("message");

const resolution =
    document.getElementById("resolution");

const fullscreenBtn =
    document.getElementById("fullscreenBtn");


let screenStream = null;


/* =========================================
   INICIAR COMPARTILHAMENTO
========================================= */

startShare.addEventListener("click", async () => {

    try {

        if (!navigator.mediaDevices ||
            !navigator.mediaDevices.getDisplayMedia) {

            message.textContent =
                "Seu navegador não suporta compartilhamento de tela.";

            return;
        }


        screenStream =
            await navigator.mediaDevices.getDisplayMedia({

                video: {
                    cursor: "always"
                },

                audio: true

            });


        screenPreview.srcObject = screenStream;

        screenPreview.style.display = "block";

        emptyPreview.style.display = "none";


        startShare.disabled = true;

        stopShare.disabled = false;


        const videoTrack =
            screenStream.getVideoTracks()[0];

        const settings =
            videoTrack.getSettings();


        if (settings.width && settings.height) {

            resolution.textContent =
                `${settings.width} × ${settings.height}`;

        } else {

            resolution.textContent =
                "HD";

        }


        if (screenStream.getAudioTracks().length > 0) {

            message.textContent =
                "Tela e áudio do sistema sendo capturados.";

        } else {

            message.textContent =
                "Tela sendo capturada. O áudio do sistema não foi selecionado.";

        }


        /*
         * Se o usuário clicar no botão "Parar compartilhamento"
         * do próprio navegador, também encerramos aqui.
         */

        videoTrack.addEventListener(
            "ended",
            stopScreenShare
        );


    } catch (error) {

        console.error(error);

        message.textContent =
            "O compartilhamento foi cancelado ou não pôde ser iniciado.";

    }

});


/* =========================================
   PARAR COMPARTILHAMENTO
========================================= */

stopShare.addEventListener(
    "click",
    stopScreenShare
);


function stopScreenShare() {

    if (screenStream) {

        screenStream
            .getTracks()
            .forEach(track => track.stop());

        screenStream = null;

    }


    screenPreview.srcObject = null;

    screenPreview.style.display = "none";

    emptyPreview.style.display = "flex";


    startShare.disabled = false;

    stopShare.disabled = true;


    resolution.textContent = "--";

    message.textContent =
        "Nenhuma transmissão ativa.";

}


/* =========================================
   TELA CHEIA
========================================= */

if (fullscreenBtn) {

    fullscreenBtn.addEventListener("click", async () => {

        try {

            if (!document.fullscreenElement) {

                await document.documentElement.requestFullscreen();

            } else {

                await document.exitFullscreen();

            }

        } catch (error) {

            console.error(
                "Não foi possível ativar a tela cheia:",
                error
            );

        }

    });


    /*
     * Atualiza o texto do botão quando
     * entra ou sai da tela cheia.
     */

    document.addEventListener(
        "fullscreenchange",
        () => {

            if (document.fullscreenElement) {

                fullscreenBtn.textContent =
                    "⛶ Sair da tela cheia";

            } else {

                fullscreenBtn.textContent =
                    "⛶ Tela cheia";

            }

        }
    );

}
```
