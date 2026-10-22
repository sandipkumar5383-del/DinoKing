
import { useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:8000";

function JoinRoom({ player, onRoomJoined, onBack }) {
    const [roomCode, setRoomCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleJoinRoom = () => {
        if (!player?.playerId || !player?.playerName) {
            setError("Player information is missing. Please start again.");
            return;
        }

        const code = roomCode.trim().toUpperCase();

        if (!code) {
            setError("Please enter a room code.");
            return;
        }

        setLoading(true);
        setError("");

        const socket = io(SOCKET_URL);

        socket.on("connect", () => {
            socket.emit(
                "joinRoom",
                {
                    roomCode: code,
                    playerId: player.playerId,
                    name: player.playerName,
                    color: player.color || "#69db7c"
                },
                (response) => {
                    setLoading(false);

                    if (response?.success) {
                        onRoomJoined({
                            roomCode: code,
                            room: response.room,
                            player,
                            socket
                        });
                    } else {
                        setError(response?.message || "Unable to join room.");
                        socket.disconnect();
                    }
                }
            );
        });

        socket.on("connect_error", () => {
            setLoading(false);
            setError("Cannot connect to the server. Check that it is running.");
            socket.disconnect();
        });
    };

    return (
        <div className="join-room">
            <div className="room-card">
                <button
                    type="button"
                    className="back-button"
                    onClick={onBack}
                    disabled={loading}
                >
                    ← Back
                </button>

                <div className="room-icon">🚪</div>

                <p className="eyebrow">JOIN YOUR FRIENDS</p>
                <h1>Join a Room</h1>

                <p className="room-description">
                    Enter the room code shared by your friend.
                </p>

                <label htmlFor="roomCode">Room Code</label>

                <input
                    id="roomCode"
                    type="text"
                    placeholder="Example: ABC123"
                    value={roomCode}
                    onChange={(e) =>
                        setRoomCode(
                            e.target.value
                                .toUpperCase()
                                .replace(/[^A-Z0-9]/g, "")
                                .slice(0, 6)
                        )
                    }
                    maxLength={6}
                    autoComplete="off"
                    disabled={loading}
                />

                {error && (
                    <p className="error-message" role="alert">
                        {error}
                    </p>
                )}

                <button
                    type="button"
                    className="play-button"
                    onClick={handleJoinRoom}
                    disabled={loading || roomCode.trim().length === 0}
                >
                    {loading ? "JOINING ROOM..." : "JOIN GAME →"}
                </button>
            </div>
        </div>
    );
}

export default JoinRoom;
