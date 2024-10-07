"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const mongoConfig_1 = require("./config/mongoConfig");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const mechanicRoute_1 = __importDefault(require("./routes/mechanicRoute"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const cors_1 = __importDefault(require("cors"));
const express_session_1 = __importDefault(require("express-session"));
const uuid_1 = require("uuid");
const errorMiddleware_1 = require("./middleware/errorMiddleware");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const body_parser_1 = __importDefault(require("body-parser"));
const socketLogic_1 = require("./utils/socketLogic");
require('dotenv').config();
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
(0, mongoConfig_1.connectDB)();
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || (0, uuid_1.v4)(),
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
}));
app.use(body_parser_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
const corsOptions = {
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "Origin,X-Requested-With,Content-Type,Accept,Authorization,Course-Id",
    optionsSuccessStatus: 200,
};
app.use('*', (0, cors_1.default)(corsOptions));
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    next();
});
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/mechanic', mechanicRoute_1.default);
app.use('/api/admin', adminRoutes_1.default);
app.use('/api/user', userRoutes_1.default);
app.use(errorMiddleware_1.notFound);
app.use(errorMiddleware_1.errorHandler);
const server = http_1.default.createServer(app);
// Set up socket.io
(0, socketLogic_1.setupSocket)(server);
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
