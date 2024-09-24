import { Server as SocketServer, Socket } from 'socket.io';
import http from 'http';

export function setupSocket(server: http.Server) {
    const io = new SocketServer(server, {
        pingTimeout: 60000,
        cors: {
            origin: 'http://localhost:5173',
        },
    });

    io.on('connection', (socket: Socket) => {
        console.log('Connected to socket.io');

        socket.on("setup", (userData: { userId?: string; mechnicId?: string }) => {
            const id = userData.userId || userData.mechnicId;
            console.log("User/Mechanic connected:", id);
            if (id) {
                socket.join(id);
                console.log(`User/Mechanic joined: ${id}`);
                socket.emit("connected");
            }
        });

        socket.on("join chat", (room: string) => {
            socket.join(room);
            console.log(`User joined room: ${room}`);
        });

        socket.on("typing", (room: string) => socket.in(room).emit("typing"));
        socket.on("stop typing", (room: string) => socket.in(room).emit("stop typing"));
        

        socket.on("new message", (newMessageReceived: any) => {
            const chat = newMessageReceived.chat;
            
            if (!chat.users) {
                console.log("chat.users not defined");
                return;
            }
            
            chat.users.forEach((user: string) => {
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