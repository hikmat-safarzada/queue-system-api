const express = require("express");
const {
    createUser, getWaitingUsers, getUser,
    deleteUser, nextUser } = require("../controller/queue.controller");
const router = express.Router();

router.post("/", createUser);
router.get("/", getWaitingUsers);
router.get("/:id", getUser);
router.delete("/:id", deleteUser);
router.post("/next", nextUser)

module.exports = router