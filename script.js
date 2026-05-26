const API_BASE = 'https://pokeapi.co/api/v2';
const pokemonListElement = document.getElementById('pokemonList');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const loadMoreButton = document.getElementById('loadMoreButton');

let nextUrl = `${API_BASE}/pokemon?limit=20`;
let loading = false;

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Gagal memuat data dari PokeAPI');
  }
  return response.json();
}

function createPokemonCard(pokemon) {
  const card = document.createElement('article');
  card.className = 'pokemon-card';

  const types = pokemon.types.map((item) => item.type.name).join(', ');
  const statsHtml = pokemon.stats
    .map(
      (stat) => `
      <div class="stat-row">
        <span class="stat-name">${stat.stat.name}</span>
        <span class="stat-value">${stat.base_stat}</span>
      </div>`
    )
    .join('');

  card.innerHTML = `
    <header>
      <h2>${pokemon.name}</h2>
      <span class="id">#${pokemon.id.toString().padStart(3, '0')}</span>
    </header>
    <img src="${pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default}" alt="${pokemon.name}" />
    <div class="badges">
      ${pokemon.types
        .map((item) => `<span class="badge">${item.type.name}</span>`)
        .join('')}
    </div>
    <div class="stats">
      ${statsHtml}
    </div>
    <p class="type-info">Tipe: ${types}</p>
  `;

  return card;
}

function showEmptyState(message) {
  pokemonListElement.innerHTML = `
    <div class="empty-state">
      <p>${message}</p>
    </div>
  `;
}

async function loadPokemonList() {
  if (loading || !nextUrl) return;
  loading = true;
  loadMoreButton.textContent = 'Memuat...';

  try {
    const data = await fetchJson(nextUrl);
    nextUrl = data.next;

    const promises = data.results.map((pokemon) => fetchJson(pokemon.url));
    const pokemons = await Promise.all(promises);

    if (pokemons.length === 0 && pokemonListElement.children.length === 0) {
      showEmptyState('Tidak ada Pokémon yang dapat ditampilkan.');
      return;
    }

    pokemons.forEach((pokemon) => pokemonListElement.appendChild(createPokemonCard(pokemon)));
  } catch (error) {
    showEmptyState('Terjadi kesalahan saat memuat data Pokémon. Silakan coba lagi.');
    console.error(error);
  } finally {
    loading = false;
    loadMoreButton.textContent = nextUrl ? 'Muat lebih banyak Pokémon' : 'Semua Pokémon dimuat';
    loadMoreButton.disabled = !nextUrl;
  }
}

async function searchPokemon() {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) {
    pokemonListElement.innerHTML = '';
    nextUrl = `${API_BASE}/pokemon?limit=20`;
    loadPokemonList();
    return;
  }

  pokemonListElement.innerHTML = '';
  loadMoreButton.disabled = true;
  loadMoreButton.textContent = 'Muat lebih banyak Pokémon';

  try {
    const pokemon = await fetchJson(`${API_BASE}/pokemon/${encodeURIComponent(query)}`);
    pokemonListElement.appendChild(createPokemonCard(pokemon));
  } catch (error) {
    showEmptyState('Pokémon tidak ditemukan. Gunakan nama atau ID yang valid.');
    console.error(error);
  }
}

searchButton.addEventListener('click', searchPokemon);
searchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    searchPokemon();
  }
});
loadMoreButton.addEventListener('click', loadPokemonList);

loadPokemonList();
