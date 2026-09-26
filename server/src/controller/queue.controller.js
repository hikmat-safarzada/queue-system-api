const User = require("../models/User")
const createUser = async (req, res) => {
    try {
        const { name } = req.body
        const user = await User.create({
            name
        });
        res.status(200).json({ user })
    } catch (err) {
        res.status(500).json({
            message: err.message
        })
    }
}

const getWaitingUsers = async (req, res) => {
    try {
        const users = await User.find({
            status: "Waiting"
        }).sort({
            createdAt: 1
        });
        res.status(200).json({
            message: "Waiting Users",
            users
        })
    } catch (err) {
        res.status(500).json({
            message: err.message
        })
    }
}

const getUser = async (req, res) => {
    try {
        const {id} = req.params;
        const user = await User.findOne({_id: id})
        if(!user){
            res.status(404).json({
                message: "User Not Found"
            })
        }
        res.status(200).json({user})
    } catch (err) {
        res.status(500).json({
            message: err.message
        })
    }
}

const deleteUser = async (req, res) => {
    try {
        const {id} = req.params;
        const user = await User.findOneAndDelete({
            _id: id,
            status: "Waiting"
        })
        if (!user) {
            res.status(404).json({
                message: "User Not Found by given Id!"
            })
        }
        res.status(200).json({
            message: "User deleted successfully"
        })
    } catch (err) {
        res.status(500).json({
            message: err.message
        })
    }
}

const nextUser = async (req, res) => {
    try {
        const user = await User.findOneAndUpdate(
            {
                status: "Waiting"
            },
            {
                status: "Serving"
            },
            {
                sort: {createdAt : 1},
                new: true
            }
        )
        if(!user){
            res.status(404).json({
                message: "No customers waiting in queue"
            })
        }
        res.status(200).json({user})
    } catch (err) {
        res.status(500).json({
            message: err.message
        })
    }
}

module.exports = { createUser, getWaitingUsers, getUser, deleteUser, nextUser }