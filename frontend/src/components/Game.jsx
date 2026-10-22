
import { useCallback, useEffect, useRef, useState } from "react";

const GAME_WIDTH = 800;
const GROUND_Y = 270;
const DINO_X = 90;
const DINO_SIZE = 42;
const GRAVITY = 0.7;
const JUMP_POWER = -13;

function Game({ roomCode, player, socket, onGameOver }) {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const stateRef = useRef({
        dinoY: GROUND_Y - DINO_SIZE,
        velocityY: 0,
        jumping: false,
        obstacles: [],
        score: 0,
        speed: 5,
        frame: 0,
        gameOver: false,
        lastObstacleFrame: 0,
        remotePlayers: {}
    });

    const [score, setScore] = useState(0);
    const [finished, setFinished] = useState(false);

    const jump = useCallback(() => {
        const game = stateRef.current;

        if (!game.gameOver && !game.jumping) {
            game.velocityY = JUMP_POWER;
            game.jumping = true;
        }
    }, []);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (
                event.code === "Space" ||
                event.code === "ArrowUp"
            ) {
                event.preventDefault();
                jump();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [jump]);

    useEffect(() => {
        if (!socket) return;

        const handlePlayerMoved = (data) => {
            stateRef.current.remotePlayers[data.playerId] = data;
        };

        const handlePlayerDisconnected = ({ playerId }) => {
            delete stateRef.current.remotePlayers[playerId];
        };

        socket.on("playerMoved", handlePlayerMoved);
        socket.on("playerDisconnected", handlePlayerDisconnected);

        return () => {
            socket.off("playerMoved", handlePlayerMoved);
            socket.off("playerDisconnected", handlePlayerDisconnected);
        };
    }, [socket]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");

        if (!context || finished) return;

        const game = stateRef.current;
        let lastScoreSent = -1;

        const finishGame = () => {
            if (game.gameOver) return;

            game.gameOver = true;
            setFinished(true);

            socket?.emit("updateScore", {
                roomCode,
                score: game.score
            });

            socket?.emit("gameOver", { roomCode }, (response) => {
                onGameOver?.({
                    roomCode,
                    score: game.score,
                    results: response?.players || []
                });
            });

            if (!socket) {
                onGameOver?.({
                    roomCode,
                    score: game.score,
                    results: []
                });
            }
        };

        const drawDino = (x, y, color, emoji = "🦖") => {
            context.fillStyle = color;
            context.font = `${DINO_SIZE}px Arial`;
            context.textBaseline = "top";
            context.fillText(emoji, x, y);
        };

        const draw = () => {
            if (game.gameOver) return;

            game.frame += 1;

            context.clearRect(0, 0, GAME_WIDTH, 320);

            // Sky background
            context.fillStyle = "#172733";
            context.fillRect(0, 0, GAME_WIDTH, 320);

            // Decorative clouds
            context.fillStyle = "#304653";
            context.beginPath();
            context.arc(150, 55, 20, 0, Math.PI * 2);
            context.arc(175, 48, 26, 0, Math.PI * 2);
            context.arc(200, 57, 18, 0, Math.PI * 2);
            context.fill();

            // Ground
            context.fillStyle = "#69db7c";
            context.fillRect(0, GROUND_Y, GAME_WIDTH, 3);

            context.fillStyle = "#486052";
            context.fillRect(0, GROUND_Y + 3, GAME_WIDTH, 47);

            // Dinosaur physics
            game.velocityY += GRAVITY;
            game.dinoY += game.velocityY;

            if (game.dinoY >= GROUND_Y - DINO_SIZE) {
                game.dinoY = GROUND_Y - DINO_SIZE;
                game.velocityY = 0;
                game.jumping = false;
            }

            drawDino(
                DINO_X,
                game.dinoY,
                player?.color || "#69db7c"
            );

            // Spawn obstacles
            if (
                game.frame - game.lastObstacleFrame > 75 &&
                game.obstacles.length < 4
            ) {
                game.obstacles.push({
                    x: GAME_WIDTH,
                    width: 24,
                    height: 35 + Math.random() * 15
                });

                game.lastObstacleFrame = game.frame;
            }

            // Move and draw obstacles
            game.obstacles.forEach((obstacle) => {
                obstacle.x -= game.speed;

                context.fillStyle = "#ff6b6b";
                context.fillRect(
                    obstacle.x,
                    GROUND_Y - obstacle.height,
                    obstacle.width,
                    obstacle.height
                );

                // Basic collision detection
                const dinoLeft = DINO_X + 7;
                const dinoRight = DINO_X + DINO_SIZE - 7;
                const dinoTop = game.dinoY + 5;
                const dinoBottom = game.dinoY + DINO_SIZE - 5;

                const obstacleLeft = obstacle.x;
                const obstacleRight = obstacle.x + obstacle.width;
                const obstacleTop = GROUND_Y - obstacle.height;

                if (
                    dinoRight > obstacleLeft &&
                    dinoLeft < obstacleRight &&
                    dinoBottom > obstacleTop &&
                    dinoTop < GROUND_Y
                ) {
                    finishGame();
                }
            });

            game.obstacles = game.obstacles.filter(
                (obstacle) => obstacle.x + obstacle.width > 0
            );

            // Show other connected players
            Object.values(game.remotePlayers).forEach((remote) => {
                drawDino(
                    remote.x ?? 160,
                    GROUND_Y - DINO_SIZE,
                    remote.color || "#4dabf7"
                );
            });

            // Score and difficulty
            if (game.frame % 6 === 0) {
                game.score += 1;
                setScore(game.score);

                if (game.score % 100 === 0) {
                    game.speed = Math.min(game.speed + 0.5, 10);
                }
            }

            context.fillStyle = "#ffffff";
            context.font = "bold 18px Arial";
            context.fillText(`Score: ${game.score}`, 650, 25);

            // Send movement updates periodically
            if (socket && game.frame % 3 === 0) {
                socket.emit("playerMove", {
                    roomCode,
                    x: DINO_X,
                    y: game.dinoY,
                    jumping: game.jumping
                });
            }

            if (socket && game.score !== lastScoreSent && game.frame % 30 === 0) {
                lastScoreSent = game.score;

                socket.emit("updateScore", {
                    roomCode,
                    score: game.score
                });
            }

            if (!game.gameOver) {
                animationRef.current = requestAnimationFrame(draw);
            }
        };

        draw();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [finished, onGameOver, player, roomCode, socket]);

    const handleRestart = () => {
        stateRef.current = {
            dinoY: GROUND_Y - DINO_SIZE,
            velocityY: 0,
            jumping: false,
            obstacles: [],
            score: 0,
            speed: 5,
            frame: 0,
            gameOver: false,
            lastObstacleFrame: 0,
            remotePlayers: {}
        };

        setScore(0);
        setFinished(false);
    };

    return (
        <div className="game-screen">
            <div className="game-header">
                <div>
                    <p className="eyebrow">THE DINO KING</p>
                    <h1>Run, {player?.playerName || "Dino"}!</h1>
                </div>

                <div className="score-display">
                    <span>SCORE</span>
                    <strong>{score}</strong>
                </div>
            </div>

            <div className="game-canvas-wrapper">
                <canvas
                    ref={canvasRef}
                    width={GAME_WIDTH}
                    height={320}
                    onClick={jump}
                    aria-label="Dinosaur runner game. Click or press Space to jump."
                />

                {finished && (
                    <div className="game-over-overlay">
                        <h2>Game Over!</h2>
                        <p>Your score: {score}</p>

                        <button
                            type="button"
                            className="play-button"
                            onClick={handleRestart}
                        >
                            PLAY AGAIN
                        </button>

                        <button
                            type="button"
                            className="back-button"
                            onClick={() =>
                                onGameOver?.({
                                    roomCode,
                                    score,
                                    results: []
                                })
                            }
                        >
                            VIEW RESULTS
                        </button>
                    </div>
                )}
            </div>

            <p className="game-instructions">
                Press SPACE, ↑, or click the game to jump over obstacles.
            </p>
        </div>
    );
}

export default Game;
