const express = require("express");
const router = express.Router();

const UserController = require("../Controllers/UserController");

router.post("/createUser", UserController.createUser);
router.get("/allUsers", UserController.getAllUsers);
router.get("/user/:playerId", UserController.getUserById);

module.exports = router;