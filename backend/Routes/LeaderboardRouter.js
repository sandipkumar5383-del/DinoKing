
const express = require("express");
const router = express.Router();

const LeaderboardController = require(
    "../Controllers/LeaderboardController"
);

router.get("/", LeaderboardController.getLeaderboard);

module.exports = router;
