export function renderHangmanUI(room, roomCode, opts) {
  const area = document.getElementById("game-area");

  area.innerHTML = `
    <h2>🪢 Juego del Ahorcado</h2>

    <pre style="font-size:18px">
${drawHangman(room.gameData?.errors || 0)}
    </pre>

    <p>${(room.gameData?.masked || "").split("").join(" ")}</p>
    <p>Errores: ${room.gameData?.errors || 0} / 6</p>

    ${opts.isSetter && room.state === "setup_word" ? `
      <input id="word" placeholder="Palabra secreta">
      <input id="challenge" placeholder="Reto si falla 😈">
      <button id="save">Guardar</button>
    ` : ""}

    ${opts.isGuesser && room.state === "playing" ? `
      <input id="letter" maxlength="1">
      <button id="guess">Adivinar letra</button>
    ` : ""}
  `;

  if (opts.isSetter && room.state === "setup_word") {
    document.getElementById("save").onclick = () => {
      opts.onChallenge({
        word: document.getElementById("word").value,
        challenge: document.getElementById("challenge").value
      });
    };
  }

  if (opts.isGuesser && room.state === "playing") {
    document.getElementById("guess").onclick = () => {
      opts.onGuess(document.getElementById("letter").value);
    };
  }
}

function drawHangman(errors) {
  const stages = [
` 
  +---+
  |   |
      |
      |
      |
      |
=========`,
`
  +---+
  |   |
  O   |
      |
      |
      |
=========`,
`
  +---+
  |   |
  O   |
  |   |
      |
      |
=========`,
`
  +---+
  |   |
  O   |
 /|   |
      |
      |
=========`,
`
  +---+
  |   |
  O   |
 /|\\  |
      |
      |
=========`,
`
  +---+
  |   |
  O   |
 /|\\  |
 /    |
      |
=========`,
`
  +---+
  |   |
  O   |
 /|\\  |
 / \\  |
      |
=========`
  ];
  return stages[errors];
}
