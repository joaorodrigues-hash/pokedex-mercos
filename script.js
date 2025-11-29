// ========================================================
// NÍVEL 1 — BUSCAR POKEMON INDIVIDUAL
// ========================================================

async function buscarPokemon() {
  const nome = document.getElementById("searchInput").value.toLowerCase();
  if (!nome) return;

  document.getElementById("loading").classList.remove("hidden");
  document.getElementById("error").classList.add("hidden");
  
  const card = document.getElementById("pokemon-card");
  const estavaVisivel = card.classList.contains("visible");

  // Se o card estiver aberto, inicia a animação de fechar
  if (estavaVisivel) {
      fecharCard();
  }

  // **CORREÇÃO DO BUG**:
  // Espera a animação de fechar (400ms) terminar ANTES de buscar o novo
  // Se o card já estava fechado (estavaVisivel = false), espera 0ms
  setTimeout(async () => {
      try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${nome}`);
        if (!response.ok) throw new Error("Pokémon não encontrado");
        const pokemon = await response.json();
        exibirPokemon(pokemon); // Exibe o novo card
      } catch (error) {
        document.getElementById("error").classList.remove("hidden");
      }
      document.getElementById("loading").classList.add("hidden");
  }, estavaVisivel ? 400 : 0); // 400ms = tempo da transição no CSS
}

// ========================================================
// FUNÇÃO PARA FECHAR O CARD
// ========================================================
function fecharCard() {
    const card = document.getElementById("pokemon-card");
    card.classList.remove("visible"); // Inicia a animação de "fechar"
}


// ========================================================
// EXIBIR POKEMON INDIVIDUAL (COM BOTÃO DE FECHAR)
// ========================================================

async function exibirPokemon(pokemon) {
  const card = document.getElementById("pokemon-card");

  // Limpa o conteúdo antigo e reseta a cor de fundo
  card.innerHTML = ""; 
  card.className = `pokemon-card type-${pokemon.types[0].type.name}-bg`;

  const altura = pokemon.height / 10;
  const peso = pokemon.weight / 10;

  const tipos = pokemon.types
    .map(t => `<span class="type type-${t.type.name}">${t.type.name}</span>`)
    .join("");

  card.innerHTML = `
    
    <button class="close-btn" onclick="fecharCard()">✖</button>
    
    <h2>${pokemon.name} (#${pokemon.id})</h2>
    
    <div class="sprite-gallery-wrapper">
        <div class="sprite-gallery">
            <img src="${pokemon.sprites.front_default}" alt="${pokemon.name} Normal" id="default-sprite">
            <img src="${pokemon.sprites.front_shiny}" alt="${pokemon.name} Shiny" id="shiny-sprite" class="hidden">
            <img src="${pokemon.sprites.other["official-artwork"].front_default}" alt="${pokemon.name} Artwork" id="artwork-sprite" class="hidden artwork">
        </div>
        <div class="sprite-toggles">
            <button onclick="changeSprite('default')">Normal</button>
            <button onclick="changeSprite('shiny')">⭐ Shiny</button>
            <button onclick="changeSprite('artwork')">🖼️ Artwork</button>
        </div>
    </div>

    <div class="card-content-grid">
        <div class="info-column">
            <div class="detail-section">
                <h3>Detalhes Básicos</h3>
                <p><strong>Altura:</strong> ${altura} m</p>
                <p><strong>Peso:</strong> ${peso} kg</p>
                <p><strong>Tipos:</strong> ${tipos}</p>
            </div>
            <div id="abilities-container" class="detail-section">
                <h3>Habilidades</h3>
                <div id="abilities">Carregando...</div>
            </div>
            <div id="defense-container" class="detail-section">
                <h3>Defesa (Tipos)</h3>
                <div id="weakness-resistance">Carregando...</div>
            </div>
        </div>
        <div class="stats-column">
            <div id="stats-container" class="detail-section">
              <h3>Status</h3>
              <div id="stats"></div>
            </div>
            <div id="moves-container" class="detail-section">
                <h3>Golpes Principais (4)</h3>
                <div id="moves">Carregando...</div>
            </div>
            <div id="evolution-container" class="detail-section">
              <h3>Evolução</h3>
              <div id="evolution"></div>
            </div>
        </div>
    </div>
  `;

  // Chama as funções para preencher o conteúdo
  exibirHabilidades(pokemon);
  exibirDefesas(pokemon);
  exibirStats(pokemon);
  exibirMoves(pokemon);
  exibirEvolucao(pokemon);
  
  // Adiciona a classe .visible para iniciar a animação de "abrir"
  setTimeout(() => {
    card.classList.add("visible");
  }, 10); // Delay mínimo para garantir que a transição CSS "pegue"
}

// Funções para troca de sprite
function changeSprite(mode) {
    document.getElementById("default-sprite").classList.add("hidden");
    document.getElementById("shiny-sprite").classList.add("hidden");
    document.getElementById("artwork-sprite").classList.add("hidden");

    if (mode === 'default') {
        document.getElementById("default-sprite").classList.remove("hidden");
    } else if (mode === 'shiny') {
        document.getElementById("shiny-sprite").classList.remove("hidden");
    } else if (mode === 'artwork') {
        document.getElementById("artwork-sprite").classList.remove("hidden");
    }
}


// ========================================================
// UPGRADE 1: HABILIDADES COM DESCRIÇÃO
// ========================================================
async function exibirHabilidades(pokemon) {
    const container = document.getElementById("abilities");
    if (!container) return; // Checagem de segurança
    container.innerHTML = "";
    
    const abilitiesHTML = await Promise.all(
        pokemon.abilities.map(async (a) => {
            const resp = await fetch(a.ability.url);
            const data = await resp.json();
            
            const description = data.effect_entries.find(e => e.language.name === 'en')?.short_effect || 
                                data.effect_entries[0]?.short_effect || "Descrição não disponível.";

            return `
                <div class="ability-item">
                    <strong>${a.ability.name}</strong>
                    <p class="ability-desc">${description}</p>
                </div>
            `;
        })
    );
    container.innerHTML = `<div class="abilities-list">${abilitiesHTML.join('')}</div>`;
}


// ========================================================
// UPGRADE 2: GOLPES (MOVES) COM DADOS DETALHADOS
// ========================================================
async function exibirMoves(pokemon) {
    const container = document.getElementById("moves");
    if (!container) return;
    container.innerHTML = "Carregando...";
    
    const levelUpMoves = pokemon.moves.filter(m => 
        m.version_group_details.some(v => v.move_learn_method.name === 'level-up')
    ).slice(0, 4); 

    if (levelUpMoves.length === 0) {
        container.innerHTML = "Nenhum golpe de ataque listado.";
        return;
    }

    const movesHTML = await Promise.all(
        levelUpMoves.map(async (m) => {
            const resp = await fetch(m.move.url);
            const data = await resp.json();
            
            const power = data.power || "-";
            const accuracy = data.accuracy || "-";
            const type = data.type.name;

            return `
                <div class="move-item type-${type}">
                    <div class="move-name"><strong>${m.move.name}</strong></div>
                    <div class="move-data">
                        <span class="type type-${type}">${type}</span> | Pwr: ${power} | Acc: ${accuracy}
                    </div>
                </div>
            `;
        })
    );
    container.innerHTML = `<div class="moves-list">${movesHTML.join('')}</div>`;
}


// ========================================================
// UPGRADE 3: FRAQUEZAS E RESISTÊNCIAS
// ========================================================
async function exibirDefesas(pokemon) {
    const container = document.getElementById("weakness-resistance");
    if (!container) return;
    container.innerHTML = "Analisando tipos...";
    
    const url = pokemon.types[0].type.url; 

    try {
        const typeResp = await fetch(url);
        const typeData = await typeResp.json();
        
        const damageRelations = typeData.damage_relations;
        
        let defenses = {
            "Fraquezas (2x)": damageRelations.double_damage_from,
            "Resistências (0.5x)": damageRelations.half_damage_from,
            "Imunidades (0x)": damageRelations.no_damage_from
        };

        let defenseHTML = '';
        for (const [key, types] of Object.entries(defenses)) {
            if (types.length > 0) {
                const typeTags = types
                    .map(t => `<span class="type type-${t.name}">${t.name}</span>`)
                    .join("");
                
                defenseHTML += `
                    <div class="defense-group">
                        <strong>${key}:</strong> ${typeTags}
                    </div>
                `;
            }
        }
        
        container.innerHTML = defenseHTML || "Nenhuma relação de dano especial encontrada.";

    } catch (error) {
        container.innerHTML = "Erro ao carregar defesas.";
    }
}


// ========================================================
// STATS — BARRAS ANIMADAS PREMIUM (NEUMORPHISM)
// ========================================================

function exibirStats(pokemon) {
  const statsContainer = document.getElementById("stats");
  if (!statsContainer) return;
  statsContainer.innerHTML = "";

  pokemon.stats.forEach(stat => {
    const nome = stat.stat.name;
    const valor = stat.base_stat;

    const linha = `
      <div class="stat-row">
        <div class="stat-name">${nome}</div>
        <div class="stat-bar">
          <div class="stat-fill" style="width: 0%"></div>
        </div>
        <div class="stat-value">${valor}</div>
      </div>
    `;

    statsContainer.innerHTML += linha;
  });

  requestAnimationFrame(() => {
    const barras = document.querySelectorAll("#stats-container .stat-fill");
    barras.forEach((bar, i) => {
      const valor = pokemon.stats[i].base_stat;
      const porcentagem = Math.min((valor / 150) * 100, 100);
      bar.style.width = porcentagem + "%";
    });
  });
}


// ========================================================
// EVOLUTION CHAIN — COMPLETA E LINDA
// ========================================================

async function exibirEvolucao(pokemon) {
  const evoContainer = document.getElementById("evolution");
  if (!evoContainer) return;
  evoContainer.innerHTML = "Carregando...";

  try {
    const speciesResp = await fetch(pokemon.species.url);
    const speciesData = await speciesResp.json();
    const evoResp = await fetch(speciesData.evolution_chain.url);
    const evoData = await evoResp.json();
    let cadeia = [];
    let atual = evoData.chain;

    while (atual) {
      cadeia.push(atual.species.name);
      if (atual.evolves_to.length > 0) {
        atual = atual.evolves_to[0];
      } else {
        atual = null;
      }
    }

    let evolutionHTML = `<div class="evolution-row">`;
    for (let i = 0; i < cadeia.length; i++) {
      const nome = cadeia[i];
      const resp = await fetch(`https://pokeapi.co/api/v2/pokemon/${nome}`);
      const data = await resp.json();

      evolutionHTML += `
        <div class="evo-item">
          <img src="${data.sprites.front_default}">
          <div class="evo-name">${nome}</div>
        </div>
      `;
      if (i < cadeia.length - 1) {
        evolutionHTML += `<div class="evo-arrow">→</div>`;
      }
    }

    evolutionHTML += `</div>`;
    evoContainer.innerHTML = evolutionHTML;

  } catch (error) {
    evoContainer.innerHTML = "Evolução não disponível.";
  }
}


// ========================================================
// UPGRADE 6: GERAÇÕES (MAPA)
// ========================================================

const GEN_LIMITS = {
    1: 151, 2: 251, 3: 386, 4: 493, 5: 649, 6: 721, 7: 809, 8: 905, 9: 1025
};

// ========================================================
// NÍVEL 2 + 3 — LISTA + PAGINAÇÃO + FILTROS
// ========================================================

let paginaAtual = 0;
let currentPokemons = [];
let allPokemonDetails = []; 


async function carregarPokemons() {
  const offset = paginaAtual * 20;
  const url = `https://pokeapi.co/api/v2/pokemon?limit=20&offset=${offset}`; 

  document.getElementById("pokemon-list").innerHTML = "Carregando lista...";

  try {
      const resposta = await fetch(url);
      const dados = await resposta.json();
      currentPokemons = dados.results;

      allPokemonDetails = await Promise.all(
          currentPokemons.map(async (p) => {
              const resp = await fetch(p.url);
              return await resp.json();
          })
      );
      
      document.getElementById("page-number").innerText = `Página ${paginaAtual + 1}`;
      mostrarListaFiltrada();

  } catch (error) {
      document.getElementById("pokemon-list").innerHTML = "<p>Erro ao carregar a lista de Pokémon.</p>";
  }
}


async function mostrarListaFiltrada() {
  const search = document.getElementById("listSearch")?.value.toLowerCase() || "";
  const type = document.getElementById("typeFilter")?.value || "";
  const generation = document.getElementById("generationFilter")?.value || ""; 
  const order = document.getElementById("sortSelect")?.value || "";

  let lista = [...allPokemonDetails]; 

  if (search) {
    lista = lista.filter((p) => p.name.toLowerCase().includes(search));
  }
  if (type) {
    lista = lista.filter((p) => p.types.some((t) => t.type.name === type));
  }
  if (generation) {
      const genNum = parseInt(generation);
      let minId = 1;
      let maxId = GEN_LIMITS[genNum];
      if (genNum > 1) { minId = GEN_LIMITS[genNum - 1] + 1; }
      lista = lista.filter((p) => p.id >= minId && p.id <= maxId);
  }
  if (order === "name-asc") {
    lista.sort((a, b) => a.name.localeCompare(b.name));
  } else if (order === "name-desc") {
    lista.sort((a, b) => b.name.localeCompare(a.name));
  } else if (order === "id-asc") {
    lista.sort((a, b) => a.id - b.id);
  } else if (order === "id-desc") {
    lista.sort((a, b) => b.id - a.id);
  }

  mostrarLista(lista);
}


function mostrarLista(lista) {
  const container = document.getElementById("pokemon-list");
  container.innerHTML = "";

  if (!lista.length) {
    container.innerHTML = "<p>Nenhum Pokémon encontrado com os filtros aplicados.</p>";
    return;
  }

  lista.forEach((pokemon) => {
    const tipos = pokemon.types
      .map(t => `<span class="type type-${t.type.name}">${t.type.name}</span>`)
      .join("");
    const isFavorite = favoritos.some(f => f.id === pokemon.id) ? '❤️' : '⭐';

    const card = `
      <div class="pokemon-item">
        <img src="${pokemon.sprites.front_default}" onclick="exibirPokemonPorId(${pokemon.id})"/>

        <div class="name-row">
          <h3>${pokemon.name}</h3>
          <span class="favorite-btn" onclick='toggleFavorito(${JSON.stringify(pokemon)})'>${isFavorite}</span>
        </div>

        <div class="types-row">
          ${tipos}
        </div>
      </div>
    `;
    container.innerHTML += card;
  });
}


async function exibirPokemonPorId(id) {
  document.getElementById("loading").classList.remove("hidden");
  
  const card = document.getElementById("pokemon-card");
  const estavaVisivel = card.classList.contains("visible");

  if (estavaVisivel) {
      fecharCard();
  }
  
  // **CORREÇÃO DO BUG**:
  // Espera a animação de fechar (400ms) terminar
  setTimeout(async () => {
      try {
          const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
          const pokemon = await response.json();
          exibirPokemon(pokemon); // Abre o novo
      } catch (error) {
          document.getElementById("error").classList.remove("hidden");
      }
      document.getElementById("loading").classList.add("hidden");
  }, estavaVisivel ? 400 : 0); // Espera SÓ SE estava aberto
}


function proximaPagina() {
  paginaAtual++;
  carregarPokemons();
}

function paginaAnterior() {
  if (paginaAtual === 0) return;
  paginaAtual--;
  carregarPokemons();
}


// ========================================================
// NÍVEL 4 — FAVORITOS
// ========================================================

let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];

