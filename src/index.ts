import express, { Request, Response, NextFunction } from 'express';
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

require('dotenv').config();

const app = express();
const port = process.env.PORT || 5002; 

connectDB();

app.use(
  session({
    secret: process.env.SESSION_SECRET || uuidv4(),
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }, 
  })
);

const corsOptions = {
  origin: process.env.CORS_ORIGIN || "https://quick-fix-auto-frontend-blue.vercel.app",
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: 'Origin,X-Requested-With,Content-Type,Accept,Authorization',
  optionsSuccessStatus: 200
};

app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(cors(corsOptions));


// app.use('*', cors(corsOptions));

// app.use((req: Request, res: Response, next: NextFunction) => {
//   res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "quick-fix-auto-frontend-blue.vercel.app");
//   res.setHeader(
//       "Access-Control-Allow-Headers",
//       "Origin, X-Requested-With, Content-Type, Accept, Authorization"
//   );
//   res.setHeader(
//       "Access-Control-Allow-Methods",
//       "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS"
//   );
//   res.setHeader("Access-Control-Allow-Credentials", "true");
//   next();
// });

app.options('*', cors(corsOptions));

app.use('/', (req, res) => {
    res.send("hello world....");
})

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
