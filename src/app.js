const express = require('express');
const cors = require('cors');
const path = require("path");
const authRouter = require("./routes/auth.routes.js");
const accountRouter = require("./routes/account.routes.js");
const transactionRouter = require("./routes/transaction.routes.js");
const analyticRoutes = require('./routes/analytics.routes.js')
const cookie_parser = require("cookie-parser");

const app = express();

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:8000',
    ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : [])
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        return callback(null, false);
    },
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
app.use("/api/analytics", analyticRoutes);

const frontendDistPath = path.join(__dirname, "../Frontend/dist");
app.use(express.static(frontendDistPath));

// SPA fallback compatible with Express 5
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
        return res.sendFile(path.join(frontendDistPath, 'index.html'));
    }
    next();
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    if (res.headersSent) {
        return next(err);
    }
    res.status(err.status || 500).json({
        message: err.message || "Internal Server Error"
    });
});

module.exports = app;
