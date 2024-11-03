import express from 'express';
require('dotenv').config();
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
import bodyParser from 'body-parser';
import { setupSocket } from './utils/socketLogic';
import helmet from 'helmet';


const app = express();
const port = process.env.PORT || 5002;



app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

connectDB();

app.use(
  session({
    secret: process.env.SESSION_SECRET || uuidv4(),
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
  })
);




app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "https://quick-fix-auto-frontend.vercel.app",
    methods: ["GET", "PUT", "PATCH", "POST", "DELETE"],
    credentials: true,
  })
);


app.use(helmet());


// Routes
app.get("/", (req, res) => {
  res.send("Welcome to the API");
});

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
