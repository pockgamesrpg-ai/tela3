```javascript
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");
const crypto = require("crypto");

const app = express();

const server = http.createServer(app);

const wss = new WebSocket.Server({
    server
});


app.use(express.static(__dirname));


app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "index.html")
    );

});


const rooms = new Map();


function generateRoomCode() {

    const characters =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code;

    do {

        code = "";

        for (let i = 0; i < 6; i++) {

            code +=
                characters[
                    Math.floor(
                        Math.random() *
                        characters.length
                    )
                ];

        }

    } while (rooms.has(code));


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


function sendViewersCount(room) {

    const count =
        room.viewers.size;


    if (room.host) {

        send(room.host, {

            type: "viewer-count",

            count

        });

    }

}


function closeRoom(roomCode) {

    const room =
        rooms.get(roomCode);


    if (!room) {
        return;
    }


    for (
        const viewer
        of room.viewers.values()
    ) {

        send(viewer.socket, {

            type:
                "stream-ended"

        });

        try {

            viewer.socket.close();

        } catch {}

    }


    if (room.host) {

        try {

            room.host.close();

        } catch {}

    }


    rooms.delete(
        roomCode
    );

}


wss.on("connection", (socket) => {

    socket.room = null;

    socket.role = null;

    socket.id =
        crypto.randomUUID();


    console.log(
        "WebSocket conectado:",
        socket.id
    );


    socket.on("message", (raw) => {

        let data;


        try {

            data =
                JSON.parse(
                    raw.toString()
                );

        } catch {

            return;

        }


        /* =====================================
           CRIAR SALA
        ===================================== */

        if (
            data.type ===
            "create-room"
        ) {

            const roomCode =
                generateRoomCode();


            const room = {

                host: socket,

                viewers: new Map()

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

                type:
                    "room-created",

                room:
                    roomCode

            });


            console.log(
                "Sala criada:",
                roomCode
            );


            return;

        }


        /* =====================================
           ENTRAR
        ===================================== */

        if (
            data.type ===
            "join-room"
        ) {

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

                    type:
                        "error",

                    message:
                        "Sala não encontrada."

                });

                return;

            }


            if (!room.host) {

                send(socket, {

                    type:
                        "error",

                    message:
                        "A transmissão não está ativa."

                });

                return;

            }


            socket.room =
                roomCode;

            socket.role =
                "viewer";


            const viewer = {

                id:
                    socket.id,

                socket

            };


            room.viewers.set(
                socket.id,
                viewer
            );


            send(socket, {

                type:
                    "joined",

                room:
                    roomCode,

                viewerId:
                    socket.id

            });


            send(room.host, {

                type:
                    "viewer-joined",

                viewerId:
                    socket.id

            });


            sendViewersCount(
                room
            );


            console.log(
                `Viewer ${socket.id} entrou em ${roomCode}`
            );


            return;

        }


        /* =====================================
           WEBRTC
        ===================================== */

        if (
            data.type === "offer" ||
            data.type === "answer" ||
            data.type === "ice-candidate"
        ) {

            const room =
                rooms.get(
                    socket.room
                );


            if (!room) {
                return;
            }


            const viewerId =
                data.viewerId;


            if (
                socket.role ===
                "viewer"
            ) {

                if (
                    room.host
                ) {

                    send(
                        room.host,
                        {

                            ...data,

                            viewerId:
                                socket.id

                        }
                    );

                }

                return;

            }


            if (
                socket.role ===
                "host"
            ) {

                const viewer =
                    room.viewers.get(
                        viewerId
                    );


                if (
                    viewer
                ) {

                    send(
                        viewer.socket,
                        data
                    );

                }

            }


            return;

        }


        /* =====================================
           ENCERRAR
        ===================================== */

        if (
            data.type ===
            "stop-room"
        ) {

            if (
                socket.role ===
                "host"
            ) {

                closeRoom(
                    socket.room
                );

            }

        }

    });


    socket.on("close", () => {

        const roomCode =
            socket.room;


        if (!roomCode) {
            return;
        }


        const room =
            rooms.get(
                roomCode
            );


        if (!room) {
            return;
        }


        if (
            socket.role ===
            "host"
        ) {

            for (
                const viewer
                of room.viewers.values()
            ) {

                send(
                    viewer.socket,
                    {

                        type:
                            "stream-ended"

                    }
                );


                try {

                    viewer.socket.close();

                } catch {}

            }


            rooms.delete(
                roomCode
            );


            console.log(
                "Host saiu:",
                roomCode
            );


            return;

        }


        if (
            socket.role ===
            "viewer"
        ) {

            room.viewers.delete(
                socket.id
            );


            sendViewersCount(
                room
            );

        }

    });

});


const PORT =
    process.env.PORT || 3000;


server.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `FAMILIA VERCETTI online na porta ${PORT}`
        );

    }
);
```