function salvarFavoritos() {
  localStorage.setItem("favoritos", JSON.stringify(favoritos));
}

function toggleFavorito(pokemon) {
  const existe = favoritos.find(f => f.id === pokemon.id);

  if (existe) {
    favoritos = favoritos.filter(f => f.id !== pokemon.id);
  } else {
    favoritos.push({
      id: pokemon.id,
      nome: pokemon.name,
      imagem: pokemon.sprites.front_default,
      tipos: pokemon.types.map(t => t.type.name)
    });
  }

  salvarFavoritos();
  atualizarFavoritosUI();
  mostrarListaFiltrada();
}

function removerFavorito(id) {
  favoritos = favoritos.filter(f => f.id !== id);
  salvarFavoritos();
  atualizarFavoritosUI();
  mostrarListaFiltrada();
}

function atualizarFavoritosUI() {
  const container = document.getElementById("favorites-list");
  container.innerHTML = "";
  document.getElementById("fav-count").innerText = favoritos.length;

  favoritos.forEach((p) => {
    const tiposHTML = p.tipos
      .map(t => `<span class="type type-${t}">${t}</span>`)
      .join("");

    const card = `
      <div class="pokemon-item">
        <img src="${p.imagem}" onclick="exibirPokemonPorId(${p.id})"/>
        <div class="name-row">
            <h3>${p.nome}</h3>
            <span class="favorite-btn" onclick="removerFavorito(${p.id})">❌</span>
        </div>
        <div class="types-row">
            ${tiposHTML}
        </div>
      </div>
    `;
    container.innerHTML += card;
  });
}

