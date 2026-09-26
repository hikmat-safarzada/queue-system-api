const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["Waiting", "Serving", "Completed"],
        default: "Waiting"
    }
},
{
    timestamps: true
})

module.exports = mongoose.model("User", userSchema, "users");