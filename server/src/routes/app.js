const express = require("express")
const app = express();
const queueRouter = require("./queue.route")
const userRouter = require("./user.route")
app.use(express.json())
app.use("/api/queue", queueRouter)
app.use("/api/users", userRouter)
module.exports = app