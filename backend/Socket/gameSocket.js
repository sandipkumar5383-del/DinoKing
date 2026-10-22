
const GameRoom = require("../Models/GameRoomModel");
const GameSession = require("../Models/GameSessionModel");
const Score = require("../Models/ScoreModel");
const crypto = require("crypto");

module.exports = (io) => {
    // Runtime game state is stored by room code.
    const activeRooms = new Map();

    const sendReply = (callback, data) => {
        if (typeof callback === "function") {
            callback(data);
        }
    };

    const normalizeCode = (code) =>
        typeof code === "string" ? code.trim().toUpperCase() : "";

    const createRuntimeRoom = (roomCode) => ({
        players: new Map(),
        sessionId: null,
        gameOver: false
    });

    const syncRuntimePlayers = (roomCode, room) => {
        let runtime = activeRooms.get(roomCode);

        if (!runtime) {
            runtime = createRuntimeRoom(roomCode);
            activeRooms.set(roomCode, runtime);
        }

        for (const player of room.players) {
            const exists = [...runtime.players.values()].some(
                (p) => p.playerId === player.playerId
            );

            if (!exists) {
                runtime.players.set(`stored-${player.playerId}`, {
                    playerId: player.playerId,
                    name: player.name,
                    color: player.color,
                    score: player.score || 0,
                    x: 80,
                    y: 0,
                    jumping: false,
                    alive: player.status !== "Dead"
                });
            }
        }

        return runtime;
    };

    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);

        // CREATE ROOM
        socket.on("createRoom", async (data, callback) => {
            try {
                console.log("CREATE ROOM REQUEST:", data);

                const { playerId, name, color, roomName } = data || {};

                if (!playerId || !name) {
                    return sendReply(callback, {
                        success: false,
                        message: "Player ID and name are required."
                    });
                }

                const roomCode = crypto
                    .randomBytes(4)
                    .toString("hex")
                    .substring(0, 6)
                    .toUpperCase();

                const room = await GameRoom.create({
                    roomName: roomName?.trim() || `${name}'s Room`,
                    roomCode,
                    ownerPlayerId: playerId,
                    players: [
                        {
                            playerId,
                            name,
                            color: color || "#69db7c",
                            score: 0,
                            status: "Ready"
                        }
                    ],
                    status: "lobby"
                });

                socket.data.playerId = playerId;
                socket.data.playerName = name;
                socket.data.roomCode = roomCode;

                await socket.join(roomCode);

                const runtime = createRuntimeRoom(roomCode);

                runtime.players.set(socket.id, {
                    playerId,
                    name,
                    color: color || "#69db7c",
                    score: 0,
                    x: 80,
                    y: 0,
                    jumping: false,
                    alive: true
                });

                activeRooms.set(roomCode, runtime);

                console.log("ROOM CREATED:", roomCode);

                sendReply(callback, {
                    success: true,
                    roomCode,
                    room
                });

                io.to(roomCode).emit("roomUpdated", room);
            } catch (error) {
                console.error("CREATE ROOM ERROR:", error);

                sendReply(callback, {
                    success: false,
                    message: error.message || "Failed to create room."
                });
            }
        });

        // JOIN ROOM
        socket.on("joinRoom", async (data, callback) => {
            try {
                const { roomCode, playerId, name, color } = data || {};
                const code = normalizeCode(roomCode);

                if (!code || !playerId || !name) {
                    return sendReply(callback, {
                        success: false,
                        message: "Room code, player ID and name are required."
                    });
                }

                const room = await GameRoom.findOne({ roomCode: code });

                if (!room) {
                    return sendReply(callback, {
                        success: false,
                        message: "Room not found."
                    });
                }

                if (room.status !== "lobby") {
                    return sendReply(callback, {
                        success: false,
                        message: "This game has already started."
                    });
                }

                const existingPlayer = room.players.find(
                    (p) => p.playerId === playerId
                );

                if (!existingPlayer) {
                    room.players.push({
                        playerId,
                        name,
                        color: color || "#69db7c",
                        score: 0,
                        status: "Ready"
                    });

                    await room.save();
                }

                socket.data.playerId = playerId;
                socket.data.playerName = name;
                socket.data.roomCode = code;

                await socket.join(code);

                const runtime = syncRuntimePlayers(code, room);

                // Replace any stored placeholder with the connected socket.
                for (const [key, player] of runtime.players.entries()) {
                    if (
                        key !== socket.id &&
                        player.playerId === playerId
                    ) {
                        runtime.players.delete(key);
                    }
                }

                runtime.players.set(socket.id, {
                    playerId,
                    name,
                    color: color || "#69db7c",
                    score: existingPlayer?.score || 0,
                    x: 80,
                    y: 0,
                    jumping: false,
                    alive: true
                });

                console.log(`${name} joined room ${code}`);

                sendReply(callback, {
                    success: true,
                    roomCode: code,
                    room
                });

                io.to(code).emit("roomUpdated", room);
            } catch (error) {
                console.error("JOIN ROOM ERROR:", error);

                sendReply(callback, {
                    success: false,
                    message: error.message || "Unable to join room."
                });
            }
        });

        // START GAME - ROOM OWNER ONLY
      

