const mongoose = require("mongoose");

const GameSessionSchema = new mongoose.Schema(
    {
        roomCode: {
            type: String,
            required: true,
            index: true
        },
        startedAt: {
            type: Date,
            default: Date.now
        },
        endedAt: {
            type: Date,
            default: null
        },
        status: {
            type: String,
            enum: ["playing", "finished"],
            default: "playing"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("GameSession", GameSessionSchema);