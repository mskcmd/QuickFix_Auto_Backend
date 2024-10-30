"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocket = void 0;
const socket_io_1 = require("socket.io");
function setupSocket(server) {
    const io = new socket_io_1.Server(server, {
        pingTimeout: 60000,
        cors: {
            origin: [process.env.CORS_ORIGIN || 'http://localhost:5173'],
        },
    });
    io.on('connection', (socket) => {
        console.log('Connected to socket.io');
        socket.on("setup", (userData) => {
            const id = userData.userId || userData.mechnicId;
            console.log("User/Mechanic connected:", id);
            if (id) {
                socket.join(id);
                console.log(`User/Mechanic joined: ${id}`);
                socket.emit("connected");
            }
        });
        socket.on("join chat", (room) => {
            socket.join(room);
            console.log(`User joined room: ${room}`);
        });
        socket.on("typing", (room) => socket.in(room).emit("typing"));
        socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));
        socket.on("new message", (newMessageReceived) => {
            const chat = newMessageReceived.chat;
            if (!chat.users) {
                console.log("chat.users not defined");
                return;
            }
            chat.users.forEach((user) => {
                if (user !== newMessageReceived.sender._id) {
                    socket.in(user).emit("message received", newMessageReceived);
                }
            });
        });
        socket.on("disconnect", () => {
            console.log("USER DISCONNECTED");
        });
    });
    return io;
}
exports.setupSocket = setupSocket;
