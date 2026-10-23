
import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:8000/api";

function Leaderboard({ onBack }) {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadLeaderboard() {
            try {
                const response = await axios.get(
                    `${API_URL}/leaderboard`
                );

                if (cancelled) return;

                const data = Array.isArray(response.data)
                    ? response.data
                    : response.data?.scores || [];

                const sorted = [...data].sort(
                    (a, b) =>
                        Number(b.score || 0) -
                        Number(a.score || 0)
                );

                setPlayers(sorted);
                setError("");
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.data?.message ||
                        "Unable to load leaderboard."
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadLeaderboard();

        return () => {
            cancelled = true;
        };
    }, []);

    const getStatus = (player) => {
        const value = String(
            player.status || player.playerStatus || ""
        ).toLowerCase();

        if (value === "playing") return "Playing";
        if (value === "dead") return "Dead";
        if (value === "ready") return "Ready";
        return "Unknown";
    };

    const playingCount = players.filter(
        (p) => getStatus(p) === "Playing"
    ).length;

    const deadCount = players.filter(
        (p) => getStatus(p) === "Dead"
    ).length;

    return (
        <div className="leaderboard-page">
            <div className="leaderboard-card">
                <button
                    type="button"
                    className="back-button"
                    onClick={onBack}
                >
                    ← Back
                </button>

                <div className="leaderboard-icon">🏆</div>
                <p className="eyebrow">THE DINO KING CHAMPIONS</p>
                <h1>Leaderboard</h1>

                <p className="leaderboard-description">
                    Choose your character. Run to rule!
                </p>

                {loading && (
                    <p className="leaderboard-message">
                        Loading leaderboard...
                    </p>
                )}

                {!loading && error && (
                    <p className="error-message">{error}</p>
                )}

                {!loading && !error && (
                    <>
                        <div className="player-counts">
                            <div className="player-count-card">
                                <h2>{players.length}</h2>
                                <p>Total Players</p>
                            </div>

                            <div className="player-count-card">
                                <h2>{playingCount}</h2>
                                <p>Playing</p>
                            </div>

                            <div className="player-count-card">
                                <h2>{deadCount}</h2>
                                <p>Dead</p>
                            </div>
                        </div>

                        {players.length === 0 ? (
                            <p className="leaderboard-message">
                                No scores available yet.
                            </p>
                        ) : (
                            <div className="leaderboard-table-wrapper">
                                <table className="leaderboard-table">
                                    <thead>
                                        <tr>
                                            <th>Rank</th>
                                            <th>Player</th>
                                            <th>Score</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {players.map((item, index) => {
                                            const status = getStatus(item);

                                            return (
                                                <tr
                                                    key={
                                                        item._id ||
                                                        item.playerId ||
                                                        index
                                                    }
                                                >
                                                    <td>
                                                        {index === 0
                                                            ? "🥇"
                                                            : index === 1
                                                            ? "🥈"
                                                            : index === 2
                                                            ? "🥉"
                                                            : index + 1}
                                                    </td>

                                                    <td>
                                                        <span
                                                            className="leaderboard-player"
                                                            style={{
                                                                color:
                                                                    item.color ||
                                                                    "#69db7c"
                                                            }}
                                                        >
                                                            {item.character ||
                                                                item.selectedCharacter ||
                                                                "🦖"}{" "}
                                                            {item.playerName ||
                                                                item.name ||
                                                                "Player"}
                                                        </span>
                                                    </td>

                                                    <td className="leaderboard-score">
                                                        {Number(
                                                            item.score || 0
                                                        ).toLocaleString()}
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={
                                                                status === "Playing"
                                                                    ? "status-playing"
                                                                    : status === "Dead"
                                                                    ? "status-dead"
                                                                    : "status-unknown"
                                                            }
                                                        >
                                                            {status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                <button
                    type="button"
                    className="play-button"
                    onClick={onBack}
                >
                    BACK TO MENU
                </button>
            </div>
        </div>
    );
}

export default Leaderboard;
