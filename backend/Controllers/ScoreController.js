const ScoreModel = require("../Models/ScoreModel");

// Get global leaderboard
exports.getLeaderboard = async (req, res) => {
    try {
        const scores = await ScoreModel.find()
            .sort({ score: -1, createdAt: 1 })
            .limit(100);

        res.status(200).json({
            success: true,
            count: scores.length,
            scores
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get scores for a specific room
exports.getRoomScores = async (req, res) => {
    try {
        const scores = await ScoreModel.find({
            roomCode: req.params.roomCode.toUpperCase()
        }).sort({ score: -1, createdAt: 1 });

        res.status(200).json({
            success: true,
            count: scores.length,
            scores
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get scores for a specific player
exports.getPlayerScores = async (req, res) => {
    try {
        const scores = await ScoreModel.find({
            playerId: req.params.playerId
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: scores.length,
            scores
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};