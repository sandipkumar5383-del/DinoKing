
function GameOver({
    player,
    score = 0,
    results = [],
    onPlayAgain,
    onBackToMenu
}) {
    const sortedResults = [...results].sort(
        (a, b) => (b.score || 0) - (a.score || 0)
    );

    const playerRank = sortedResults.findIndex(
        (item) => item.playerId === player?.playerId
    );

    const rank = playerRank === -1 ? null : playerRank + 1;

    const isWinner = rank === 1;

    return (
        <div className="game-over-page">
            <div className="game-over-card">
                <div className="game-over-icon">
                    {isWinner ? "👑" : "🦖"}
                </div>

                <p className="eyebrow">THE DINO KING</p>

                <h1>
                    {isWinner ? "Dino Champion!" : "Game Over!"}
                </h1>

                <p className="game-over-description">
                    Great run, {player?.playerName || "Player"}!
                    {isWinner
                        ? " You are the king of the run!"
                        : " Ready to beat your best score?"}
                </p>

                <div className="final-score-box">
                    <span>YOUR FINAL SCORE</span>
                    <strong>{Number(score).toLocaleString()}</strong>
                </div>

                <div className="game-over-stats">
                    <div className="stat-box">
                        <span>🏆</span>
                        <small>Your Rank</small>
                        <strong>{rank ? `#${rank}` : "—"}</strong>
                    </div>

                    <div className="stat-box">
                        <span>👥</span>
                        <small>Players</small>
                        <strong>{sortedResults.length}</strong>
                    </div>
                </div>

                {sortedResults.length > 0 && (
                    <div className="final-results">
                        <h2>Match Results</h2>

                        {sortedResults.map((item, index) => (
                            <div
                                className={
                                    item.playerId === player?.playerId
                                        ? "result-player current-player"
                                        : "result-player"
                                }
                                key={
                                    item._id ||
                                    `${item.playerId}-${index}`
                                }
                            >
                                <span className="result-rank">
                                    {index === 0
                                        ? "🥇"
                                        : index === 1
                                        ? "🥈"
                                        : index === 2
                                        ? "🥉"
                                        : `#${index + 1}`}
                                </span>

                                <span className="result-name">
                                    {item.playerName || "Player"}
                                    {item.playerId === player?.playerId
                                        ? " (You)"
                                        : ""}
                                </span>

                                <strong className="result-score">
                                    {Number(item.score || 0).toLocaleString()}
                                </strong>
                            </div>
                        ))}
                    </div>
                )}

                <div className="game-over-actions">
                    <button
                        type="button"
                        className="play-button"
                        onClick={onPlayAgain}
                    >
                        🔄 PLAY AGAIN
                    </button>

                    <button
                        type="button"
                        className="menu-button"
                        onClick={onBackToMenu}
                    >
                        ← BACK TO MENU
                    </button>
                </div>

                <p className="game-over-footer">
                    KEEP RUNNING. KEEP JUMPING. BECOME THE KING.
                </p>
            </div>
        </div>
    );
}

export default GameOver;
