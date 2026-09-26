const mongoose = require("mongoose");
const { config } = require("./config");

const dbConnection = async () => {
    const connection = await mongoose.connect(config.mongo_url.replace("<db_password>", config.mongo_pass))
    if(!connection){
        console.log("DB connection failed!")
    }
    console.log("DB connected successfully!")
}

module.exports = {dbConnection}