/**
 * C - 212 CARD ARENA - CORE APPLICATION LOGIC
 */

// --- Application State ---
let state = {
  players: [],
  rounds: []
};

// --- Storage Keys ---
const STORAGE_KEY = 'c212_card_arena_scorecard';

// --- DOM Elements ---
const tableHeaderRow = document.getElementById('table-header-row');
const tableBody = document.getElementById('table-body');
const roundsBadge = document.getElementById('rounds-badge');
const playersBadge = document.getElementById('players-badge');
const leaderboardList = document.getElementById('leaderboard-list');

const scorecardEmptyState = document.getElementById('scorecard-empty-state');
const leaderboardEmptyState = document.getElementById('leaderboard-empty-state');

// Modals
const clearConfirmModal = document.getElementById('clear-confirm-modal');
const addPlayerModal = document.getElementById('add-player-modal');
const newPlayerNameInput = document.getElementById('new-player-name');
const addPlayerForm = document.getElementById('add-player-form');

// Buttons
const btnAddPlayer = document.getElementById('btn-add-player');
const btnAddRound = document.getElementById('btn-add-round');
const btnClearScorecard = document.getElementById('btn-clear-scorecard');
const btnEmptyAddPlayer = document.getElementById('btn-empty-add-player');

const modalBtnCancel = document.getElementById('modal-btn-cancel');
const modalBtnConfirm = document.getElementById('modal-btn-confirm');
const playerModalBtnCancel = document.getElementById('player-modal-btn-cancel');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  initEventListeners();
  renderApp();
});

// --- State Management ---
function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      state = JSON.parse(stored);
      // Migration for rounds metadata
      state.rounds.forEach(round => {
        if (round.guesser === undefined) round.guesser = '';
        if (round.biding === undefined) round.biding = '';
        if (round.scoreMetadata === undefined) round.scoreMetadata = '';
        if (round.sir === undefined) round.sir = '';
        if (!round.partners || !Array.isArray(round.partners)) {
          round.partners = [
            { name: '', notes: '' },
            { name: '', notes: '' },
            { name: '', notes: '' },
            { name: '', notes: '' }
          ];
        } else {
          // Ensure it has exactly 4 elements
          while (round.partners.length < 4) {
            round.partners.push({ name: '', notes: '' });
          }
        }
      });
    } catch (e) {
      console.error('Failed to parse stored state, initializing defaults', e);
      setDefaults();
    }
  } else {
    setDefaults();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setDefaults() {
  // Pre-populate with default card arena players and rounds to make the UI look stunning initially
  state.players = [
    { id: 'p_1', name: 'Alice' },
    { id: 'p_2', name: 'Bob' },
    { id: 'p_3', name: 'Charlie' }
  ];

  state.rounds = [
    {
      id: 'r_1',
      name: 'Round 1',
      scores: { 'p_1': 12, 'p_2': 15, 'p_3': -5 },
      guesser: 'Alice',
      biding: '7 Cards',
      scoreMetadata: '12',
      partners: [
        { name: 'Bob', notes: 'First call' },
        { name: 'Charlie', notes: 'Second call' },
        { name: '', notes: '' },
        { name: '', notes: '' }
      ],
      sir: 'Spades'
    },
    {
      id: 'r_2',
      name: 'Round 2',
      scores: { 'p_1': 8, 'p_2': -10, 'p_3': 20 },
      guesser: 'Bob',
      biding: '8 Cards',
      scoreMetadata: '10',
      partners: [
        { name: 'Alice', notes: 'First call' },
        { name: '', notes: '' },
        { name: '', notes: '' },
        { name: '', notes: '' }
      ],
      sir: 'Hearts'
    }
  ];
  saveState();
}

function clearState() {
  state.players = [];
  state.rounds = [];
  saveState();
  renderApp();
}

// --- Render Operations ---
function renderApp() {
  const hasPlayers = state.players.length > 0;
  const hasRounds = state.rounds.length > 0;

  // Render Badges
  roundsBadge.textContent = `${state.rounds.length} ${state.rounds.length === 1 ? 'Round' : 'Rounds'}`;
  playersBadge.textContent = `${state.players.length} ${state.players.length === 1 ? 'Player' : 'Players'}`;

  // Check Empty States
  if (!hasPlayers && !hasRounds) {
    scorecardEmptyState.classList.remove('hidden');
    leaderboardEmptyState.classList.remove('hidden');
    tableHeaderRow.innerHTML = '';
    tableBody.innerHTML = '';
    leaderboardList.innerHTML = '';
    return;
  } else {
    scorecardEmptyState.classList.add('hidden');
    leaderboardEmptyState.classList.add('hidden');
  }

  // Calculate Leaderboard data to identify the current leader
  const totals = calculateTotals();
  const leaderId = getLeaderId(totals);

  renderTableHeader();
  renderTableBody(totals, leaderId);
  renderLeaderboard(totals, leaderId);
}

// 1. Table Header
function renderTableHeader() {
  let html = `<th scope="col">Player Name</th>`;

  state.rounds.forEach((round, index) => {
    html += `
      <th scope="col" class="round-cell">
        <div class="round-header-content">
          <span class="round-header-label">${round.name}</span>
          <button class="btn-delete-round" data-round-id="${round.id}" title="Remove this round">
            &times;
          </button>
        </div>
      </th>
    `;
  });

  html += `
    <th scope="col">Total</th>
    <th scope="col">Actions</th>
  `;

  tableHeaderRow.innerHTML = html;

  // Add click handlers for round deletion
  tableHeaderRow.querySelectorAll('.btn-delete-round').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const roundId = btn.getAttribute('data-round-id');
      removeRound(roundId);
    });
  });
}

