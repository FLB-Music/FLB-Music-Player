(() => {
  const $ = (id) => document.getElementById(id);
  const state = { baseUrl: '', guestId: '', guestName: '', source: null, searchTimer: null, toastTimer: null };
  const saved = JSON.parse(localStorage.getItem('flb-party-session') || 'null');

  function normalizeHost(value) {
    let host = value.trim();
    if (!/^https?:\/\//i.test(host)) host = `http://${host}`;
    const parsed = new URL(host);
    if (!parsed.port) parsed.port = '47831';
    return parsed.origin;
  }

  function showToast(message) {
    const toast = $('toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
  }

  function setConnected(connected) {
    const badge = $('connectionBadge');
    badge.textContent = connected ? 'Conectado' : 'Reconectando…';
    badge.classList.toggle('online', connected);
  }

  async function api(path, options = {}) {
    const response = await fetch(`${state.baseUrl}${path}`, {
      ...options,
      headers: { ...(options.body instanceof File ? {} : { 'Content-Type': 'application/json' }), 'x-guest-id': state.guestId, ...(options.headers || {}) },
    });
    const data = options.raw ? response : await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `http_${response.status}`);
    return data;
  }

  function trackRow(track, index, addable = false) {
    const row = document.createElement('div');
    row.className = 'track-row';
    const number = document.createElement('span');
    number.className = 'track-number';
    number.textContent = addable ? '♫' : String(index + 1).padStart(2, '0');
    const copy = document.createElement('div');
    copy.className = 'track-copy';
    const title = document.createElement('p');
    title.className = 'track-title';
    title.textContent = track.title || 'Faixa sem título';
    const subtitle = document.createElement('p');
    subtitle.className = 'track-subtitle';
    subtitle.textContent = [track.artist, track.suggestedBy && `por ${track.suggestedBy.guestName}`].filter(Boolean).join(' · ');
    copy.append(title, subtitle);
    row.append(number, copy);
    if (addable) {
      const button = document.createElement('button');
      button.className = 'add-button';
      button.type = 'button';
      button.textContent = '+';
      button.setAttribute('aria-label', `Adicionar ${track.title}`);
      button.addEventListener('click', async () => {
        button.disabled = true;
        try {
          await api('/api/add', { method: 'POST', body: JSON.stringify({ trackId: track.id }) });
          showToast('Adicionada à fila da festa');
          refreshQueue();
        } catch (error) { showToast(error.message === 'slow_down' ? 'Aguarde um pouco para adicionar outra.' : 'Não foi possível adicionar.'); }
        button.disabled = false;
      });
      row.append(button);
    }
    return row;
  }

  function renderQueue(payload) {
    const queue = payload.queue || [];
    $('queueList').replaceChildren(...queue.map(trackRow));
    $('queueCount').textContent = String(queue.length);
    $('emptyQueue').classList.toggle('hidden', queue.length > 0);
    const current = payload.nowPlaying;
    $('nowTitle').textContent = current ? current.title : 'Aguardando música';
    $('nowArtist').textContent = current ? current.artist : 'A festa ainda vai começar';
  }

  async function refreshQueue() {
    try { renderQueue(await api('/api/queue')); } catch (_) { /* SSE will retry connection status. */ }
  }

  function connectEvents() {
    if (state.source) state.source.close();
    state.source = new EventSource(`${state.baseUrl}/api/events?guestId=${encodeURIComponent(state.guestId)}`);
    state.source.addEventListener('queue', (event) => {
      try { renderQueue(JSON.parse(event.data)); setConnected(true); } catch (_) { /* Ignore malformed event frames. */ }
    });
    state.source.onopen = () => setConnected(true);
    state.source.onerror = () => setConnected(false);
    state.source.addEventListener('session-ended', () => {
      showToast('O anfitrião encerrou a festa');
      leaveParty(false);
    });
  }

  async function joinParty(hostInput, code, guestName, restore = false) {
    state.baseUrl = normalizeHost(hostInput);
    state.guestName = guestName;
    setConnected(false);
    $('joinError').textContent = '';
    let data;
    if (restore && saved && saved.guestId) {
      state.guestId = saved.guestId;
      try { await api('/api/queue'); data = saved; } catch (_) { state.guestId = ''; }
    }
    if (!state.guestId) {
      const response = await fetch(`${state.baseUrl}/api/session`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.replace(/\D/g, '').slice(0, 6), name: guestName }),
      });
      data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Não foi possível entrar na festa.');
      state.guestId = data.guestId;
    }
    localStorage.setItem('flb-party-session', JSON.stringify({ hostInput, code, guestName, guestId: state.guestId }));
    $('joinView').classList.add('hidden');
    $('partyView').classList.remove('hidden');
    connectEvents();
    await refreshQueue();
  }

  function leaveParty(notifyHost = true) {
    if (state.source) state.source.close();
    state.source = null;
    if (notifyHost && state.guestId && state.baseUrl) {
      fetch(`${state.baseUrl}/api/leave`, { method: 'POST', headers: { 'x-guest-id': state.guestId } }).catch(() => undefined);
    }
    state.guestId = '';
    localStorage.removeItem('flb-party-session');
    $('partyView').classList.add('hidden');
    $('joinView').classList.remove('hidden');
    setConnected(false);
  }

  $('joinForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try { await joinParty($('hostAddress').value, $('roomCode').value, $('guestName').value.trim()); }
    catch (error) {
      const errors = { wrong_code: 'Código incorreto.', locked: 'Muitas tentativas. Aguarde antes de tentar novamente.', too_many_requests: 'Muitas tentativas. Aguarde um instante.', party_closed: 'Esta festa foi encerrada.', failed_to_fetch: 'Confira o endereço do PC e a conexão Wi-Fi.' };
      $('joinError').textContent = errors[error.message] || 'Não foi possível conectar. Confira o endereço e o código.';
    }
  });

  $('leaveButton').addEventListener('click', () => leaveParty());
  document.querySelectorAll('.tab').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab === button));
    ['queue', 'tracks', 'upload'].forEach((tab) => $(`${tab}Pane`).classList.toggle('hidden', tab !== button.dataset.tab));
    if (button.dataset.tab === 'tracks' && !$('searchInput').value) searchTracks('');
  }));

  async function searchTracks(query) {
    const empty = $('searchEmpty');
    empty.textContent = 'Buscando na biblioteca…';
    try {
      const result = await api(`/api/tracks?q=${encodeURIComponent(query)}&limit=60`);
      const tracks = result.tracks || [];
      $('searchResults').replaceChildren(...tracks.map((track, index) => trackRow(track, index, true)));
      empty.textContent = tracks.length ? '' : 'Nenhuma música encontrada.';
      empty.classList.toggle('hidden', tracks.length > 0);
    } catch (_) { empty.textContent = 'Não foi possível buscar músicas.'; }
  }

  $('searchInput').addEventListener('input', () => {
    clearTimeout(state.searchTimer);
    state.searchTimer = setTimeout(() => searchTracks($('searchInput').value.trim()), 280);
  });

  $('audioFile').addEventListener('change', async () => {
    const file = $('audioFile').files && $('audioFile').files[0];
    if (!file) return;
    $('uploadStatus').textContent = `Enviando ${file.name}…`;
    try {
      const response = await fetch(`${state.baseUrl}/api/upload?name=${encodeURIComponent(file.name)}`, { method: 'POST', headers: { 'x-guest-id': state.guestId }, body: file });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'upload_failed');
      $('uploadStatus').textContent = 'Música enviada para a fila!';
      showToast('Música enviada para a festa');
      refreshQueue();
    } catch (error) {
      $('uploadStatus').textContent = error.message === 'slow_down' ? 'Aguarde antes de enviar outro arquivo.' : error.message === 'unsupported_format' ? 'Este formato de áudio não é aceito.' : 'Não foi possível enviar. Limite de 60 MB por arquivo.';
    }
    $('audioFile').value = '';
  });

  if (saved && saved.hostInput && saved.guestName) {
    $('hostAddress').value = saved.hostInput;
    $('roomCode').value = saved.code || '';
    $('guestName').value = saved.guestName;
    joinParty(saved.hostInput, saved.code, saved.guestName, true).catch(() => leaveParty(false));
  }
})();
