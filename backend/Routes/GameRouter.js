const express = require("express");
const router = express.Router();

const GameController = require("../Controllers/GameController");

router.get("/allRooms", GameController.getAllRooms);
router.get("/room/:code", GameController.getRoomByCode);

module.exports = router;