// Helper to render plain metadata row
function renderMetadataRow(label, className, fieldName, placeholder) {
  const row = document.createElement('tr');

  // First column (sticky label)
  const labelCell = document.createElement('td');
  labelCell.className = 'metadata-label-cell';
  labelCell.textContent = label;
  row.appendChild(labelCell);

  // Round columns
  state.rounds.forEach(round => {
    const td = document.createElement('td');
    td.className = 'round-cell';
    const value = round[fieldName] || '';

    td.innerHTML = `
      <input type="text" class="metadata-input ${className}" 
             data-round-id="${round.id}" value="${escapeHtml(value)}" 
             placeholder="${placeholder}">
    `;
    row.appendChild(td);
  });

  // Total & Action columns (empty)
  row.appendChild(document.createElement('td'));
  row.appendChild(document.createElement('td'));

  tableBody.appendChild(row);
}

// Helper to render partner stacked input row
function renderPartnerRow(partnerIndex) {
  const row = document.createElement('tr');

  // First column (sticky label)
  const labelCell = document.createElement('td');
  labelCell.className = 'metadata-label-cell';
  labelCell.textContent = `Partner ${partnerIndex + 1}`;
  row.appendChild(labelCell);

  // Round columns
  state.rounds.forEach(round => {
    const td = document.createElement('td');
    td.className = 'round-cell';
    const partner = (round.partners && round.partners[partnerIndex]) || { name: '', notes: '' };

    td.innerHTML = `
      <div class="partner-cell-layout">
        <div class="partner-input-wrapper">
          <input type="text" class="partner-input partner-name-input" 
                 data-round-id="${round.id}" data-partner-idx="${partnerIndex}" 
                 value="${escapeHtml(partner.name)}" placeholder="Partner Name">
        </div>
        <div class="partner-input-wrapper">
          <input type="text" class="partner-input partner-notes-input" 
                 data-round-id="${round.id}" data-partner-idx="${partnerIndex}" 
                 value="${escapeHtml(partner.notes)}" placeholder="Notes">
        </div>
      </div>
    `;
    row.appendChild(td);
  });

  // Total & Action columns (empty)
  row.appendChild(document.createElement('td'));
  row.appendChild(document.createElement('td'));

  tableBody.appendChild(row);
}

