const express = require("express");
const router = express.Router();

const ScoreController = require("../Controllers/ScoreController");

router.get("/leaderboard", ScoreController.getLeaderboard);
router.get("/roomScores/:roomCode", ScoreController.getRoomScores);
router.get("/playerScores/:playerId", ScoreController.getPlayerScores);

module.exports = router;