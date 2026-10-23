
import { useEffect, useState } from "react";
import "./Settings.css";

const DEFAULT_SETTINGS = {
    playerName: "",
    character: "🦖",
    color: "#69db7c",
    musicEnabled: true,
    soundEnabled: true,
    musicVolume: 50,
    soundVolume: 70,
    difficulty: "normal",
    gameSpeed: "normal",
    controls: "keyboard",
    theme: "dark",
    screenMode: "normal"
};

const STORAGE_KEY = "dinoKingSettings";

const CHARACTERS = [
    { emoji: "🦖", label: "Classic Dino" },
    { emoji: "🦕", label: "Long Neck" },
    { emoji: "🐲", label: "Dragon" },
    { emoji: "🐉", label: "Dragon Flyer" },
    { emoji: "👾", label: "Alien" },
    { emoji: "🤖", label: "Robot" }
];

const COLORS = [
    "#69db7c",
    "#ff6b6b",
    "#4dabf7",
    "#ffd43b",
    "#da77f2",
    "#ff922b",
    "#ffffff",
    "#20c997"
];

function loadSettings() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        return saved
            ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
            : { ...DEFAULT_SETTINGS };
    } catch {
        return { ...DEFAULT_SETTINGS };
    }
}

function Settings({ onBack, player, onSavePlayer }) {
    const [settings, setSettings] = useState(() => {
        const saved = loadSettings();

        return {
            ...saved,
            playerName: player?.playerName ?? saved.playerName,
            character: player?.character ?? saved.character,
            color: player?.color ?? saved.color
        };
    });

    const [message, setMessage] = useState("");

    useEffect(() => {
        document.documentElement.dataset.theme = settings.theme;

        return () => {
            delete document.documentElement.dataset.theme;
        };
    }, [settings.theme]);

    const updateSetting = (key, value) => {
        setSettings((previous) => ({
            ...previous,
            [key]: value
        }));

        setMessage("");
    };

    const saveSettings = () => {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(settings)
            );

            // Keep the existing player state in App.jsx synchronized.
            if (typeof onSavePlayer === "function") {
                onSavePlayer({
                    playerName: settings.playerName.trim() || "Player",
                    character: settings.character,
                    color: settings.color
                });
            }

            setMessage("Settings saved successfully!");
        } catch (error) {
            console.error("Unable to save settings:", error);
            setMessage("Could not save settings. Check browser storage.");
        }
    };

    const resetSettings = () => {
        const defaults = {
            ...DEFAULT_SETTINGS,
            playerName: player?.playerName ?? ""
        };

        setSettings(defaults);

        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(defaults)
            );

            if (typeof onSavePlayer === "function") {
                onSavePlayer({
                    playerName: defaults.playerName || "Player",
                    character: defaults.character,
                    color: defaults.color
                });
            }

            setMessage("Settings reset to defaults.");
        } catch (error) {
            console.error("Unable to reset settings:", error);
            setMessage("Could not reset settings.");
        }
    };

    return (
        <main className={`settings-page theme-${settings.theme}`}>
            <div className="settings-container">
                <header className="settings-header">
                    <button
                        type="button"
                        className="settings-back"
                        onClick={onBack}
                    >
                        ← Back to Menu
                    </button>

                    <div className="settings-heading">
                        <span className="settings-icon">⚙️</span>
                        <p className="settings-eyebrow">
                            THE DINO KING
                        </p>
                        <h1>Game Settings</h1>
                        <p>Customize your adventure.</p>
                    </div>
                </header>

                {message && (
                    <p className="settings-message" role="status">
                        {message}
                    </p>
                )}

                <section className="settings-section">
                    <h2>🦖 Player Settings</h2>

                    <label className="settings-label" htmlFor="playerName">
                        Player Name
                    </label>
                    <input
                        id="playerName"
                        className="settings-input"
                        type="text"
                        maxLength={24}
                        placeholder="Enter your player name"
                        value={settings.playerName}
                        onChange={(event) =>
                            updateSetting("playerName", event.target.value)
                        }
                    />

                    <p className="settings-label">Choose Your Character</p>
                    <div className="character-grid">
                        {CHARACTERS.map((item) => (
                            <button
                                type="button"
                                key={item.emoji}
                                className={`character-option ${
                                    settings.character === item.emoji
                                        ? "selected"
                                        : ""
                                }`}
                                onClick={() =>
                                    updateSetting("character", item.emoji)
                                }
                                aria-pressed={settings.character === item.emoji}
                            >
                                <span>{item.emoji}</span>
                                <small>{item.label}</small>
                            </button>
                        ))}
                    </div>

                    <p className="settings-label">Character Color</p>
                    <div className="color-grid">
                        {COLORS.map((color) => (
                            <button
                                type="button"
                                key={color}
                                className={`color-option ${
                                    settings.color === color ? "selected" : ""
                                }`}
                                style={{ backgroundColor: color }}
                                onClick={() => updateSetting("color", color)}
                                aria-label={`Select color ${color}`}
                                aria-pressed={settings.color === color}
                            />
                        ))}
                    </div>

                    <div className="character-preview">
                        <span
                            className="preview-character"
                            style={{ color: settings.color }}
                        >
                            {settings.character}
                        </span>
                        <div>
                            <strong>
                                {settings.playerName.trim() || "Player"}
                            </strong>
                            <p>Your character preview</p>
                        </div>
                    </div>
                </section>

                <section className="settings-section">
                    <h2>🔊 Audio Settings</h2>

                    <label className="settings-toggle">
                        <span>
                            <strong>Background Music</strong>
                            <small>Play music during the game</small>
                        </span>
                        <input
                            type="checkbox"
                            checked={settings.musicEnabled}
                            onChange={(event) =>
                                updateSetting("musicEnabled", event.target.checked)
                            }
                        />
                    </label>

                    <label className="settings-label" htmlFor="musicVolume">
                        Music Volume: {settings.musicVolume}%
                    </label>
                    <input
                        id="musicVolume"
                        className="settings-range"
                        type="range"
                        min="0"
                        max="100"
                        value={settings.musicVolume}
                        onChange={(event) =>
                            updateSetting("musicVolume", Number(event.target.value))
                        }
                    />

                    <label className="settings-toggle">
                        <span>
                            <strong>Sound Effects</strong>
                            <small>Jumping, collision, and game sounds</small>
                        </span>
                        <input
                            type="checkbox"
                            checked={settings.soundEnabled}
                            onChange={(event) =>
                                updateSetting("soundEnabled", event.target.checked)
                            }
                        />
                    </label>

                    <label className="settings-label" htmlFor="soundVolume">
                        Sound Effects Volume: {settings.soundVolume}%
                    </label>
                    <input
                        id="soundVolume"
                        className="settings-range"
                        type="range"
                        min="0"
                        max="100"
                        value={settings.soundVolume}
                        onChange={(event) =>
                            updateSetting("soundVolume", Number(event.target.value))
                        }
                    />
                </section>

                <section className="settings-section">
                    <h2>🎮 Gameplay Settings</h2>

                    <label className="settings-label" htmlFor="difficulty">
                        Difficulty
                    </label>
                    <select
                        id="difficulty"
                        className="settings-input"
                        value={settings.difficulty}
                        onChange={(event) =>
                            updateSetting("difficulty", event.target.value)
                        }
                    >
                        <option value="easy">Easy</option>
                        <option value="normal">Normal</option>
                        <option value="hard">Hard</option>
                    </select>

                    <label className="settings-label" htmlFor="gameSpeed">
                        Game Speed
                    </label>
                    <select
                        id="gameSpeed"
                        className="settings-input"
                        value={settings.gameSpeed}
                        onChange={(event) =>
                            updateSetting("gameSpeed", event.target.value)
                        }
                    >
                        <option value="slow">Slow</option>
                        <option value="normal">Normal</option>
                        <option value="fast">Fast</option>
                    </select>

                    <label className="settings-label" htmlFor="controls">
                        Controls
                    </label>
                    <select
                        id="controls"
                        className="settings-input"
                        value={settings.controls}
                        onChange={(event) =>
                            updateSetting("controls", event.target.value)
                        }
                    >
                        <option value="keyboard">Keyboard</option>
                        <option value="touch">Touch</option>
                    </select>

                    <p className="settings-note">
                        Difficulty, speed, and control preferences are saved.
                        Connect them to your game engine to change gameplay.
                    </p>
                </section>

                <section className="settings-section">
                    <h2>🖥️ Display Settings</h2>

                    <label className="settings-label" htmlFor="theme">
                        Theme
                    </label>
                    <select
                        id="theme"
                        className="settings-input"
                        value={settings.theme}
                        onChange={(event) =>
                            updateSetting("theme", event.target.value)
                        }
                    >
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                    </select>

                    <label className="settings-label" htmlFor="screenMode">
                        Screen Mode
                    </label>
                    <select
                        id="screenMode"
                        className="settings-input"
                        value={settings.screenMode}
                        onChange={(event) =>
                            updateSetting("screenMode", event.target.value)
                        }
                    >
                        <option value="normal">Normal</option>
                        <option value="wide">Wide Layout</option>
                    </select>

                    <p className="settings-note">
                        Screen mode is saved as a preference. Wide Layout
                        requires a matching layout change in your game screen.
                    </p>
                </section>

                <div className="settings-actions">
                    <button
                        type="button"
                        className="settings-save"
                        onClick={saveSettings}
                    >
                        💾 Save Settings
                    </button>

                    <button
                        type="button"
                        className="settings-reset"
                        onClick={resetSettings}
                    >
                        Reset to Defaults
                    </button>
                </div>

                <button
                    type="button"
                    className="settings-footer-back"
                    onClick={onBack}
                >
                    Return to Main Menu
                </button>
            </div>
        </main>
    );
}

export default Settings;