// 2. Table Body
function renderTableBody(totals, leaderId) {
  tableBody.innerHTML = '';

  state.players.forEach(player => {
    const row = document.createElement('tr');
    row.setAttribute('data-player-id', player.id);

    // Player Column
    const playerCell = document.createElement('td');
    playerCell.innerHTML = `
      <div class="player-cell-content">
        <div class="player-avatar">${getPlayerInitials(player.name)}</div>
        <input type="text" class="player-name-input" value="${escapeHtml(player.name)}" 
               data-player-id="${player.id}" maxlength="20" placeholder="Player Name">
      </div>
    `;
    row.appendChild(playerCell);

    // Rounds Score Columns
    state.rounds.forEach(round => {
      const td = document.createElement('td');
      td.className = 'round-cell';
      const score = round.scores[player.id] !== undefined ? round.scores[player.id] : '';

      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'score-input';
      if (score !== '') {
        input.value = score;
        if (score > 0) input.classList.add('positive');
        if (score < 0) input.classList.add('negative');
      }
      input.placeholder = '0';
      input.setAttribute('data-player-id', player.id);
      input.setAttribute('data-round-id', round.id);

      td.appendChild(input);
      row.appendChild(td);
    });

    // Total Column
    const totalCell = document.createElement('td');
    const playerTotal = totals[player.id] || 0;
    const isLeader = player.id === leaderId && playerTotal !== 0;

    totalCell.innerHTML = `
      <span class="total-cell-badge ${isLeader ? 'leader-glow' : ''}" id="total-${player.id}">
        ${playerTotal}
      </span>
    `;
    row.appendChild(totalCell);

    // Action Column (Delete Player)
    const actionCell = document.createElement('td');
    actionCell.innerHTML = `
      <button class="btn-delete-row" data-player-id="${player.id}" title="Remove player">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
        </svg>
      </button>
    `;
    row.appendChild(actionCell);

    tableBody.appendChild(row);
  });

  // Render Metadata divider and rows if we have rounds and players
  if (state.rounds.length > 0) {
    const dividerRow = document.createElement('tr');

    // Sticky label cell
    const labelCell = document.createElement('td');
    labelCell.className = 'metadata-divider-label';
    labelCell.textContent = 'Round Info';
    dividerRow.appendChild(labelCell);

    // Round divider cells
    state.rounds.forEach(round => {
      const td = document.createElement('td');
      td.className = 'metadata-divider-cell round-cell';
      dividerRow.appendChild(td);
    });

    // Total & Action spacer cells
    const tdTotal = document.createElement('td');
    tdTotal.className = 'metadata-divider-cell';
    dividerRow.appendChild(tdTotal);

    const tdAction = document.createElement('td');
    tdAction.className = 'metadata-divider-cell';
    dividerRow.appendChild(tdAction);

    tableBody.appendChild(dividerRow);

    // Render metadata rows
    renderMetadataRow('Guesser', 'guesser-input', 'guesser', 'Guesser Name');
    renderMetadataRow('Biding of', 'biding-input', 'biding', 'Bid');
    renderMetadataRow('Score', 'score-metadata-input', 'scoreMetadata', 'Score info');
    renderPartnerRow(0);
    renderPartnerRow(1);
    renderPartnerRow(2);
    renderPartnerRow(3);
    renderMetadataRow('Sir', 'sir-input', 'sir', 'Sir Details');
  }

  // Attach event listeners inside table body
  initTableInputs();
}

// 3. Leaderboard list
function renderLeaderboard(totals, leaderId) {
  leaderboardList.innerHTML = '';

  if (state.players.length === 0) {
    leaderboardEmptyState.classList.remove('hidden');
    return;
  } else {
    leaderboardEmptyState.classList.add('hidden');
  }

  // Create list of players with totals and ranks
  const sorted = state.players.map(player => ({
    ...player,
    total: totals[player.id] || 0
  })).sort((a, b) => b.total - a.total);

  sorted.forEach((player, index) => {
    const isLeader = player.id === leaderId && player.total !== 0;
    const rank = index + 1;

    const li = document.createElement('li');
    li.className = `leaderboard-item ${isLeader ? 'leader' : ''}`;
    li.setAttribute('data-rank-player-id', player.id);

    li.innerHTML = `
      <div class="leader-item-left">
        <div class="leader-rank-badge">${rank}</div>
        <div class="leader-avatar">${getPlayerInitials(player.name)}</div>
        <div class="leader-name" id="lb-name-${player.id}">${escapeHtml(player.name)}</div>
      </div>
      <div class="leader-score-display">
        <span class="leader-score-value">${player.total}</span>
        ${isLeader ? `
          <span class="crown-icon" title="Current Leader">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M5,16L3,5L8.5,10L12,4L15.5,10L21,5L19,16H5M19,19A1,1 0 0,1 18,20H6A1,1 0 0,1 5,19V18H19V19Z" />
            </svg>
          </span>
        ` : ''}
      </div>
    `;

    leaderboardList.appendChild(li);
  });
}

