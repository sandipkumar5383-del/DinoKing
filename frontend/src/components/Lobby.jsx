
import { useEffect, useState } from "react";

function Lobby({ roomCode, room, player, socket, onStartGame, onBack }) {
    const [currentRoom, setCurrentRoom] = useState(room);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const isOwner =
        currentRoom?.ownerPlayerId === player?.playerId;

    useEffect(() => {
        if (!socket) return;

        const handleRoomUpdated = (updatedRoom) => {
            setCurrentRoom(updatedRoom);
        };

        socket.on("roomUpdated", handleRoomUpdated);

        return () => {
            socket.off("roomUpdated", handleRoomUpdated);
        };
    }, [socket]);

    

const handleStartGame = () => {
    if (!socket || !socket.connected || !roomCode) {
        setError("Socket disconnected. Please rejoin the room.");
        return;
    }

    if (loading) return;

    setLoading(true);
    setError("");

    socket.emit("startGame", { roomCode }, (response) => {
        setLoading(false);

        console.log("START GAME RESPONSE:", response);

        if (!response?.success) {
            setError(response?.message || "Unable to start the game.");
            return;
        }

        onStartGame({
            roomCode,
            room: currentRoom,
            player,
            socket
        });
    });
};



    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(roomCode);
            alert("Room code copied!");
        } catch {
            setError("Unable to copy the code. Please copy it manually.");
        }
    };

    const players = currentRoom?.players || [];

    return (
        <div className="lobby">
            <div className="lobby-card">
                <button
                    type="button"
                    className="back-button"
                    onClick={onBack}
                >
                    ← Leave Lobby
                </button>

                <p className="eyebrow">MULTIPLAYER LOBBY</p>
                <h1>Ready to Run?</h1>

                <div className="room-code-box">
                    <span>ROOM CODE</span>
                    <strong>{roomCode}</strong>

                    <button
                        type="button"
                        className="copy-button"
                        onClick={handleCopyCode}
                    >
                        Copy Code
                    </button>
                </div>

                <div className="lobby-players-heading">
                    <h2>Players</h2>
                    <span>{players.length} joined</span>
                </div>

                <div className="lobby-player-list">
                    {players.length === 0 ? (
                        <p>Waiting for players...</p>
                    ) : (
                        players.map((item) => (
                            <div
                                className="lobby-player"
                                key={item.playerId}
                            >
                                <div
                                    className="lobby-player-avatar"
                                    style={{
                                        color: item.color || "#69db7c"
                                    }}
                                >
                                    🦖
                                </div>

                                <div className="lobby-player-info">
                                    <strong>{item.name}</strong>
                                    <small>
                                        {item.playerId ===
                                        currentRoom?.ownerPlayerId
                                            ? "Room Owner"
                                            : "Player"}
                                    </small>
                                </div>

                                <span className="player-ready">
                                    ● Ready
                                </span>
                            </div>
                        ))
                    )}
                </div>

                {error && (
                    <p className="error-message" role="alert">
                        {error}
                    </p>
                )}

                {isOwner ? (
                    <button
                        type="button"
                        className="play-button"
                        onClick={handleStartGame}
                        disabled={loading || players.length === 0}
                    >
                        {loading ? "STARTING..." : "START GAME →"}
                    </button>
                ) : (
                    <p className="waiting-message">
                        Waiting for the room owner to start the game...
                    </p>
                )}

                <p className="lobby-tip">
                    💡 Share the room code with your friends to invite them.
                </p>
            </div>
        </div>
    );
}

export default Lobby;
