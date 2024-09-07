// import express from 'express';
// import http from "http";
// import {connectDB} from "../config/mongoConfig"
// import authRoute from "./routes/authRoutes"
// import mechanicRoute from "./routes/mechanicRoute"
// import cors from "cors"
// import session from 'express-session';
// import { v4 as uuidv4 } from 'uuid';
// import {errorHandler,notFound} from "./middleware/errorMiddleware"
// import adminRoute from './routes/adminRoutes';
// import cookieParser from 'cookie-parser';
// import userRoute from './routes/userRoutes';

// // Generate a UUID
// const uuid = uuidv4();
// require("dotenv").config();
// const app = express();
// const port = 5000;
// connectDB()

// // Middlewares
// app.use(session({
//   secret: uuid,
//   resave: false,
//   saveUninitialized: true,
//   cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 1 day in milliseconds
// }));
// app.use(cookieParser());
// app.use(express.json());

// app.use(cors({
// origin:["http://localhost:5173"],
// methods: ["GET,PUT,PATCH,POST,DELETE"],
// credentials:true
// }))


// // Routes
// app.use("/api/auth",authRoute)
// app.use("/api/mechanic",mechanicRoute)
// app.use("/api/admin",adminRoute)
// app.use("/api/user",userRoute)


// app.use(notFound)
// app.use(errorHandler)

// const server = http.createServer(app)
// server.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });


// import express from 'express';
// import http from 'http';
// import { connectDB } from '../config/mongoConfig';
// import authRoute from './routes/authRoutes';
// import mechanicRoute from './routes/mechanicRoute';
// import cors from 'cors';
// import session from 'express-session';
// import { v4 as uuidv4 } from 'uuid';
// import { errorHandler, notFound } from './middleware/errorMiddleware';
// import adminRoute from './routes/adminRoutes';
// import cookieParser from 'cookie-parser';
// import userRoute from './routes/userRoutes';
// import { Server as SocketServer } from 'socket.io'; // Import Server class with an alias

// require('dotenv').config();

// // Generate a UUID
// const uuid = uuidv4();
// const app = express();
// const port = 5000;

// // Connect to the database
// connectDB();

// // Middlewares
// app.use(
//   session({
//     secret: uuid,
//     resave: false,
//     saveUninitialized: true,
//     cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 1 day in milliseconds
//   })
// );
// app.use(cookieParser());
// app.use(express.json());

// app.use(
//   cors({
//     origin: ['http://localhost:5173'],
//     methods: ['GET', 'PUT', 'PATCH', 'POST', 'DELETE'],
//     credentials: true,
//   })
// );

// // Routes
// app.use('/api/auth', authRoute);
// app.use('/api/mechanic', mechanicRoute);
// app.use('/api/admin', adminRoute);
// app.use('/api/user', userRoute);

// app.use(notFound);
// app.use(errorHandler);

// const server = http.createServer(app);
// server.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });

// // Set up socket.io
// const io = new SocketServer(server, {
//   pingTimeout: 60000,
//   cors: {
//     origin: 'http://localhost:5173',
//   },
// });

// io.on('connection', (socket) => {
//   console.log('connected to socket.io');

//   socket.on("setup", (userData) => {
//     socket.join(userData.userId);
//     console.log(userData.userId);
//     socket.emit("connected");
//   });

//   socket.on("join chat", (room) => {
//     socket.join(room);
//     console.log("user Joined Room: " + room);
//   });

//   socket.on("typing", (room) => socket.in(room).emit("typing"));
//   socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

//   socket.on("new message", (newMessageRecieved) => {
//     var chat = newMessageRecieved.chat;

//     if (!chat.users) return console.log("chat.users not defined");

//     chat.users.forEach((user) => {
//       if (user._id == newMessageRecieved.sender._id) return;

//       socket.in(user._id).emit("message recieved", newMessageRecieved);
//     });
    
//   });
//   socket.off("setup", () => {
//     console.log("USER DISCONNECTED");
//     socket.leave(userData.userId);
//   });


// });

  

import express from 'express';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import { connectDB } from '../config/mongoConfig';
import authRoute from './routes/authRoutes';
import mechanicRoute from './routes/mechanicRoute';
import adminRoute from './routes/adminRoutes';
import userRoute from './routes/userRoutes';
import cors from 'cors';
import session from 'express-session';
import { v4 as uuidv4 } from 'uuid';
import { errorHandler, notFound } from './middleware/errorMiddleware';
import cookieParser from 'cookie-parser';
import bodyParser from "body-parser"


require('dotenv').config();

const app = express();
const port = 5000;

connectDB();

app.use(
  session({
    secret: uuidv4(),
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }, 
  })
);

app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: ['http://localhost:5173'],
    methods: ['GET', 'PUT', 'PATCH', 'POST', 'DELETE'],
    credentials: true,
  })
);

// Routes
app.use('/api/auth', authRoute);
app.use('/api/mechanic', mechanicRoute);
app.use('/api/admin', adminRoute);
app.use('/api/user', userRoute);

app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);

// Set up socket.io
const io = new SocketServer(server, {
  pingTimeout: 60000,
  cors: {
    origin: 'http://localhost:5173',
  },
});

io.on('connection', (socket) => {
  console.log('Connected to socket.io');

  socket.on("setup", (userData) => {
    socket.join(userData.userId);
    console.log(`User joined: ${userData.userId}`);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log(`User joined room: ${room}`);
  });

  socket.on("typing", (room) => {
    socket.in(room).emit("typing");
  });

  socket.on("stop typing", (room) => {
    socket.in(room).emit("stop typing");
  });

  socket.on("new message", (newMessageReceived) => {
    const chat = newMessageReceived.chat;

    if (!chat.users) {
      console.log("chat.users not defined");
      return;
    }

    chat.users.forEach((user: { _id: string | string[]; }) => {
      if (user._id === newMessageReceived.sender._id) return;

      socket.in(user._id).emit("message received", newMessageReceived);
    });
  });

  socket.on("disconnect", () => {
    console.log("USER DISCONNECTED");
    // You might want to handle any cleanup or status updates here
  });
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});