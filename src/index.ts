import express from 'express';
import http from 'http';
import { connectDB } from './config/mongoConfig';
import authRoute from './routes/authRoutes';
import mechanicRoute from './routes/mechanicRoute';
import adminRoute from './routes/adminRoutes';
import userRoute from './routes/userRoutes';
import cors from 'cors';
import session from 'express-session';
import { v4 as uuidv4 } from 'uuid';
import { errorHandler, notFound } from './middleware/errorMiddleware';
import cookieParser from 'cookie-parser';
import bodyParser from "body-parser";
import { setupSocket } from './utils/socketLogic';

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
setupSocket(server);

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});