// --- Dynamic Score Input Management ---
function initTableInputs() {
  // Score Input Event Listeners
  const scoreInputs = tableBody.querySelectorAll('.score-input');
  scoreInputs.forEach(input => {
    input.addEventListener('input', (e) => {
      const playerId = input.getAttribute('data-player-id');
      const roundId = input.getAttribute('data-round-id');
      const val = input.value === '' ? '' : parseInt(input.value);

      // Update styling class based on value
      input.classList.remove('positive', 'negative');
      if (typeof val === 'number') {
        if (val > 0) input.classList.add('positive');
        if (val < 0) input.classList.add('negative');
      }

      updateScoreValue(playerId, roundId, val);
    });

    // Handle cursor navigation (Arrow keys, Enter, Tab)
    input.addEventListener('keydown', (e) => {
      const parentTd = input.parentElement;
      const parentTr = parentTd.parentElement;
      const cellIndex = Array.from(parentTr.children).indexOf(parentTd);

      if (e.key === 'Enter') {
        e.preventDefault();
        // Move to next row cell index
        const nextTr = parentTr.nextElementSibling;
        if (nextTr) {
          const targetInput = nextTr.children[cellIndex].querySelector('.score-input');
          if (targetInput) targetInput.focus();
        }
      } else if (e.key === 'ArrowDown') {
        const nextTr = parentTr.nextElementSibling;
        if (nextTr) {
          const targetInput = nextTr.children[cellIndex].querySelector('.score-input');
          if (targetInput) targetInput.focus();
        }
      } else if (e.key === 'ArrowUp') {
        const prevTr = parentTr.previousElementSibling;
        if (prevTr) {
          const targetInput = prevTr.children[cellIndex].querySelector('.score-input');
          if (targetInput) targetInput.focus();
        }
      } else if (e.key === 'ArrowRight' && input.selectionEnd === input.value.length) {
        const nextTd = parentTd.nextElementSibling;
        if (nextTd) {
          const targetInput = nextTd.querySelector('.score-input');
          if (targetInput) targetInput.focus();
        }
      } else if (e.key === 'ArrowLeft' && input.selectionStart === 0) {
        const prevTd = parentTd.previousElementSibling;
        if (prevTd) {
          const targetInput = prevTd.querySelector('.score-input');
          if (targetInput) targetInput.focus();
        }
      }
    });
  });

  // Player Name Input Event Listeners
  const nameInputs = tableBody.querySelectorAll('.player-name-input');
  nameInputs.forEach(input => {
    input.addEventListener('input', (e) => {
      const playerId = input.getAttribute('data-player-id');
      const newName = input.value.trim() || 'Player';

      // Update name in state
      const playerIndex = state.players.findIndex(p => p.id === playerId);
      if (playerIndex !== -1) {
        state.players[playerIndex].name = newName;
        saveState();

        // Update initials avatar in row
        const avatar = input.previousElementSibling;
        if (avatar) avatar.textContent = getPlayerInitials(newName);

        // Update name in leaderboard directly to avoid layout flash
        const lbName = document.getElementById(`lb-name-${playerId}`);
        if (lbName) lbName.textContent = newName;

        // Update initials in leaderboard avatar
        const lbItem = document.querySelector(`[data-rank-player-id="${playerId}"]`);
        if (lbItem) {
          const lbAvatar = lbItem.querySelector('.leader-avatar');
          if (lbAvatar) lbAvatar.textContent = getPlayerInitials(newName);
        }
      }
    });

    input.addEventListener('blur', () => {
      // Re-render fully on blur to clean up any duplicate names or formatting
      renderApp();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        input.blur();
      }
    });
  });

  // Delete Player row buttons
  const deleteRowBtns = tableBody.querySelectorAll('.btn-delete-row');
  deleteRowBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const playerId = btn.getAttribute('data-player-id');
      removePlayer(playerId);
    });
  });

  // Guesser Input Event Listeners
  const guesserInputs = tableBody.querySelectorAll('.guesser-input');
  guesserInputs.forEach(input => {
    input.addEventListener('input', () => {
      const roundId = input.getAttribute('data-round-id');
      updateRoundGuesser(roundId, input.value);
    });
  });

  // Biding Input Event Listeners
  const bidingInputs = tableBody.querySelectorAll('.biding-input');
  bidingInputs.forEach(input => {
    input.addEventListener('input', () => {
      const roundId = input.getAttribute('data-round-id');
      updateRoundBiding(roundId, input.value);
    });
  });

  // Score Metadata Input Event Listeners
  const scoreMetadataInputs = tableBody.querySelectorAll('.score-metadata-input');
  scoreMetadataInputs.forEach(input => {
    input.addEventListener('input', () => {
      const roundId = input.getAttribute('data-round-id');
      updateRoundScoreMetadata(roundId, input.value);
    });
  });

  // Sir Input Event Listeners
  const sirInputs = tableBody.querySelectorAll('.sir-input');
  sirInputs.forEach(input => {
    input.addEventListener('input', () => {
      const roundId = input.getAttribute('data-round-id');
      updateRoundSir(roundId, input.value);
    });
  });

  // Partner Name Input Event Listeners
  const partnerNameInputs = tableBody.querySelectorAll('.partner-name-input');
  partnerNameInputs.forEach(input => {
    input.addEventListener('input', () => {
      const roundId = input.getAttribute('data-round-id');
      const partnerIdx = parseInt(input.getAttribute('data-partner-idx'));
      updateRoundPartner(roundId, partnerIdx, 'name', input.value);
    });
  });

  // Partner Notes Input Event Listeners
  const partnerNotesInputs = tableBody.querySelectorAll('.partner-notes-input');
  partnerNotesInputs.forEach(input => {
    input.addEventListener('input', () => {
      const roundId = input.getAttribute('data-round-id');
      const partnerIdx = parseInt(input.getAttribute('data-partner-idx'));
      updateRoundPartner(roundId, partnerIdx, 'notes', input.value);
    });
  });
}