socket.on("startGame", ({ roomCode } = {}, callback) => {
    const reply = (result) => {
        if (typeof callback === "function") {
            callback(result);
        }
    };

    try {
        const code = roomCode?.trim().toUpperCase();
        const room = activeRooms.get(code);

        console.log("START GAME REQUEST:", code);
        console.log("ROOM FOUND:", Boolean(room));

        if (!room) {
            reply({
                success: false,
                message: "Room not found. Create a new room."
            });
            return;
        }

        if (room.gameOver) {
            reply({
                success: false,
                message: "This game has finished. Create a new room."
            });
            return;
        }

        // Allow the owner to continue to the game if it already started.
        if (room.started) {
            reply({
                success: true,
                roomCode: code
            });
            return;
        }

        room.started = true;

        io.to(code).emit("gameStarted", {
            roomCode: code
        });

        reply({
            success: true,
            roomCode: code
        });

        console.log("GAME START ACKNOWLEDGED:", code);
    } catch (error) {
        console.error("START GAME ERROR:", error);

        reply({
            success: false,
            message: "Unable to start the game."
        });
    }
});


        // PLAYER MOVEMENT
        socket.on("playerMove", (data) => {
            const code = normalizeCode(data?.roomCode);
            const runtime = activeRooms.get(code);
            const player = runtime?.players.get(socket.id);

            if (!player || !player.alive || runtime.gameOver) {
                return;
            }

            const { x, y, jumping } = data;

            if (Number.isFinite(x)) player.x = x;
            if (Number.isFinite(y)) player.y = y;

            player.jumping = Boolean(jumping);

            socket.to(code).emit("playerMoved", {
                playerId: player.playerId,
                x: player.x,
                y: player.y,
                jumping: player.jumping
            });
        });

        // UPDATE SCORE
        socket.on("updateScore", async (data, callback) => {
            try {
                const code = normalizeCode(data?.roomCode);
                const runtime = activeRooms.get(code);
                const player = runtime?.players.get(socket.id);

                if (!player || runtime.gameOver) {
                    return sendReply(callback, {
                        success: false,
                        message: "Player is not in an active game."
                    });
                }

                if (
                    typeof data.score !== "number" ||
                    !Number.isFinite(data.score) ||
                    data.score < 0
                ) {
                    return sendReply(callback, {
                        success: false,
                        message: "Invalid score."
                    });
                }

                player.score = Math.max(
                    player.score,
                    Math.floor(data.score)
                );

                sendReply(callback, {
                    success: true,
                    score: player.score
                });

                io.to(code).emit("scoreUpdated", {
                    playerId: player.playerId,
                    score: player.score
                });
            } catch (error) {
                console.error("UPDATE SCORE ERROR:", error);

                sendReply(callback, {
                    success: false,
                    message: error.message || "Unable to update score."
                });
            }
        });
        
