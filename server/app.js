import express from "express";
import http from "http";
import { server } from "socket.io";
import cors from "cors";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors : {
        origin : "*",
    },
});

const rooms = new Map();

io.on("connextion", (socket) => {
    console.log("User Connected : ", socket.id);

    let currentRoom = null;
    let currentUser = null;

    socket.on("join_room", (data) => {
        const { roomId, userName } = data;

        if(currentRoom){
            socket.leave(currentRoom);
            rooms.get(currentRoom).delete(currentUser);
            io.to(currentRoom).emit("userJoined").Array.from(rooms.get(currentRoom));
        }

        currentRoom = roomId;
        currentUser = userName;

        socket.join(roomId);

        if(!rooms.has(roomId)){
            rooms.set(roomId, new Set());

            rooms.get(roomId).add(userName);
            io.to(roomId).emit("userJoined", Array.from(rooms.get(roomId)));
        }
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



