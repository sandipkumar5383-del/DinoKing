
import { useState } from "react";

function CharacterSelection({ playerName, onContinue, onBack }) {
    const [selectedCharacter, setSelectedCharacter] = useState("🦖");
    const [selectedColor, setSelectedColor] = useState("#69db7c");

    const characters = [
        { emoji: "🦖", name: "Rex" },
        { emoji: "🦕", name: "Dippy" },
        { emoji: "🐲", name: "Dragon" },
        { emoji: "🐊", name: "Chomper" }
    ];

    const colors = [
        "#69db7c",
        "#ff6b6b",
        "#4dabf7",
        "#ffd43b",
        "#da77f2",
        "#ff922b"
    ];

    const handleContinue = () => {
        onContinue({
            playerName,
            character: selectedCharacter,
            color: selectedColor
        });
    };

    return (
        <div className="character-selection">
            <div className="character-card">
                <button
                    type="button"
                    className="back-button"
                    onClick={onBack}
                >
                    ← Back
                </button>

                <p className="eyebrow">PLAYER CUSTOMIZATION</p>

                <h1>Choose Your Dino</h1>

                <p className="character-description">
                    Welcome, {playerName}! Customize your character
                    before entering the game.
                </p>

                <div
                    className="character-preview"
                    style={{ color: selectedColor }}
                >
                    <span>{selectedCharacter}</span>
                </div>

                <h3>Select Character</h3>

                <div className="character-options">
                    {characters.map((item) => (
                        <button
                            type="button"
                            key={item.name}
                            className={
                                selectedCharacter === item.emoji
                                    ? "character-option selected"
                                    : "character-option"
                            }
                            onClick={() =>
                                setSelectedCharacter(item.emoji)
                            }
                            aria-label={item.name}
                            aria-pressed={
                                selectedCharacter === item.emoji
                            }
                        >
                            <span>{item.emoji}</span>
                            <small>{item.name}</small>
                        </button>
                    ))}
                </div>

                <h3>Select Color</h3>

                <div className="color-options">
                    {colors.map((color) => (
                        <button
                            type="button"
                            key={color}
                            className={
                                selectedColor === color
                                    ? "color-option selected"
                                    : "color-option"
                            }
                            style={{ backgroundColor: color }}
                            onClick={() => setSelectedColor(color)}
                            aria-label={`Choose ${color}`}
                            aria-pressed={selectedColor === color}
                        />
                    ))}
                </div>

                <button
                    type="button"
                    className="play-button"
                    onClick={handleContinue}
                >
                    CONTINUE →
                </button>
            </div>
        </div>
    );
}

export default CharacterSelection;