const handlePlayAgain = () => {
  if (!socket || !roomCode) {
    console.error("Socket connection or room code is missing.");
    setScreen("menu");
    return;
  }
};

 socket.on("resetGame", async ({ roomCode } = {}, callback) => {
    console.log("RESET GAME REQUEST RECEIVED:", roomCode);

    try {
        const code = String(roomCode || "").trim().toUpperCase();
        const runtime = activeRooms.get(code);

        if (!runtime) {
            return callback?.({
                success: false,
                message: "Room not found."
            });
        }

        runtime.started = false;
        runtime.gameOver = false;
        runtime.sessionId = null;

        runtime.players.forEach((player) => {
            player.score = 0;
        });

        const room = await GameRoom.findOne({ roomCode: code });

        if (room) {
            room.status = "lobby";

            room.players.forEach((player) => {
                player.score = 0;
                player.status = "Ready";
            });

            await room.save();
            io.to(code).emit("roomUpdated", room.toObject());
        }

        console.log("RESET GAME SUCCESS:", code);
        callback?.({ success: true });
    } catch (error) {
        console.error("RESET GAME ERROR:", error);
        callback?.({
            success: false,
            message: error.message
        });
    }
});

        // GAME OVER - FINISH ROOM SESSION
        socket.on("gameOver", async (data, callback) => {
            try {
                const code = normalizeCode(data?.roomCode);
                const runtime = activeRooms.get(code);

                if (!runtime) {
                    return sendReply(callback, {
                        success: false,
                        message: "Room not found."
                    });
                }

                if (runtime.gameOver) {
                    return sendReply(callback, {
                        success: true,
                        message: "Game already finished."
                    });
                }

                if (!runtime.players.has(socket.id)) {
                    return sendReply(callback, {
                        success: false,
                        message: "Player is not in this room."
                    });
                }

                // This implementation ends the whole room session.
                const players = [...runtime.players.values()].sort(
                    (a, b) => b.score - a.score
                );

                const results = players.map((player, index) => ({
                    playerId: player.playerId,
                    playerName: player.name,
                    score: player.score,
                    rank: index + 1
                }));

                // Persist results before marking the room finished.
                
const scoreDocuments = results.map((result) => ({
    roomCode: code,
    sessionId: runtime.sessionId || undefined,
    playerId: result.playerId,
    playerName: result.playerName,
    score: Number(result.score) || 0,
    rank: result.rank
}));

// Save scores even if a session ID was not created.
await Score.insertMany(scoreDocuments);

if (runtime.sessionId) {
    await GameSession.findByIdAndUpdate(
        runtime.sessionId,
        {
            endedAt: new Date(),
            status: "finished"
        }
    );
}


                const room = await GameRoom.findOne({ roomCode: code });

                if (room) {
                    room.status = "finished";

                    room.players.forEach((dbPlayer) => {
                        const result = results.find(
                            (item) => item.playerId === dbPlayer.playerId
                        );

                        if (result) dbPlayer.score = result.score;

                        // GameRoomModel only allows Ready, Playing, Dead.
                        // Do not assign an unsupported "Finished" status.
                    });

                    await room.save();
                }

                runtime.gameOver = true;

                io.to(code).emit("gameFinished", {
                    roomCode: code,
                    players: results
                });

                sendReply(callback, {
                    success: true,
                    players: results
                });
            } catch (error) {
                console.error("GAME OVER ERROR:", error);

                sendReply(callback, {
                    success: false,
                    message: error.message || "Unable to finish game."
                });
            }
        });

        // LEAVE ROOM
        socket.on("leaveRoom", async (data, callback) => {
            try {
                const code = normalizeCode(
                    data?.roomCode || socket.data.roomCode
                );

                const playerId = data?.playerId || socket.data.playerId;

                if (!code) {
                    return sendReply(callback, {
                        success: false,
                        message: "Room code is required."
                    });
                }

                const runtime = activeRooms.get(code);

                socket.leave(code);

                if (runtime) {
                    runtime.players.delete(socket.id);
                }

                const room = await GameRoom.findOne({ roomCode: code });

                if (room && playerId) {
                    room.players = room.players.filter(
                        (player) => player.playerId !== playerId
                    );

                    if (room.players.length === 0) {
                        await GameRoom.deleteOne({ roomCode: code });
                        activeRooms.delete(code);

                        io.to(code).emit("roomClosed", {
                            roomCode: code,
                            message: "Room is empty."
                        });
                    } else {
                        if (room.ownerPlayerId === playerId) {
                            room.ownerPlayerId = room.players[0].playerId;
                        }

                        await room.save();
                        io.to(code).emit("roomUpdated", room);
                    }
                }

                if (runtime && runtime.players.size === 0) {
                    activeRooms.delete(code);
                }

                socket.data.roomCode = null;

                sendReply(callback, { success: true });
            } catch (error) {
                console.error("LEAVE ROOM ERROR:", error);

                sendReply(callback, {
                    success: false,
                    message: error.message || "Unable to leave room."
                });
            }
        });

        // DISCONNECT
        socket.on("disconnect", () => {
            console.log("Player disconnected:", socket.id);

            const code = socket.data.roomCode;

            if (!code) return;

            const runtime = activeRooms.get(code);
            if (!runtime) return;

            const player = runtime.players.get(socket.id);

            if (player) {
                runtime.players.delete(socket.id);

                io.to(code).emit("playerDisconnected", {
                    playerId: player.playerId
                });
            }

            if (runtime.players.size === 0) {
                activeRooms.delete(code);
            }
        });
    });
};

