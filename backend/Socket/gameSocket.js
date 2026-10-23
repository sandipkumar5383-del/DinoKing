
const GameRoom = require("../Models/GameRoomModel");
const GameSession = require("../Models/GameSessionModel");
const Score = require("../Models/ScoreModel");
const crypto = require("crypto");

module.exports = (io) => {
    const activeRooms = new Map();

    const sendReply = (callback, data) => {
        if (typeof callback === "function") {
            callback(data);
        }
    };

    const normalizeCode = (code) =>
        typeof code === "string" ? code.trim().toUpperCase() : "";

    const createRuntimeRoom = (roomCode) => ({
        roomCode,
        players: new Map(),
        sessionId: null,
        gameOver: false,
        started: false
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
                    character: player.character || "🦖",
                    color: player.color || "#69db7c",
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
                const {
                    playerId,
                    name,
                    color,
                    character,
                    roomName
                } = data || {};

                if (!playerId || !name) {
                    return sendReply(callback, {
                        success: false,
                        message: "Player ID and name are required."
                    });
                }

                const selectedCharacter = character || "🦖";
                const selectedColor = color || "#69db7c";

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
                            character: selectedCharacter,
                            color: selectedColor,
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
                    character: selectedCharacter,
                    color: selectedColor,
                    score: 0,
                    x: 80,
                    y: 0,
                    jumping: false,
                    alive: true
                });

                activeRooms.set(roomCode, runtime);

                sendReply(callback, {
                    success: true,
                    roomCode,
                    room
                });

                io.to(roomCode).emit("roomUpdated", room);
                console.log("ROOM CREATED:", roomCode);
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
                const {
                    roomCode,
                    playerId,
                    name,
                    color,
                    character
                } = data || {};

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

                let existingPlayer = room.players.find(
                    (p) => p.playerId === playerId
                );

                const selectedCharacter =
                    character || existingPlayer?.character || "🦖";

                const selectedColor =
                    color || existingPlayer?.color || "#69db7c";

                if (!existingPlayer) {
                    room.players.push({
                        playerId,
                        name,
                        character: selectedCharacter,
                        color: selectedColor,
                        score: 0,
                        status: "Ready"
                    });

                    await room.save();

                    existingPlayer = room.players.find(
                        (p) => p.playerId === playerId
                    );
                } else {
                    // Refresh the saved customization for this player.
                    existingPlayer.name = name;
                    existingPlayer.character = selectedCharacter;
                    existingPlayer.color = selectedColor;
                    await room.save();
                }

                socket.data.playerId = playerId;
                socket.data.playerName = name;
                socket.data.roomCode = code;

                await socket.join(code);

                const runtime = syncRuntimePlayers(code, room);

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
                    character: selectedCharacter,
                    color: selectedColor,
                    score: existingPlayer?.score || 0,
                    x: 80,
                    y: 0,
                    jumping: false,
                    alive: true
                });

                sendReply(callback, {
                    success: true,
                    roomCode: code,
                    room
                });

                io.to(code).emit("roomUpdated", room);
                console.log(`${name} joined room ${code}`);
            } catch (error) {
                console.error("JOIN ROOM ERROR:", error);

                sendReply(callback, {
                    success: false,
                    message: error.message || "Unable to join room."
                });
            }
        });

        // START GAME
        socket.on("startGame", async ({ roomCode } = {}, callback) => {
            try {
                const code = normalizeCode(roomCode);
                const runtime = activeRooms.get(code);

                if (!runtime) {
                    return sendReply(callback, {
                        success: false,
                        message: "Room not found. Create or join a room again."
                    });
                }

                if (runtime.gameOver) {
                    return sendReply(callback, {
                        success: false,
                        message: "This game has finished. Reset the game first."
                    });
                }

                if (runtime.started) {
                    return sendReply(callback, {
                        success: true,
                        roomCode: code
                    });
                }

                runtime.started = true;

                const room = await GameRoom.findOne({ roomCode: code });

                if (room) {
                    room.status = "playing";
                    room.players.forEach((p) => {
                        p.status = "Playing";
                    });
                    await room.save();
                    io.to(code).emit("roomUpdated", room);
                }

                io.to(code).emit("gameStarted", { roomCode: code });

                sendReply(callback, {
                    success: true,
                    roomCode: code
                });

                console.log("GAME STARTED:", code);
            } catch (error) {
                console.error("START GAME ERROR:", error);

                sendReply(callback, {
                    success: false,
                    message: error.message || "Unable to start the game."
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

        // RESET GAME
        socket.on("resetGame", async ({ roomCode } = {}, callback) => {
            try {
                const code = normalizeCode(roomCode);
                const runtime = activeRooms.get(code);

                if (!runtime) {
                    return sendReply(callback, {
                        success: false,
                        message: "Room not found. Create or join the room again."
                    });
                }

                // Reset runtime state without deleting player customizations.
                runtime.started = false;
                runtime.gameOver = false;
                runtime.sessionId = null;

                runtime.players.forEach((player) => {
                    player.score = 0;
                    player.alive = true;
                    player.x = 80;
                    player.y = 0;
                    player.jumping = false;
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

                sendReply(callback, { success: true });
                console.log("RESET GAME SUCCESS:", code);
            } catch (error) {
                console.error("RESET GAME ERROR:", error);

                sendReply(callback, {
                    success: false,
                    message: error.message || "Unable to reset game."
                });
            }
        });

        // GAME OVER
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

                const players = [...runtime.players.values()].sort(
                    (a, b) => b.score - a.score
                );

                const results = players.map((player, index) => ({
                    playerId: player.playerId,
                    playerName: player.name,
                    character: player.character || "🦖",
                    color: player.color || "#69db7c",
                    status: "Dead",
                    score: Number(player.score) || 0,
                    rank: index + 1
                }));

                const scoreDocuments = players.map((player, index) => ({
                    roomCode: code,
                    sessionId: runtime.sessionId || undefined,
                    playerId: player.playerId,
                    playerName: player.name,
                    character: player.character || "🦖",
                    color: player.color || "#69db7c",
                    status: "Dead",
                    score: Number(player.score) || 0,
                    rank: index + 1
                }));

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

                        if (result) {
                            dbPlayer.score = result.score;
                            dbPlayer.status = "Dead";
                        }
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

                console.log("GAME OVER:", code);
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
