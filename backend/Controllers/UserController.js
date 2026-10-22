const UserModel = require("../Models/UserModel");

// Create player
exports.createUser = async (req, res) => {
    try {
        const { playerId, name, preferredColor } = req.body;

        if (!playerId || !name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Player ID and name are required"
            });
        }

        const existingUser = await UserModel.findOne({ playerId });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Player ID already exists"
            });
        }

        const user = await UserModel.create({
            playerId,
            name: name.trim(),
            preferredColor
        });

        res.status(201).json({
            success: true,
            message: "Player created successfully",
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all players
exports.getAllUsers = async (req, res) => {
    try {
        const users = await UserModel.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get player by player ID
exports.getUserById = async (req, res) => {
    try {
        const user = await UserModel.findOne({
            playerId: req.params.playerId
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Player not found"
            });
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};