// --- Scorecard Helper Calculations ---
function calculateTotals() {
  const totals = {};
  state.players.forEach(p => {
    totals[p.id] = 0;
  });

  state.rounds.forEach(round => {
    state.players.forEach(p => {
      const score = parseInt(round.scores[p.id]) || 0;
      totals[p.id] += score;
    });
  });

  return totals;
}

function getLeaderId(totals) {
  let leaderId = null;
  let maxScore = -Infinity;
  let hasScore = false;

  state.players.forEach(p => {
    const score = totals[p.id] || 0;
    // Check if any player has scores entered
    state.rounds.forEach(round => {
      if (round.scores[p.id] !== undefined && round.scores[p.id] !== '') {
        hasScore = true;
      }
    });

    if (score > maxScore) {
      maxScore = score;
      leaderId = p.id;
    } else if (score === maxScore && leaderId !== null) {
      // In case of a tie, let's keep the first leader, or we can handle ties,
      // but for simplicity we keep the first one.
    }
  });

  return hasScore ? leaderId : null;
}

function updateScoreValue(playerId, roundId, value) {
  const round = state.rounds.find(r => r.id === roundId);
  if (round) {
    if (value === '') {
      delete round.scores[playerId];
    } else {
      round.scores[playerId] = value;
    }
    saveState();

    // Live update total and leaderboard without table rebuild
    const totals = calculateTotals();
    const leaderId = getLeaderId(totals);

    // Update total badge text
    const totalBadge = document.getElementById(`total-${playerId}`);
    if (totalBadge) {
      totalBadge.textContent = totals[playerId] || 0;
    }

    // Refresh leader glows for all totals
    state.players.forEach(p => {
      const tb = document.getElementById(`total-${p.id}`);
      if (tb) {
        if (p.id === leaderId && totals[p.id] !== 0) {
          tb.classList.add('leader-glow');
        } else {
          tb.classList.remove('leader-glow');
        }
      }
    });

    // Re-render leaderboard list to reflect positions immediately
    renderLeaderboard(totals, leaderId);
  }
}

