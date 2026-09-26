const User = require("../models/User")

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
        res.status(200).json({
            message: "Users",
            users
        })
    } catch (err) {
        res.status(500).json({
            message: err.message
        })
    }
}

module.exports = getAllUsers;