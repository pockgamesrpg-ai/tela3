```javascript
const createRoom =
    document.getElementById("createRoom");

const joinRoom =
    document.getElementById("joinRoom");

const joinBox =
    document.getElementById("joinBox");

const roomInput =
    document.getElementById("roomInput");

const enterRoom =
    document.getElementById("enterRoom");

const cancelJoin =
    document.getElementById("cancelJoin");

const home =
    document.getElementById("home");

const streamPage =
    document.getElementById("streamPage");

const mainVideo =
    document.getElementById("mainVideo");

const videoMessage =
    document.getElementById("videoMessage");

const roomLabel =
    document.getElementById("roomLabel");

const roomCode =
    document.getElementById("roomCode");

const viewerCount =
    document.getElementById("viewerCount");

const streamStatus =
    document.getElementById("streamStatus");

const copyLink =
    document.getElementById("copyLink");

const copyLink2 =
    document.getElementById("copyLink2");

const shareLink =
    document.getElementById("shareLink");

const fullscreen =
    document.getElementById("fullscreen");

const stopStream =
    document.getElementById("stopStream");


let socket = null;

let room = null;

let role = null;

let screenStream = null;

let viewerId = null;

let peerConnections = {};

let viewerCountValue = 0;


/* =========================================
   SERVIDOR WEBSOCKET
========================================= */

function getWebSocketURL() {

    const protocol =
        location.protocol === "https:"
            ? "wss:"
            : "ws:";

    return (
        protocol +
        "//" +
        location.host
    );

}


/* =========================================
   CONECTAR
========================================= */

function connectSocket() {

    return new Promise(
        (resolve, reject) => {

            socket =
                new WebSocket(
                    getWebSocketURL()
                );


            socket.addEventListener(
                "open",
                () => {

                    console.log(
                        "WebSocket conectado"
                    );

                    resolve();

                }
            );


            socket.addEventListener(
                "error",
                (error) => {

                    console.error(
                        "WebSocket:",
                        error
                    );

                    reject(error);

                }
            );


            socket.addEventListener(
                "message",
                handleMessage
            );


            socket.addEventListener(
                "close",
                () => {

                    console.log(
                        "WebSocket desconectado"
                    );

                }
            );

        }
    );

}


/* =========================================
   ENVIAR
========================================= */

function send(data) {

    if (
        socket &&
        socket.readyState ===
        WebSocket.OPEN
    ) {

        socket.send(
            JSON.stringify(data)
        );

    }

}


/* =========================================
   CRIAR SALA
========================================= */

createRoom.addEventListener(
    "click",
    async () => {

        try {

            /*
             * Primeiro pede a tela.
             * Assim a permissão acontece
             * diretamente após o clique.
             */

            screenStream =
                await navigator.mediaDevices.getDisplayMedia({

                    video: {
                        cursor: "always"
                    },

                    audio: true

                });


            await connectSocket();


            role =
                "host";


            send({

                type:
                    "create-room"

            });


        } catch (error) {

            console.error(
                error
            );


            if (
                error.name ===
                "NotAllowedError"
            ) {

                alert(
                    "Você cancelou o compartilhamento da tela."
                );

            } else {

                alert(
                    "Não foi possível iniciar a transmissão."
                );

            }

        }

    }
);


/* =========================================
   SALA CRIADA
========================================= */

async function handleRoomCreated(data) {

    room =
        data.room;


    showStreamPage();


    roomLabel.textContent =
        "Sala: " + room;


    roomCode.textContent =
        room;


    const url =
        location.origin +
        "?sala=" +
        room;


    shareLink.value =
        url;


    streamStatus.textContent =
        "Transmitindo";


    mainVideo.srcObject =
        screenStream;


    mainVideo.style.display =
        "block";


    videoMessage.style.display =
        "none";


    stopStream.style.display =
        "inline-block";


    /*
     * O host não precisa
     * de um PeerConnection próprio.
     */

}


/* =========================================
   ENTRAR
========================================= */

joinRoom.addEventListener(
    "click",
    () => {

        joinBox.classList.remove(
            "hidden"
        );

        roomInput.focus();

    }
);


cancelJoin.addEventListener(
    "click",
    () => {

        joinBox.classList.add(
            "hidden"
        );

    }
);


enterRoom.addEventListener(
    "click",
    startViewer
);


roomInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Enter"
        ) {

            startViewer();

        }

    }
);


async function startViewer() {

    const code =
        roomInput.value
            .trim()
            .toUpperCase();


    if (!code) {

        alert(
            "Digite o código da sala."
        );

        return;

    }


    try {

        await connectSocket();


        role =
            "viewer";


        send({

            type:
                "join-room",

            room:
                code

        });


    } catch (error) {

        console.error(
            error
        );

        alert(
            "Não foi possível conectar ao servidor."
        );

    }

}


/* =========================================
   MENSAGENS
========================================= */

async function handleMessage(event) {

    let data;


    try {

        data =
            JSON.parse(
                event.data
            );

    } catch {

        return;

    }


    console.log(
        "Servidor:",
        data
    );


    /* SALA CRIADA */

    if (
        data.type ===
        "room-created"
    ) {

        await handleRoomCreated(
            data
        );

        return;

    }


    /* ENTROU */

    if (
        data.type ===
        "joined"
    ) {

        room =
            data.room;

        viewerId =
            data.viewerId;


        showStreamPage();


        roomLabel.textContent =
            "Sala: " + room;


        roomCode.textContent =
            room;


        streamStatus.textContent =
            "Conectando...";


        stopStream.style.display =
            "none";


        const url =
            location.origin +
            "?sala=" +
            room;


        shareLink.value =
            url;


        return;

    }


    /* NOVO VIEWER */

    if (
        data.type ===
        "viewer-joined"
    ) {

        if (
            role ===
            "host"
        ) {

            await createPeerForViewer(
                data.viewerId
            );

        }

        return;

    }


    /* OFERTA */

    if (
        data.type ===
        "offer"
    ) {

        if (
            role ===
            "viewer"
        ) {

            await receiveOffer(
                data
            );

        }

        return;

    }


    /* RESPOSTA */

    if (
        data.type ===
        "answer"
    ) {

        if (
            role ===
            "host"
        ) {

            const pc =
                peerConnections[
                    data.viewerId
                ];


            if (pc) {

                await pc.setRemoteDescription(
                    new RTCSessionDescription(
                        data.answer
                    )
                );

            }

        }

        return;

    }


    /* ICE */

    if (
        data.type ===
        "ice-candidate"
    ) {

        await receiveIceCandidate(
            data
        );

        return;

    }


    /* CONTADOR */

    if (
        data.type ===
        "viewer-count"
    ) {

        viewerCountValue =
            data.count;


        viewerCount.textContent =
            data.count;


        return;

    }


    /* ERRO */

    if (
        data.type ===
        "error"
    ) {

        alert(
            data.message
        );


        return;

    }


    /* TRANSMISSÃO TERMINOU */

    if (
        data.type ===
        "stream-ended"
    ) {

        mainVideo.srcObject =
            null;


        mainVideo.style.display =
            "none";


        videoMessage.style.display =
            "flex";


        streamStatus.textContent =
            "Transmissão encerrada";


        alert(
            "O transmissor encerrou a transmissão."
        );


        return;

    }

}


/* =========================================
   WEBRTC
========================================= */

const rtcConfiguration = {

    iceServers: [

        {
            urls:
                "stun:stun.l.google.com:19302"
        },

        {
            urls:
                "stun:stun1.l.google.com:19302"
        }

    ]

};


/* =========================================
   HOST CRIA CONEXÃO
========================================= */

async function createPeerForViewer(
    id
) {

    const pc =
        new RTCPeerConnection(
            rtcConfiguration
        );


    peerConnections[id] =
        pc;


    /*
     * Adiciona tela e áudio
     * para esse espectador.
     */

    screenStream
        .getTracks()
        .forEach(track => {

            pc.addTrack(
                track,
                screenStream
            );

        });


    pc.onicecandidate =
        event => {

            if (
                event.candidate
            ) {

                send({

                    type:
                        "ice-candidate",

                    viewerId:
                        id,

                    candidate:
                        event.candidate

                });

            }

        };


    pc.onconnectionstatechange =
        () => {

            console.log(
                "Host connection:",
                id,
                pc.connectionState
            );


            if (
                pc.connectionState ===
                "failed" ||
                pc.connectionState ===
                "closed"
            ) {

                pc.close();

                delete peerConnections[id];

            }

        };


    const offer =
        await pc.createOffer();


    await pc.setLocalDescription(
        offer
    );


    send({

        type:
            "offer",

        viewerId:
            id,

        offer

    });

}


/* =========================================
   VIEWER RECEBE OFERTA
========================================= */

async function receiveOffer(
    data
) {

    const pc =
        new RTCPeerConnection(
            rtcConfiguration
        );


    peerConnections.host =
        pc;


    pc.onicecandidate =
        event => {

            if (
                event.candidate
            ) {

                send({

                    type:
                        "ice-candidate",

                    viewerId:
                        viewerId,

                    candidate:
                        event.candidate

                });

            }

        };


    pc.ontrack =
        event => {

            if (
                event.streams &&
                event.streams[0]
            ) {

                mainVideo.srcObject =
                    event.streams[0];


                mainVideo.style.display =
                    "block";


                videoMessage.style.display =
                    "none";


                streamStatus.textContent =
                    "Assistindo ao vivo";


                mainVideo.play()
                    .catch(() => {});

            }

        };


    pc.onconnectionstatechange =
        () => {

            console.log(
                "Viewer connection:",
                pc.connectionState
            );


            if (
                pc.connectionState ===
                "connected"
            ) {

                streamStatus.textContent =
                    "Assistindo ao vivo";

            }


            if (
                pc.connectionState ===
                "failed"
            ) {

                streamStatus.textContent =
                    "Falha na conexão";

            }

        };


    await pc.setRemoteDescription(
        new RTCSessionDescription(
            data.offer
        )
    );


    const answer =
        await pc.createAnswer();


    await pc.setLocalDescription(
        answer
    );


    send({

        type:
            "answer",

        viewerId:
            viewerId,

        answer

    });

}


/* =========================================
   ICE
========================================= */

async function receiveIceCandidate(
    data
) {

    try {

        let pc;


        if (
            role ===
            "viewer"
        ) {

            pc =
                peerConnections.host;

        } else {

            pc =
                peerConnections[
                    data.viewerId
                ];

        }


        if (
            pc &&
            data.candidate
        ) {

            await pc.addIceCandidate(
                new RTCIceCandidate(
                    data.candidate
                )
            );

        }

    } catch (error) {

        console.error(
            "Erro ICE:",
            error
        );

    }

}


/* =========================================
   MOSTRAR TRANSMISSÃO
========================================= */

function showStreamPage() {

    home.classList.add(
        "hidden"
    );

    streamPage.classList.remove(
        "hidden"
    );

}


/* =========================================
   COPIAR LINK
========================================= */

async function copyTransmissionLink() {

    try {

        await navigator.clipboard.writeText(
            shareLink.value
        );


        const original =
            copyLink.textContent;


        copyLink.textContent =
            "✓ Copiado!";


        setTimeout(
            () => {

                copyLink.textContent =
                    original;

            },
            2000
        );


    } catch {

        shareLink.select();

        document.execCommand(
            "copy"
        );

    }

}


copyLink.addEventListener(
    "click",
    copyTransmissionLink
);


copyLink2.addEventListener(
    "click",
    copyTransmissionLink
);


/* =========================================
   TELA CHEIA
========================================= */

fullscreen.addEventListener(
    "click",
    async () => {

        try {

            if (
                !document.fullscreenElement
            ) {

                await mainVideo.requestFullscreen();

            } else {

                await document.exitFullscreen();

            }

        } catch (error) {

            console.error(
                error
            );

        }

    }
);


/* =========================================
   ENCERRAR
========================================= */

stopStream.addEventListener(
    "click",
    () => {

        if (
            !confirm(
                "Deseja realmente encerrar a transmissão?"
            )
        ) {

            return;

        }


        if (
            screenStream
        ) {

            screenStream
                .getTracks()
                .forEach(
                    track =>
                        track.stop()
                );


            screenStream =
                null;

        }


        Object.values(
            peerConnections
        )
        .forEach(
            pc => {

                try {

                    pc.close();

                } catch {}

            }
        );


        peerConnections =
            {};


        send({

            type:
                "stop-room"

        });


        streamStatus.textContent =
            "Transmissão encerrada";


        mainVideo.srcObject =
            null;


        mainVideo.style.display =
            "none";


        videoMessage.style.display =
            "flex";


        stopStream.style.display =
            "none";

    }
);


/* =========================================
   DETECTAR PARADA DA TELA
========================================= */

function monitorScreenTrack() {

    if (
        !screenStream
    ) {

        return;

    }


    const videoTrack =
        screenStream.getVideoTracks()[0];


    if (
        videoTrack
    ) {

        videoTrack.addEventListener(
            "ended",
            () => {

                if (
                    role ===
                    "host"
                ) {

                    send({

                        type:
                            "stop-room"

                    });

                }


                streamStatus.textContent =
                    "Transmissão encerrada";

            }
        );

    }

}


/* =========================================
   URL ?sala=ABC123
========================================= */

async function checkRoomFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const sala =
        params.get(
            "sala"
        );


    if (
        sala
    ) {

        joinBox.classList.remove(
            "hidden"
        );


        roomInput.value =
            sala.toUpperCase();


        /*
         * Não entra automaticamente.
         * O usuário confirma clicando em Entrar.
         */

    }

}


/* =========================================
   INICIALIZAÇÃO
========================================= */

checkRoomFromURL();


console.log(
    "FAMILIA VERCETTI carregada."
);
```
