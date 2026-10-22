const mongoose = require("mongoose");

const ScoreSchema = new mongoose.Schema(
    {
        roomCode: {
            type: String,
            required: true,
            index: true
        },
        sessionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "GameSession",
            default: null
        },
        playerId: {
            type: String,
            required: true
        },
        playerName: {
            type: String,
            required: true
        },
        score: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },
        rank: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Score", ScoreSchema);