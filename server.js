require("dotenv").config()
const app = require("./src/app.js");
const connectDB = require("./src/config/db.js")



const PORT = 8000;

connectDB()

app.listen(PORT, () => {
    console.log(`Server is listening on PORT:${PORT}`);

})