const mongoose = require("mongoose");

const RoomPlayerSchema = new mongoose.Schema(
    {
        playerId: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        color: {
            type: String,
            default: "#69db7c"
        },
        score: {
            type: Number,
            default: 0,
            min: 0
        },
        status: {
            type: String,
            enum: ["Ready", "Playing", "Dead"],
            default: "Ready"
        }
    },
    { _id: false }
);

const GameRoomSchema = new mongoose.Schema(
    {
        roomName: {
            type: String,
            required: true,
            trim: true
        },
        roomCode: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },
        ownerPlayerId: {
            type: String,
            required: true
        },
        players: {
            type: [RoomPlayerSchema],
            default: []
        },
        status: {
            type: String,
            enum: ["lobby", "playing", "finished"],
            default: "lobby"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("GameRoom", GameRoomSchema);