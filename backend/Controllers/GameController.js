const GameRoomModel = require("../Models/GameRoomModel");

// Get all game rooms
exports.getAllRooms = async (req, res) => {
    try {
        const rooms = await GameRoomModel.find().sort({
            createdAt: -1
        });

        res.status(200).json({
            success: true,
            count: rooms.length,
            rooms
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get room by room code
exports.getRoomByCode = async (req, res) => {
    try {
        const room = await GameRoomModel.findOne({
            roomCode: req.params.code.toUpperCase()
        });

        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Game room not found"
            });
        }

        res.status(200).json({
            success: true,
            room
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};