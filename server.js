```javascript
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();

const server = http.createServer(app);

const wss = new WebSocket.Server({
    server
});


/* =========================================
   ARQUIVOS DO SITE
========================================= */

app.use(express.static(__dirname));


app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "index.html")
    );

});


/* =========================================
   SALAS
========================================= */

const rooms = new Map();


function generateRoomCode() {

    const characters =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    for (let i = 0; i < 6; i++) {

        code +=
            characters[
                Math.floor(
                    Math.random() *
                    characters.length
                )
            ];

    }

    return code;
}


function send(socket, data) {

    if (
        socket &&
        socket.readyState === WebSocket.OPEN
    ) {

        socket.send(
            JSON.stringify(data)
        );

    }

}


/* =========================================
   WEBSOCKET
========================================= */

wss.on("connection", (socket) => {

    console.log("Nova conexão WebSocket");


    socket.room = null;
    socket.role = null;


    socket.on("message", (raw) => {

        let data;

        try {

            data =
                JSON.parse(raw.toString());

        } catch {

            return;

        }


        /* =====================================
           CRIAR SALA
        ===================================== */

        if (data.type === "create-room") {

            let roomCode;

            do {

                roomCode =
                    generateRoomCode();

            } while (
                rooms.has(roomCode)
            );


            const room = {

                host: socket,

                viewers: new Set()

            };


            rooms.set(
                roomCode,
                room
            );


            socket.room =
                roomCode;

            socket.role =
                "host";


            send(socket, {

                type: "room-created",

                room:
                    roomCode

            });


            console.log(
                `Sala criada: ${roomCode}`
            );


            return;

        }


        /* =====================================
           ENTRAR NA SALA
        ===================================== */

        if (data.type === "join-room") {

            const roomCode =
                String(
                    data.room || ""
                )
                .trim()
                .toUpperCase();


            const room =
                rooms.get(roomCode);


            if (!room) {

                send(socket, {

                    type: "error",

                    message:
                        "Sala não encontrada."

                });

                return;

            }


            if (!room.host) {

                send(socket, {

                    type: "error",

                    message:
                        "Esta transmissão não está ativa."

                });

                return;

            }


            socket.room =
                roomCode;

            socket.role =
                "viewer";


            room.viewers.add(socket);


            send(socket, {

                type: "joined",

                room:
                    roomCode

            });


            /* Avisar o transmissor */

            send(room.host, {

                type: "viewer-joined",

                viewerId:
                    socket._socket.remoteAddress +
                    ":" +
                    socket._socket.remotePort

            });


            /* Enviar quantidade */

            send(room.host, {

                type: "viewer-count",

                count:
                    room.viewers.size

            });


            send(socket, {

                type: "viewer-count",

                count:
                    room.viewers.size

            });


            console.log(
                `Espectador entrou na sala ${roomCode}`
            );


            return;

        }


        /* =====================================
           MENSAGENS WEBRTC
        ===================================== */

        if (
            data.type === "offer" ||
            data.type === "answer" ||
            data.type === "ice-candidate"
        ) {

            const room =
                rooms.get(socket.room);


            if (!room) {
                return;
            }


            /*
             * Se for espectador,
             * enviar para o transmissor.
             */

            if (
                socket.role === "viewer" &&
                room.host
            ) {

                send(room.host, {

                    ...data,

                    viewerId:
                        data.viewerId

                });

            }


            /*
             * Se for transmissor,
             * enviar para todos os espectadores
             * ou para o espectador especificado.
             */

            else if (
                socket.role === "host"
            ) {

                if (data.viewerId) {

                    /*
                     * Como cada viewer recebe
                     * um ID criado pelo servidor,
                     * procuramos pelo ID.
                     */

                    for (
                        const viewer
                        of room.viewers
                    ) {

                        if (
                            viewer.viewerId ===
                            data.viewerId
                        ) {

                            send(
                                viewer,
                                data
                            );

                        }

                    }

                }

            }


            return;

        }


        /* =====================================
           ENCERRAR SALA
        ===================================== */

        if (data.type === "stop-room") {

            closeRoom(
                socket.room
            );

        }

    });


    /* =========================================
       DESCONECTOU
    ========================================= */

    socket.on("close", () => {

        const roomCode =
            socket.room;


        if (!roomCode) {
```
