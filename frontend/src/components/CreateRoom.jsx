
import { useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:8000";

function CreateRoom({ player, onRoomCreated, onBack }) {
    const [roomName, setRoomName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleCreateRoom = () => {
        if (loading) return;

        if (!player?.playerId || !player?.playerName) {
            setError("Player information is missing. Please start again.");
            return;
        }

        setLoading(true);
        setError("");

        const socket = io(SOCKET_URL, {
            timeout: 5000,
            reconnection: false,
        });

        let finished = false;

        const finishWithError = (message) => {
            if (finished) return;
            finished = true;
            setLoading(false);
            setError(message);
            socket.disconnect();
        };

        socket.on("connect", () => {
            socket.emit(
                "createRoom",
                {
                    playerId: player.playerId,
                    name: player.playerName,
                    color: player.color || "#69db7c",
                    roomName:
                        roomName.trim() ||
                        `${player.playerName}'s Room`,
                },
                (response) => {
                    if (finished) return;

                    if (!response?.success) {
                        finishWithError(
                            response?.message ||
                            "Room creation failed. Check the backend."
                        );
                        return;
                    }

                    finished = true;
                    setLoading(false);

                    onRoomCreated({
                        roomCode: response.roomCode,
                        room: response.room,
                        player,
                        socket,
                    });
                }
            );

            // Prevent the button from spinning forever if
            // the server never acknowledges createRoom.
            setTimeout(() => {
                if (!finished) {
                    finishWithError(
                        "Server did not respond. Check the createRoom handler."
                    );
                }
            }, 10000);
        });

        socket.on("connect_error", () => {
            finishWithError(
                "Cannot connect to the server. Make sure the backend runs on port 8000."
            );
        });

        socket.on("disconnect", () => {
            if (!finished && loading) {
                finishWithError("Server disconnected. Please try again.");
            }
        });
    };

    return (
        <div className="create-room">
            <div className="room-card">
                <button
                    type="button"
                    className="back-button"
                    onClick={onBack}
                    disabled={loading}
                >
                    ← Back
                </button>

                <div className="room-icon">🏠</div>

                <p className="eyebrow">MULTIPLAYER</p>
                <h1>Create a Room</h1>

                <p className="room-description">
                    Hello, {player?.playerName || "Player"}!
                    Create a room and invite your friends.
                </p>

                <label htmlFor="roomName">Room Name</label>

                <input
                    id="roomName"
                    type="text"
                    placeholder="Enter room name (optional)"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    maxLength={30}
                    disabled={loading}
                />

                {error && (
                    <p className="error-message">{error}</p>
                )}

                <button
                    type="button"
                    className="play-button"
                    onClick={handleCreateRoom}
                    disabled={loading}
                >
                    {loading ? "CREATING ROOM..." : "CREATE ROOM →"}
                </button>
            </div>
        </div>
    );
}

export default CreateRoom;
