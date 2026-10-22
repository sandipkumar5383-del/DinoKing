
const Score = require("../Models/ScoreModel");

exports.getLeaderboard = async (req, res) => {
    try {
        const scores = await Score.find({})
            .sort({ score: -1 })
            .limit(50)
            .lean();

        res.status(200).json(scores);
    } catch (error) {
        console.error("Leaderboard error:", error);

        res.status(500).json({
            message: "Failed to load leaderboard"
        });
    }
};
