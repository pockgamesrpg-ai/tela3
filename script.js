```javascript
const startShare = document.getElementById("startShare");
const stopShare = document.getElementById("stopShare");

const screenPreview = document.getElementById("screenPreview");
const emptyPreview = document.getElementById("emptyPreview");
const message = document.getElementById("message");
const resolution = document.getElementById("resolution");
const fullscreenBtn = document.getElementById("fullscreenBtn");

let screenStream = null;


/* =========================================
   VERIFICAR SUPORTE
========================================= */

function checkScreenShareSupport() {

    if (!window.isSecureContext) {

        message.textContent =
            "O compartilhamento precisa ser aberto pelo HTTPS do Render.";

        return false;
    }

    if (!navigator.mediaDevices) {

        message.textContent =
            "Seu navegador não disponibilizou acesso à mídia.";

        return false;
    }

    if (!navigator.mediaDevices.getDisplayMedia) {

        message.textContent =
            "Seu navegador não suporta compartilhamento de tela.";

        return false;
    }

    return true;
}


/* =========================================
   INICIAR COMPARTILHAMENTO
========================================= */

startShare.addEventListener("click", async () => {

    if (!checkScreenShareSupport()) {
        return;
    }

    try {

        message.textContent =
            "Abrindo a seleção de tela...";


        /*
         * IMPORTANTE:
         * O áudio depende do navegador e da opção
         * escolhida pelo usuário na janela de compartilhamento.
         */

        screenStream =
            await navigator.mediaDevices.getDisplayMedia({

                video: {
                    cursor: "always"
                },

                audio: true

            });


        const videoTrack =
            screenStream.getVideoTracks()[0];


        if (!videoTrack) {

            throw new Error(
                "Nenhuma faixa de vídeo foi encontrada."
            );

        }


        /* =====================================
           MOSTRAR PRÉ-VISUALIZAÇÃO
        ===================================== */

        screenPreview.srcObject = screenStream;

        screenPreview.style.display = "block";

        emptyPreview.style.display = "none";


        /*
         * Força o vídeo a começar.
         */

        try {

            await screenPreview.play();

        } catch (error) {

            console.log(
                "O navegador bloqueou o play automático:",
                error
            );

        }


        /* =====================================
           ATUALIZAR BOTÕES
        ===================================== */

        startShare.disabled = true;

        stopShare.disabled = false;


        /* =====================================
           RESOLUÇÃO
        ===================================== */

        const settings =
            videoTrack.getSettings();


        if (
            settings.width &&
            settings.height
        ) {

            resolution.textContent =
                `${settings.width} × ${settings.height}`;

        } else {

            resolution.textContent = "HD";

        }


        /* =====================================
           ÁUDIO
        ===================================== */

        const audioTracks =
            screenStream.getAudioTracks();


        if (audioTracks.length > 0) {

            message.textContent =
                "🟢 Tela e áudio do sistema sendo capturados.";

        } else {

            message.textContent =
                "🟢 Tela sendo capturada. Nenhum áudio do sistema foi selecionado.";

        }


        /* =====================================
           USUÁRIO PAROU PELO NAVEGADOR
        ===================================== */

        videoTrack.addEventListener(
            "ended",
            stopScreenShare
        );


    } catch (error) {

        console.error(
            "Erro ao compartilhar tela:",
            error
        );


        /*
         * Usuário simplesmente clicou em cancelar.
         */

        if (error.name === "NotAllowedError") {

            message.textContent =
                "Compartilhamento cancelado. Escolha uma tela e clique em Compartilhar.";

        }

```
