let assignments = [];
let currentPlayerIndex = 0;
let players = [];

function addPlayer() {
  const input = document.getElementById('playerInput');
  const name = input.value.trim();
  if (!name || players.includes(name)) return;
  players.push(name);
  input.value = '';
  updatePlayerList();
}

function updatePlayerList() {
  const list = document.getElementById('playerList');
  list.innerHTML = '';
  players.forEach(name => {
    const li = document.createElement('li');
    li.textContent = name + getPlayerStats(name);
    list.appendChild(li);
  });
}

function getPlayerStats(name) {
  const data = JSON.parse(localStorage.getItem('player_' + name)) || {
    games: 0,
    imposters: 0,
    winsAsImposter: 0,
    winsAsTeam: 0
  };
  return ` (Spiele: ${data.games}, Imposter: ${data.imposters}, I-Wins: ${data.winsAsImposter}, T-Wins: ${data.winsAsTeam})`;
}

function startGame() {
  const imposterCount = parseInt(document.getElementById('imposterCount').value);
  const terms = document.getElementById('termsInput').value
    .split('\n')
    .map(term => term.trim())
    .filter(term => term !== '');

  if (players.length < 2 || imposterCount >= players.length || terms.length === 0) {
    alert('Bitte gültige Eingaben machen!');
    return;
  }

  players.forEach(name => {
    const key = 'player_' + name;
    const data = JSON.parse(localStorage.getItem(key)) || {
      games: 0,
      imposters: 0,
      winsAsImposter: 0,
      winsAsTeam: 0
    };
    data.games += 1;
    localStorage.setItem(key, JSON.stringify(data));
  });

  const randomTerm = terms[Math.floor(Math.random() * terms.length)];
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const imposters = shuffled.slice(0, imposterCount);

  imposters.forEach(name => {
    const key = 'player_' + name;
    const data = JSON.parse(localStorage.getItem(key));
    data.imposters += 1;
    localStorage.setItem(key, JSON.stringify(data));
  });

  assignments = players.map(name => ({
    name: name,
    role: imposters.includes(name) ? 'Imposter' : randomTerm
  }));

  currentPlayerIndex = 0;
  document.getElementById('category-controls').style.display = 'none';
  showNextPlayer();
}

function showNextPlayer() {
  const container = document.getElementById('setup');
  if (currentPlayerIndex >= assignments.length) {
    document.getElementById('setup').style.display = 'none';
    document.getElementById('result-screen').style.display = 'block';
    return;
  }

  const current = assignments[currentPlayerIndex];
  container.innerHTML = `
    <div class="slide-in">
      <h2>${current.name} ist dran</h2>
      <button onclick="revealTerm()">Begriff anzeigen</button>
    </div>
  `;
}

function revealTerm() {
  const current = assignments[currentPlayerIndex];
  const container = document.getElementById('setup');
  const roleClass = current.role === 'Imposter' ? 'reveal-imposter' : 'reveal-regular';
  container.innerHTML = `
    <div class="${roleClass}">
      <h2>${current.name}</h2>
      <p><strong>${current.role}</strong></p>
      <button onclick="next()">Check – gib das Handy weiter</button>
    </div>
  `;
}

function next() {
  currentPlayerIndex++;
  showNextPlayer();
}

function recordResult(winner) {
  assignments.forEach(player => {
    const key = 'player_' + player.name;
    const data = JSON.parse(localStorage.getItem(key)) || {
      games: 0,
      imposters: 0,
      winsAsImposter: 0,
      winsAsTeam: 0
    };

    if (winner === 'imposter' && player.role === 'Imposter') {
      data.winsAsImposter += 1;
    }
    if (winner === 'team' && player.role !== 'Imposter') {
      data.winsAsTeam += 1;
    }

    localStorage.setItem(key, JSON.stringify(data));
  });

  location.reload();
}

// Kategorien-Funktionen unverändert (saveCategory, loadCategory, etc.)
// Fügt deinen vorhandenen Mix-Modus & Kategorie-Code ein...

function toggleTheme() {
  const isDark = document.getElementById('darkModeToggle').checked;
  document.body.className = isDark ? 'dark' : 'light';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function loadTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  document.body.className = saved;
  document.getElementById('darkModeToggle').checked = saved === 'dark';
}

window.onload = () => {
  updateCategoryList();
  loadTheme();
};
