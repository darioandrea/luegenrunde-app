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
    .map(t => t.trim())
    .filter(t => t);

  if (players.length < 2 || imposterCount >= players.length || terms.length === 0) {
    alert('Ungültige Eingaben');
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
    name,
    role: imposters.includes(name) ? 'Imposter' : randomTerm
  }));

  currentPlayerIndex = 0;
  document.getElementById('category-controls').style.display = 'none';
  showNextPlayer();
}

function showNextPlayer() {
  const container = document.getElementById('setup');
  if (currentPlayerIndex >= assignments.length) {
    container.style.display = 'none';
    document.getElementById('result-screen').style.display = 'block';
    return;
  }

  const current = assignments[currentPlayerIndex];
  container.innerHTML = `
    <div>
      <h2>${current.name} ist dran</h2>
      <button onclick="revealTerm()">Begriff anzeigen</button>
    </div>
  `;
}

function revealTerm() {
  const current = assignments[currentPlayerIndex];
  const roleClass = current.role === 'Imposter' ? 'reveal-imposter' : 'reveal-regular';
  document.getElementById('setup').innerHTML = `
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
    const data = JSON.parse(localStorage.getItem(key));
    if (winner === 'imposter' && player.role === 'Imposter') data.winsAsImposter += 1;
    if (winner === 'team' && player.role !== 'Imposter') data.winsAsTeam += 1;
    localStorage.setItem(key, JSON.stringify(data));
  });
  location.reload();
}

function saveCategory() {
  const name = document.getElementById('categoryName').value.trim();
  const terms = document.getElementById('termsInput').value
    .split('\n')
    .map(t => t.trim())
    .filter(t => t !== '');
  if (!name || terms.length === 0) {
    alert('Ungültige Eingaben');
    return;
  }
  localStorage.setItem('category_' + name, JSON.stringify(terms));
  updateCategoryList();
}

function loadCategory() {
  const select = document.getElementById('categorySelect');
  const selectedName = select.value;
  if (!selectedName) return;

  const raw = localStorage.getItem('category_' + selectedName);
  if (!raw) {
    alert('Kategorie nicht gefunden.');
    return;
  }

  try {
    const terms = JSON.parse(raw);
    if (Array.isArray(terms)) {
      document.getElementById('termsInput').value = terms.join('\n');
    } else {
      alert('Ungültiges Datenformat.');
    }
  } catch (e) {
    alert('Fehler beim Laden der Kategorie.');
    console.error(e);
  }
}


function deleteCategory() {
  const name = document.getElementById('categorySelect').value;
  if (!name) return;
  if (confirm(`Kategorie "${name}" wirklich löschen?`)) {
    localStorage.removeItem('category_' + name);
    updateCategoryList();
  }
}

function updateCategoryList() {
  const select = document.getElementById('categorySelect');
  const mixContainer = document.getElementById('category-mix-list');
  select.innerHTML = '<option value="">-- Kategorie wählen --</option>';
  mixContainer.innerHTML = '';
  for (let key in localStorage) {
    if (key.startsWith('category_')) {
      const name = key.replace('category_', '');
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = 'mix_' + name;
      checkbox.value = name;
      const label = document.createElement('label');
      label.htmlFor = 'mix_' + name;
      label.textContent = name;
      const div = document.createElement('div');
      div.appendChild(checkbox);
      div.appendChild(label);
      mixContainer.appendChild(div);
    }
  }
}

function loadMixedCategories() {
  const selected = Array.from(document.querySelectorAll('#category-mix-list input:checked'))
    .map(cb => cb.value);
  let combined = [];
  selected.forEach(name => {
    const terms = JSON.parse(localStorage.getItem('category_' + name));
    combined = combined.concat(terms);
  });
  document.getElementById('termsInput').value = combined.join('\n');
}

function saveMixedCategories() {
  const name = prompt('Namen für die neue Kombination eingeben:');
  if (!name) return;
  const terms = document.getElementById('termsInput').value
    .split('\n')
    .map(t => t.trim())
    .filter(t => t);
  if (terms.length > 0) {
    localStorage.setItem('category_' + name, JSON.stringify(terms));
    updateCategoryList();
  }
}

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
