const express = require('express');
const authRouter = require("./routes/auth.routes.js")
const accountRouter = require("./routes/account.routes.js")
const transactionRouter = require("./routes/transaction.routes.js")
const cookie_parser = require("cookie-parser")


const app = express();
app.use(express.json())

app.get('/', (req, res) => {
    res.send("YOOOOOOOOOOOOOOOOHHHHHHHHHOOOOOOOOOOOOOOOOOO")
})



// routes
app.use("/api/auth", authRouter)
app.use("/api/account", accountRouter)
app.use("/api/transactions",transactionRouter)




app.use(cookie_parser())


module.exports = app;