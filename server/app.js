import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

const rooms = new Map();

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  let currentRoom = null;
  let currentUser = null;

  socket.on("join_room", (data) => {
    const { roomId, userName } = data;

    if (currentRoom && rooms.has(currentRoom)) {
      socket.leave(currentRoom);
      const room = rooms.get(currentRoom);
      room.users.delete(currentUser);
      io.to(currentRoom).emit("userJoined", Array.from(room.users));
      if (room.users.size === 0) rooms.delete(currentRoom);
    }

    currentRoom = roomId;
    currentUser = userName;

    socket.join(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        users: new Set(),
        code: "// Start coding here...",
        language: "javascript"
      });
    }

    const room = rooms.get(roomId);
    room.users.add(userName);

    io.to(roomId).emit("userJoined", Array.from(room.users));
    
    // Send the current room state only to the user who just joined
    socket.emit("initial_state", {
      code: room.code,
      language: room.language
    });

    console.log("User joined room:", roomId, userName);
  });

  socket.on("code_change", ({ roomId, code }) => {
    if (rooms.has(roomId)) {
      rooms.get(roomId).code = code;
    }
    socket.to(roomId).emit("code_change", code);
  });

  socket.on("language_change", ({ roomId, language }) => {
    if (rooms.has(roomId)) {
      rooms.get(roomId).language = language;
    }
    socket.to(roomId).emit("language_change", language);
  });

  socket.on("typing", ({ roomId, userName }) => {
    socket.to(roomId).emit("typing", userName);
  });

  socket.on("leave_room", () => {
    if (currentRoom && currentUser) {
      if (rooms.has(currentRoom)) {
        const room = rooms.get(currentRoom);
        room.users.delete(currentUser);
        io.to(currentRoom).emit("userJoined", Array.from(room.users));
        if (room.users.size === 0) rooms.delete(currentRoom);
      }
      socket.leave(currentRoom);
      console.log(`User ${currentUser} left room ${currentRoom}`);
      currentRoom = null;
      currentUser = null;
    }
  });

  socket.on("disconnect", () => {
    if (currentRoom && currentUser) {
      if (rooms.has(currentRoom)) {
        const room = rooms.get(currentRoom);
        room.users.delete(currentUser);
        io.to(currentRoom).emit("userJoined", Array.from(room.users));
        if (room.users.size === 0) rooms.delete(currentRoom);
      }
      console.log(`User ${currentUser} disconnected from room ${currentRoom}`);
    }
    console.log("User Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});