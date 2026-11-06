const express = require('express');
const cors = require('cors');
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

app.get('/', (req, res) => {
    res.send("YOOOOOOOOOOOOOOOOHHHHHHHHHOOOOOOOOOOOOOOOOOO");
});

// routes
app.use("/api/auth", authRouter);
app.use("/api/account", accountRouter);
app.use("/api/transactions", transactionRouter);

module.exports = app;
