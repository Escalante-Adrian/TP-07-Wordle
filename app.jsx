function App() {
  const emptyGrid = [];
  for(let i = 0; i < 6; i++) {
    emptyGrid.push(["", "", "", "", ""]);
  }

  const [grid, setGrid] = React.useState(emptyGrid);
  const [row, setRow] = React.useState(0);
  const [col, setCol] = React.useState(0);
  const [words, setWords] = React.useState([]);
  const [target, setTarget] = React.useState("");
  const [colors, setColors] = React.useState(emptyGrid);
  const [gameOver, setGameOver] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [invalid, setInvalid] = React.useState(false);
  const [definition, setDefinition] = React.useState("");
  const [history, setHistory] = React.useState({});

  React.useEffect(() => {
    fetch("words.json").then(r => r.json()).then(data => {
      setWords(data);
      startGame(data);
    });

    let saved = localStorage.getItem("history");
    if(saved) setHistory(JSON.parse(saved));
  }, []);

  function startGame(list) {
    let rand = list[Math.floor(Math.random() * list.length)];
    setTarget(rand.word);
    setGrid(emptyGrid.map(r => r.slice()));
    setColors(emptyGrid.map(r => r.slice()));
    setRow(0);
    setCol(0);
    setGameOver(false);
    setMessage("");
    setInvalid(false);
    setDefinition("");
  }

  React.useEffect(() => {
    function keyHandler(e) {
      if(gameOver) return;

      let key = e.key.toLowerCase();

      if(key === "backspace") {
        if(col > 0) {
          let newGrid = grid.map(r => r.slice());
          newGrid[row][col-1] = "";
          setGrid(newGrid);
          setCol(col - 1);
          setMessage("");
          setInvalid(false);
        }
      }
      else if(key === "enter") {
        if(col !== 5 || invalid) return;

        let guess = grid[row].join("");
        let found = words.find(w => w.word === guess);
        if(!found) {
          setMessage("Palabra no válida");
          setInvalid(true);
          setTimeout(() => {
            setMessage("");
            setInvalid(false);
          }, 2500);
          return;
        }

        let newColors = colors.map(r => r.slice());
        for(let i = 0; i < 5; i++) {
          if(guess[i] === target[i]) newColors[row][i] = "green";
          else if(target.includes(guess[i])) newColors[row][i] = "yellow";
          else newColors[row][i] = "gray";
        }
        setColors(newColors);

        if(guess === target) {
          setMessage(`¡Ganaste en ${row + 1} intento${row > 0 ? "s" : ""}!`);
          setDefinition(`${found.word}: ${found.definition}`);
          saveResult("Ganado", row + 1);
          setGameOver(true);
          return;
        }

        if(row === 5) {
          let tword = words.find(w => w.word === target);
          setMessage(`Perdiste. La palabra era: ${target.toUpperCase()}`);
          setDefinition(`${tword.word}: ${tword.definition}`);
          saveResult("Perdido", 6);
          setGameOver(true);
          return;
        }

        setRow(row + 1);
        setCol(0);
        setMessage("");
      }
      else if(/^[a-zñ]$/.test(key)) {
        if(col < 5) {
          let newGrid = grid.map(r => r.slice());
          newGrid[row][col] = key;
          setGrid(newGrid);
          setCol(col + 1);
        }
      }
    }

    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  }, [grid, col, row, words, target, colors, gameOver, invalid]);

  function saveResult(result, tries) {
    let d = new Date();
    let date = d.getDate() + "-" + (d.getMonth()+1) + "-" + d.getFullYear();
    let newHist = {...history};

    if(!newHist[date]) newHist[date] = [];
    newHist[date].push({result: result, attempts: tries});
    setHistory(newHist);
    localStorage.setItem("history", JSON.stringify(newHist));
  }

  function restart() {
    startGame(words);
  }

  return (
    <div>
      <h1>Clondle</h1>

      <div className="grid">
        {grid.map((r, i) => (
          <div key={i} className="row">
            {r.map((l, j) => {
              let cls = colors[i][j];
              if(invalid && i === row) cls = "invalid";
              return <div key={j} className={"box " + (cls || "")}>{l}</div>;
            })}
          </div>
        ))}
      </div>

      {message && <h1 className="message">{message}</h1>}
      {gameOver && definition && <p className="word-definition">{definition}</p>}

      {gameOver && <button className="btn-restart" onClick={restart}>Jugar de nuevo</button>}

      <h2>Partidas jugadas</h2>
      {Object.keys(history).length === 0 && <p>No hay partidas jugadas todavía.</p>}
      {Object.keys(history).map(date => (
        <div key={date}>
          <strong>{date}</strong>
          <ul className="history-list">
            {history[date].map((g, idx) => (
              <li key={idx}>{idx+1}. {g.result} - {g.attempts} intento{g.attempts > 1 ? "s" : ""}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
