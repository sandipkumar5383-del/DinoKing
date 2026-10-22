const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
        playerId: {
            type: String,
            required: true,
            unique: true
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 20
        },
        preferredColor: {
            type: String,
            default: "#69db7c"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", UserSchema);