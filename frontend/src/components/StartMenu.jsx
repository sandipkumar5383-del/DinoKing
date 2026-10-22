
import { useState } from "react";

function StartMenu({ onStart }) {
    const [playerName, setPlayerName] = useState("");

    const handleStart = (e) => {
        e.preventDefault();

        const name = playerName.trim();

        if (!name) {
            alert("Please enter your player name");
            return;
        }

        if (name.length > 20) {
            alert("Name must be 20 characters or fewer");
            return;
        }

        onStart(name);
    };

    return (
        <div className="start-menu">
            <div className="start-card">
                <div className="game-logo">🦖</div>

                <p className="eyebrow">MULTIPLAYER DINO RUNNER</p>

                <h1>
                    THE <span>DINO KING</span>
                </h1>

                <p className="start-description">
                    Run, jump, dodge obstacles, and become
                    the ultimate Dino King!
                </p>

                <form onSubmit={handleStart}>
                    <label htmlFor="playerName">
                        Enter your player name
                    </label>

                    <input
                        id="playerName"
                        type="text"
                        placeholder="Enter your name..."
                        value={playerName}
                        onChange={(e) =>
                            setPlayerName(e.target.value)
                        }
                        maxLength={20}
                        autoComplete="off"
                    />

                    <button type="submit" className="play-button">
                        PLAY NOW <span>➜</span>
                    </button>
                </form>

                <div className="game-features">
                    <span>🏃 Endless Run</span>
                    <span>👥 Multiplayer</span>
                    <span>🏆 Leaderboard</span>
                </div>
            </div>

            <p className="start-footer">
                THE DINO KING · RUN TO RULE
            </p>
        </div>
    );
}

export default StartMenu;
