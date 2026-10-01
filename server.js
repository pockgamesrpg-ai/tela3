const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const rooms = new Map();

app.use(express.static(__dirname));

app.get("/", function(req, res) {
res.sendFile(path.join(__dirname, "index.html"));
});

function send(socket, data) {
if (socket && socket.readyState === WebSocket.OPEN) {
socket.send(JSON.stringify(data));
}
}

function createRoomCode() {
const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
let code = "";

```
for (let i = 0; i < 6; i++) {
    code += chars.charAt(
        Math.floor(Math.random() * chars.length)
    );
}

if (rooms.has(code)) {
    return createRoomCode();
}

return code;
```

}

function closeRoom(roomCode) {
const room = rooms.get(roomCode);

```
if (!room) {
    return;
}

room.viewers.forEach(function(viewer) {
    send(viewer.socket, {
        type: "stream-ended"
    });

    try {
        viewer.socket.close();
    } catch (error) {}
});

rooms.delete(roomCode);

console.log("Sala encerrada: " + roomCode);
```

}

wss.on("connection", function(socket) {

```
socket.id = crypto.randomUUID();
socket.room = null;
socket.role = null;

console.log("Cliente conectado: " + socket.id);

socket.on("message", function(message) {

    let data;

    try {
        data = JSON.parse(message.toString());
    } catch (error) {
        console.log("Mensagem inválida.");
        return;
    }

    if (data.type === "create-room") {

        const roomCode = createRoomCode();

        rooms.set(roomCode, {
            host: socket,
            viewers: new Map()
        });

        socket.room = roomCode;
        socket.role = "host";

        send(socket, {
            type: "room-created",
            room: roomCode
        });

        console.log("Sala criada: " + roomCode);

        return;
    }

    if (data.type === "join-room") {

        const roomCode = String(data.room || "")
            .trim()
            .toUpperCase();

        const room = rooms.get(roomCode);

        if (!room) {
            send(socket, {
                type: "error",
                message: "Sala não encontrada."
            });

            return;
        }

        if (!room.host) {
            send(socket, {
                type: "error",
                message: "Transmissão não está ativa."
            });

            return;
        }

        socket.room = roomCode;
        socket.role = "viewer";

        room.viewers.set(socket.id, {
            socket: socket
        });

        send(socket, {
            type: "joined",
            room: roomCode,
            viewerId: socket.id
        });

        send(room.host, {
            type: "viewer-joined",
            viewerId: socket.id
        });

        send(room.host, {
            type: "viewer-count",
            count: room.viewers.size
        });

        console.log(
            "Viewer entrou na sala: " + roomCode
        );

        return;
    }

    if (
        data.type === "offer" ||
        data.type === "answer" ||
        data.type === "ice-candidate"
    ) {

        const room = rooms.get(socket.room);

        if (!room) {
            return;
        }

        if (socket.role === "viewer") {

            if (room.host) {
                send(room.host, {
                    type: data.type,
                    viewerId: socket.id,
                    offer: data.offer,
                    answer: data.answer,
                    candidate: data.candidate
                });
            }

            return;
        }

        if (socket.role === "host") {

            const viewer = room.viewers.get(
                data.viewerId
            );
```
