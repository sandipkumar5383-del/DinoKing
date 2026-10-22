
import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:8000/api";

function Leaderboard({ onBack }) {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const fetchLeaderboard = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await axios.get(
                    `${API_URL}/leaderboard`
                );

                if (cancelled) return;

                // Support both an array and { success, scores }.
                const data = Array.isArray(response.data)
                    ? response.data
                    : Array.isArray(response.data?.scores)
                    ? response.data.scores
                    : [];

                const sortedPlayers = [...data].sort(
                    (a, b) =>
                        Number(b.score || 0) -
                        Number(a.score || 0)
                );

                setPlayers(sortedPlayers);
            } catch (err) {
                if (!cancelled) {
                    console.error(
                        "Leaderboard fetch error:",
                        err
                    );

                    setError(
                        err.response?.data?.message ||
                        "Unable to load leaderboard. Please check your server."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchLeaderboard();

        return () => {
            cancelled = true;
        };
    }, []);

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

                <p className="eyebrow">
                    THE DINO KING CHAMPIONS
                </p>

                <h1>Leaderboard</h1>

                <p className="leaderboard-description">
                    The fastest runners with the highest scores.
                </p>

                {loading && (
                    <p className="leaderboard-message">
                        Loading leaderboard...
                    </p>
                )}

                {!loading && error && (
                    <p className="error-message" role="alert">
                        {error}
                    </p>
                )}

                {!loading && !error && players.length === 0 && (
                    <p className="leaderboard-message">
                        No scores yet. Play a game to become the
                        first champion!
                    </p>
                )}

                {!loading && !error && players.length > 0 && (
                    <div className="leaderboard-table-wrapper">
                        <table className="leaderboard-table">
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Player</th>
                                    <th>Score</th>
                                </tr>
                            </thead>

                            <tbody>
                                {players.map((item, index) => (
                                    <tr
                                        key={
                                            item._id ||
                                            `${item.playerId || "player"}-${index}`
                                        }
                                        className={
                                            index < 3
                                                ? "top-player"
                                                : ""
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
                                            <span className="leaderboard-player">
                                                🦖 {item.playerName || "Player"}
                                            </span>
                                        </td>

                                        <td className="leaderboard-score">
                                            {Number(
                                                item.score || 0
                                            ).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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
