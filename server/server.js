const express = require("express");
const dotenv = require("dotenv").config()
const app = require("./src/routes/app")
const {config} = require("./src/config/config")
const {dbConnection} = require("./src/config/database")

dbConnection()
app.listen(config.port, ()=> {
    console.log(`System works at 8080`)
})