// ========================================================
// UPGRADE 5: DARK MODE GÓTICO
// ========================================================

function toggleDarkMode() {
    const body = document.body;
    const isDark = body.classList.contains('dark-mode');
    
    if (isDark) {
        body.classList.replace('dark-mode', 'light-mode');
        document.getElementById("darkModeToggle").innerText = "Modo Escuro Gótico 🌙";
    } else {
        body.classList.replace('light-mode', 'dark-mode');
        document.getElementById("darkModeToggle").innerText = "Modo Claro ✨";
    }
    localStorage.setItem('pokedex-mode', isDark ? 'light-mode' : 'dark-mode');
}


// ========================================================
// EVENTOS DOS FILTROS
// ========================================================

document.getElementById("listSearch")?.addEventListener("input", mostrarListaFiltrada);
document.getElementById("typeFilter")?.addEventListener("change", mostrarListaFiltrada);
document.getElementById("generationFilter")?.addEventListener("change", mostrarListaFiltrada); 
document.getElementById("sortSelect")?.addEventListener("change", mostrarListaFiltrada);


// ========================================================
// INICIALIZAÇÃO
// ========================================================

const savedMode = localStorage.getItem('pokedex-mode') || 'light-mode';
document.body.classList.add(savedMode);
if (savedMode === 'dark-mode') {
    const toggleButton = document.getElementById("darkModeToggle");
    if(toggleButton) {
        toggleButton.innerText = "Modo Claro ✨";
    }
}

atualizarFavoritosUI();
carregarPokemons();