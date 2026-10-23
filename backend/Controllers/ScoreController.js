
const ScoreModel = require("../Models/ScoreModel");

// Get global leaderboard
exports.getLeaderboard = async (req, res) => {
    try {
        const scores = await ScoreModel.find()
            .sort({ score: -1, createdAt: 1 })
            .limit(100)
            .lean();

        res.status(200).json({
            success: true,
            count: scores.length,
            scores: scores.map((item) => ({
                ...item,
                character: item.character || "🦖",
                color: item.color || "#69db7c",
                status: item.status || "Dead"
            }))
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
        const roomCode = req.params.roomCode.toUpperCase();

        const scores = await ScoreModel.find({ roomCode })
            .sort({ score: -1, createdAt: 1 })
            .lean();

        res.status(200).json({
            success: true,
            count: scores.length,
            scores: scores.map((item) => ({
                ...item,
                character: item.character || "🦖",
                color: item.color || "#69db7c",
                status: item.status || "Dead"
            }))
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
        })
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            count: scores.length,
            scores: scores.map((item) => ({
                ...item,
                character: item.character || "🦖",
                color: item.color || "#69db7c",
                status: item.status || "Dead"
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
