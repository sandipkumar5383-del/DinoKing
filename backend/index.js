
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");

const leaderboardRouter = require("./Routes/LeaderboardRouter");


require("dotenv").config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 8000;
const MONGO_URI =
    process.env.MONGO_URI ||
    "mongodb://127.0.0.1:27017/the_dino_king";

app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"]
}));

app.use(express.json());
app.use("/api/leaderboard", leaderboardRouter);


// Initialize Socket.IO
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

// Register game socket handlers
const gameSocket = require("./Socket/gameSocket");
gameSocket(io);

app.get("/", (req, res) => {
    res.send("The Dino King backend is running!");
});

// Connect to MongoDB before starting the server
async function startServer() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("MongoDB connected successfully");

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
}

startServer();
