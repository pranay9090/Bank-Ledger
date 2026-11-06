const express = require('express');
const cors = require('cors');
const path = require("path");
const authRouter = require("./routes/auth.routes.js");
const accountRouter = require("./routes/account.routes.js");
const transactionRouter = require("./routes/transaction.routes.js");
const cookie_parser = require("cookie-parser");

const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(cookie_parser());

// routes
app.use("/api/auth", authRouter);
app.use("/api/account", accountRouter);
app.use("/api/transactions", transactionRouter);

const frontendDistPath = path.join(__dirname, "../Frontend/dist");
app.use(express.static(frontendDistPath));

// SPA fallback compatible with Express 5
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
        return res.sendFile(path.join(frontendDistPath, 'index.html'));
    }
    next();
});

module.exports = app;
