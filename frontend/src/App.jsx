
import { useState } from "react";

import Settings from "./components/Settings";
import StartMenu from "./components/StartMenu";
import CharacterSelection from "./components/CharacterSelection";
import CreateRoom from "./components/CreateRoom";
import JoinRoom from "./components/JoinRoom";
import Lobby from "./components/Lobby";
import Game from "./components/Game";
import Leaderboard from "./components/Leaderboard";
import GameOver from "./components/GameOver";

function App() {
    const [screen, setScreen] = useState("start");
    const [player, setPlayer] = useState(null);
    const [roomCode, setRoomCode] = useState("");
    const [room, setRoom] = useState(null);
    const [socket, setSocket] = useState(null);
    const [finalScore, setFinalScore] = useState(0);
    const [results, setResults] = useState([]);

    // Start the game
    const handleStart = (playerName) => {
        setPlayer({
            playerId: crypto.randomUUID(),
            playerName,
            character: "🦖",
            color: "#69db7c",
        });

        setScreen("character");
    };

    // Save character selection
    const handleCharacterContinue = (customization) => {
        setPlayer((previous) => ({
            ...previous,
            ...customization,
            playerId: previous.playerId,
        }));

        setScreen("menu");
    };

    // Create room
    const handleRoomCreated = (data) => {
        setRoomCode(data.roomCode);
        setRoom(data.room);
        setSocket(data.socket);
        setScreen("lobby");
    };

    // Join room
    const handleRoomJoined = (data) => {
        setRoomCode(data.roomCode);
        setRoom(data.room);
        setSocket(data.socket);
        setScreen("lobby");
    };

    // Start multiplayer game
    const handleStartGame = () => {
        setScreen("game");
    };

    // Handle game over
    const handleGameOver = (data) => {
        setFinalScore(data.score || 0);
        setResults(data.results || []);
        setScreen("gameover");
    };

    // Play again
    const handlePlayAgain = () => {
        console.log("PLAY AGAIN CLICKED");

        if (!socket?.connected || !roomCode) {
            console.error("Socket or room code missing.");
            return;
        }

        console.log("Sending resetGame:", roomCode);

        socket.timeout(5000).emit(
            "resetGame",
            { roomCode },
            (timeoutError, response) => {
                if (timeoutError) {
                    console.error(
                        "No response from backend for resetGame after 5 seconds."
                    );
                    return;
                }

                console.log("RESET GAME RESPONSE:", response);

                if (!response?.success) {
                    console.error(response?.message || "Reset failed.");
                    return;
                }

                setFinalScore(0);
                setResults([]);
                setScreen("lobby");

                console.log("Returning to lobby:", roomCode);
            }
        );
    };

    // Leave room
    const handleLeaveRoom = () => {
        if (socket && roomCode && player) {
            socket.emit("leaveRoom", {
                roomCode,
                playerId: player.playerId,
            });

            socket.disconnect();
        }

        setSocket(null);
        setRoom(null);
        setRoomCode("");
        setScreen("menu");
    };

    // Return to main menu
    const handleBackToMenu = () => {
        if (socket) {
            socket.disconnect();
        }

        setSocket(null);
        setRoom(null);
        setRoomCode("");
        setFinalScore(0);
        setResults([]);
        setScreen("menu");
    };

    // Save player settings
    const handleSavePlayer = (updatedPlayer) => {
        setPlayer((previous) => ({
            ...(previous || {}),
            ...updatedPlayer,
        }));
    };

    return (
        <div className="app">
            <header className="topbar">
                <div className="brand">
                    <span>🦖</span>
                    <strong>THE DINO KING</strong>
                </div>

                <button
                    type="button"
                    className="menu-button"
                    onClick={() => setScreen("leaderboard")}
                >
                    🏆 Leaderboard
                </button>

                <button
                    type="button"
                    className="menu-button"
                    onClick={() => setScreen("settings")}
                >
                    ⚙️ Settings
                </button>
            </header>

            <main className="main-content">
                {screen === "start" && (
                    <StartMenu onStart={handleStart} />
                )}

                {screen === "character" && (
                    <CharacterSelection
                        playerName={player?.playerName || ""}
                        onContinue={handleCharacterContinue}
                        onBack={() => setScreen("start")}
                    />
                )}

                {screen === "menu" && (
                    <div className="game-card">
                        <div className="dino">🦖</div>

                        <p className="eyebrow">
                            READY FOR THE CHALLENGE?
                        </p>

                        <h1>Let's Play!</h1>

                        <p>
                            Welcome, {player?.playerName || "Player"}.
                            Create a room or join your friends.
                        </p>

                        <button
                            type="button"
                            className="play-button"
                            onClick={() => setScreen("create")}
                        >
                            CREATE ROOM
                        </button>

                        <button
                            type="button"
                            className="menu-button"
                            onClick={() => setScreen("join")}
                        >
                            JOIN ROOM
                        </button>
                    </div>
                )}

                {screen === "create" && (
                    <CreateRoom
                        player={player}
                        onRoomCreated={handleRoomCreated}
                        onBack={() => setScreen("menu")}
                    />
                )}

                {screen === "join" && (
                    <JoinRoom
                        player={player}
                        onRoomJoined={handleRoomJoined}
                        onBack={() => setScreen("menu")}
                    />
                )}

                {screen === "lobby" && (
                    <Lobby
                        roomCode={roomCode}
                        room={room}
                        player={player}
                        socket={socket}
                        onStartGame={handleStartGame}
                        onBack={handleLeaveRoom}
                    />
                )}

                {screen === "game" && (
                    <Game
                        key={roomCode}
                        roomCode={roomCode}
                        player={player}
                        socket={socket}
                        onGameOver={handleGameOver}
                    />
                )}

                {screen === "gameover" && (
                    <GameOver
                        player={player}
                        score={finalScore}
                        results={results}
                        onPlayAgain={handlePlayAgain}
                        onBackToMenu={handleBackToMenu}
                    />
                )}

                {screen === "leaderboard" && (
                    <Leaderboard
                        onBack={() => setScreen("menu")}
                    />
                )}

                {/* Settings page */}
                {screen === "settings" && (
                    <Settings
                        player={player}
                        onSavePlayer={handleSavePlayer}
                        onBack={() => setScreen("menu")}
                    />
                )}
            </main>

            <footer className="app-footer">
                THE DINO KING © 2026 · RUN TO RULE
            </footer>
        </div>
    );
}

export default App;