// --- Player Operations ---
function addPlayer(name) {
  const playerId = 'p_' + Date.now();
  state.players.push({ id: playerId, name: name });

  // Make sure new player has empty scores for all rounds
  state.rounds.forEach(round => {
    round.scores[playerId] = '';
  });

  saveState();
  renderApp();
}

function removePlayer(playerId) {
  state.players = state.players.filter(p => p.id !== playerId);

  // Clean scores
  state.rounds.forEach(round => {
    delete round.scores[playerId];
  });

  saveState();
  renderApp();
}

// --- Round Operations ---
function addRound() {
  const roundNumber = state.rounds.length + 1;
  const roundId = 'r_' + Date.now();

  state.rounds.push({
    id: roundId,
    name: `Round ${roundNumber}`,
    scores: {},
    guesser: '',
    biding: '',
    scoreMetadata: '',
    partners: [
      { name: '', notes: '' },
      { name: '', notes: '' },
      { name: '', notes: '' },
      { name: '', notes: '' }
    ],
    sir: ''
  });

  saveState();
  renderApp();
}

function removeRound(roundId) {
  state.rounds = state.rounds.filter(r => r.id !== roundId);

  // Re-index remaining rounds
  state.rounds.forEach((round, index) => {
    round.name = `Round ${index + 1}`;
  });

  saveState();
  renderApp();
}

// --- Metadata Operations ---
function updateRoundGuesser(roundId, value) {
  const round = state.rounds.find(r => r.id === roundId);
  if (round) {
    round.guesser = value;
    saveState();
  }
}

function updateRoundBiding(roundId, value) {
  const round = state.rounds.find(r => r.id === roundId);
  if (round) {
    round.biding = value;
    saveState();
  }
}

function updateRoundScoreMetadata(roundId, value) {
  const round = state.rounds.find(r => r.id === roundId);
  if (round) {
    round.scoreMetadata = value;
    saveState();
  }
}

function updateRoundSir(roundId, value) {
  const round = state.rounds.find(r => r.id === roundId);
  if (round) {
    round.sir = value;
    saveState();
  }
}

function updateRoundPartner(roundId, partnerIdx, field, value) {
  const round = state.rounds.find(r => r.id === roundId);
  if (round && round.partners && round.partners[partnerIdx]) {
    round.partners[partnerIdx][field] = value;
    saveState();
  }
}

// --- Auxiliary Helpers ---
function getPlayerInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// --- Event Listeners Setup ---
function initEventListeners() {
  // Add Player Triggers
  btnAddPlayer.addEventListener('click', () => {
    newPlayerNameInput.value = '';
    addPlayerModal.classList.remove('hidden');
    newPlayerNameInput.focus();
  });

  btnEmptyAddPlayer.addEventListener('click', () => {
    newPlayerNameInput.value = '';
    addPlayerModal.classList.remove('hidden');
    newPlayerNameInput.focus();
  });

  playerModalBtnCancel.addEventListener('click', () => {
    addPlayerModal.classList.add('hidden');
  });

  addPlayerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = newPlayerNameInput.value.trim();
    if (name) {
      addPlayer(name);
      addPlayerModal.classList.add('hidden');
    }
  });

  // Add Round Trigger
  btnAddRound.addEventListener('click', () => {
    addRound();
  });

  // Clear Scorecard Triggers
  btnClearScorecard.addEventListener('click', () => {
    clearConfirmModal.classList.remove('hidden');
  });

  modalBtnCancel.addEventListener('click', () => {
    clearConfirmModal.classList.add('hidden');
  });

  modalBtnConfirm.addEventListener('click', () => {
    clearState();
    clearConfirmModal.classList.add('hidden');
  });

  // Close modals when clicking outside modal-content
  window.addEventListener('click', (e) => {
    if (e.target === addPlayerModal) {
      addPlayerModal.classList.add('hidden');
    }
    if (e.target === clearConfirmModal) {
      clearConfirmModal.classList.add('hidden');
    }
  });
}
