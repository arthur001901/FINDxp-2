// Elementos do DOM
const titleInput = document.getElementById('titleInput');
const resultContainer = document.getElementById('resultContainer');
const resultsCount = document.getElementById('results-count');
const filterButton = document.getElementById('filterButton');
const filterOptions = document.getElementById('filterOptions');
const urlParams = new URLSearchParams(window.location.search);
const applyButton = document.getElementById('applyButton');


// Pega o valor da query de pesquisa e dos filtros
const initialQuery = urlParams.get('query');  // Pesquisa que o usuário fez
const initialFilters = urlParams.get('filters');  // Filtros selecionados (como DODI, FITGIRL, etc.)


// Variável para armazenar os filtros selecionados (usaremos os nomes em minúsculas)
let selectedFilters = [];

// Lista de fontes carregadas do JSON
let sourcesList = [];

// 1. Carregar as fontes do arquivo JSON
fetch('../public/source/sources.json')
  .then(response => response.json())
  .then(data => {
    sourcesList = data.sources;
    buildFilterOptions();
  })
  .catch(error => console.error('Erro ao carregar as fontes:', error));

// Função para criar os checkboxes de filtros a partir do JSON
function buildFilterOptions() {
  sourcesList.forEach(source => {
    const label = document.createElement('label');
    label.textContent = source.name;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    // Usamos o nome da fonte (em minúsculas) como identificador
    checkbox.value = source.name.toLowerCase();
    checkbox.checked = true; // Seleciona por padrão
    selectedFilters.push(checkbox.value);

    ////////////////////////////////////////// mudar //////////////////////////////////////////////
    // Atualiza a lista de filtros sem executar a busca imediatamente
    checkbox.addEventListener('change', (e) => {
        const filterValue = e.target.value;
        if (e.target.checked) {
            if (!selectedFilters.includes(filterValue)) {
                selectedFilters.push(filterValue);
            }
        } else {
            selectedFilters = selectedFilters.filter(f => f !== filterValue);
        }
    });
    
    // Evento do botão "Aplicar"
    // Evite adicionar múltiplos eventos ao bot

    // Função que será chamada quando o botão for clicado
    function Aplicar() {
        const searchQuery = titleInput.value.trim(); // Remove espaços extras
        if (!searchQuery) {
            alert("Digite algo antes de aplicar a pesquisa!"); // Mostra alerta se estiver vazio
            return; // Sai sem executar a busca
        }
        performSearch(searchQuery); // Executa a busca com os filtros aplicados
        console.log("a")
    }


    ///////////////////////////////////////////////////////////////////////////////////////////////

    label.prepend(checkbox);
    filterOptions.appendChild(label);
    filterOptions.appendChild(document.createElement('br'));
  });
}

// Elemento começa invisível por padrão
filterOptions.classList.remove('visible');

// Toggle dos filtros ao clicar no botão
filterButton.addEventListener('click', () => {
  const isVisible = filterOptions.classList.toggle('visible');
//   const icon = filterButton.querySelector('i');
  
//   // Atualiza o ícone baseado no estado do dropdown
//   icon.classList.toggle('fa-chevron-up', isVisible);
//   icon.classList.toggle('fa-chevron-down', !isVisible);
});



// 3. Inicia a busca ao pressionar a tecla Enter
titleInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    performSearch(titleInput.value.trim());
  }
});

// Função que realiza a pesquisa
function performSearch(searchQuery) {
  resultContainer.innerHTML = ""; // Limpa os resultados anteriores
  resultsCount.textContent = "0";

  // Verifica se a pesquisa está vazia
  if (!searchQuery) {
    // Exibe a mensagem personalizada somente quando a pesquisa estiver vazia
    resultContainer.innerHTML = "<p>8===D</p>";
    return;
  }

  // Atualiza a URL com a pesquisa
  const newUrl = window.location.pathname + "?query=" + encodeURIComponent(searchQuery);
  window.history.pushState({ path: newUrl }, '', newUrl);

  // Chama a função de pesquisa real (que vai buscar e exibir os resultados)
  searchGames(searchQuery);
}

// Função que lida com a alteração de filtros
function handleFilterChange() {
  // Só faz a pesquisa se houver texto no campo
  const searchQuery = titleInput.value.trim();
  if (searchQuery) {
    performSearch(searchQuery);
  }
}

// 5. Função que realiza a pesquisa em cada fonte selecionada
function searchGames(query) {
  resultContainer.innerHTML = "";
  resultsCount.textContent = "0";
  let allResults = [];

  // Filtra as fontes com base nos filtros selecionados
  const sourcesToUse = sourcesList.filter(source =>
    selectedFilters.includes(source.name.toLowerCase())
  );

  // Se nenhum filtro estiver selecionado, usa todas as fontes
  const sourcesAtivas = sourcesToUse.length > 0 ? sourcesToUse : sourcesList;
  let sourcesLoaded = 0;

  sourcesAtivas.forEach(source => {
    fetch(source.url)
      .then(response => response.json())
      .then(data => {
        // Cada fonte
        const results = data.downloads.filter(game =>
          game.title.toLowerCase().includes(query.toLowerCase())
        );

        // Adiciona o nome da fonte aos resultados para exibição
        results.forEach(game => game.repoName = source.name);
        allResults = allResults.concat(results);
        sourcesLoaded++;

        // Quando todas as fontes tiverem sido processadas, exibe os resultados
        if (sourcesLoaded === sourcesAtivas.length) {
          if (allResults.length === 0) {
            resultContainer.innerHTML = "<p>Nenhum resultado encontrado.</p>";
            resultsCount.textContent = "0";
          } else {
            displayResults(sortResultsByDate(allResults));
          }
        }
      })
      .catch(err => console.error("Erro na busca na fonte " + source.name + ":", err));
  });
}

function sortResultsByDate(results) {
  return results.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()); // Comparação direta usando timestamps
}


// 6. Função para exibir os resultados (cada resultado em um parágrafo ou card)
function displayResults(results) {
  resultContainer.innerHTML = "";
  resultsCount.textContent = results.length;

  results.forEach(result => {
    const resultCard = document.createElement('div');
    resultCard.classList.add('resultCard');
    resultCard.innerHTML = `
    <div class="source-card">
      <p id="source">${result.repoName}</p>
      <p id="Data"> ${new Date(result.uploadDate).toLocaleDateString()}</p>
    </div>
    <div class="title">
      <p id="title">${result.title}</p>
      </div>
      <p id="size"><b> Tamanho:&nbsp; </b> ${result.fileSize}</p>
      
    <div class="bottom-card">
      <button class="openTorrentButton" onclick="openMagnetLink('${result.uris[0]}')"><i class="fas fa-download"></i> instalar</button>
      <button id="copyButton" class="copyButton" onclick="copyToClipboard('${result.uris[0]}')">
    <i class="fas fa-copy"></i> <span id="buttonText">Copiar</span>
  </button> 
    </div>
      `;
    resultContainer.appendChild(resultCard);
  });
}

function openMagnetLink(magnetLink) {
  window.location.href = magnetLink;
}

function copyToClipboard(text) {
  // Copia o texto para a área de transferência
  const textarea = document.createElement('textarea');
  
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);

  // Cria uma nova notificação
  const notification = document.createElement('div');
  notification.classList.add('copy-notification');
  notification.textContent = 'Link copiado!';

  // Adiciona a notificação ao container
  const container = document.getElementById('notificationContainer');
  container.appendChild(notification);

  // Força reflow para garantir que a transição funcione
  void notification.offsetWidth;

  // Exibe a notificação
  notification.classList.add('show');

  // Remove a notificação após 2 segundos (pode ajustar o tempo)
  setTimeout(() => {
    notification.classList.remove('show');
    // Após a transição de saída (0.5s), remove o elemento do DOM
    setTimeout(() => {
      if (container.contains(notification)) {
        container.removeChild(notification);
      }
    }, 500);
  }, 2000);
}


document.getElementById('filterButton').addEventListener('click', function () {
  const session = document.getElementById('filterOptions');
  
  // Verifica se a sessão está visível ou oculta e alterna
  if (session.style.visibility === 'hidden' || !session.style.visibility) {
    session.style.visibility = 'visible'; // Exibe a sessão
    session.style.display = 'flex';
  } else {
    session.style.visibility = 'hidden';  // Oculta a sessão
  }
});

// Variável para controlar o estado do dropdown
let isDropdownOpen = false;

// Toggle do dropdown ao clicar no botão
filterButton.addEventListener('click', (event) => {
  event.stopPropagation(); // Impede o clique no botão de acionar o evento do document
  isDropdownOpen = !isDropdownOpen;
  filterOptions.style.visibility = isDropdownOpen ? 'visible' : 'hidden';

  // Atualiza o ícone
  const icon = filterButton.querySelector('i');
  icon.classList.toggle('fa-chevron-up', isDropdownOpen);
  icon.classList.toggle('fa-chevron-down', !isDropdownOpen);
});

function marcarTodas() {
  // Marca todas as checkboxes
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.checked = true;
  });

  // Atualiza o selectedFilters para incluir todas as opções
  selectedFilters = Array.from(checkboxes).map(checkbox => checkbox.value);

  // Executa a pesquisa com os filtros atualizados
  performSearch(titleInput.value.trim());
}

function desmarcarTodas() {
  // Desmarca todas as checkboxes
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.checked = false;
  });

  // Limpa o selectedFilters
  selectedFilters = [];

  // Executa a pesquisa com os filtros atualizados
  performSearch(titleInput.value.trim());
  console.log("desmarcados")
}


// Carregar os filtros da URL (caso existam)
function getFiltersFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  let filtersFromUrl = urlParams.get('filters');
  return filtersFromUrl ? filtersFromUrl.split(',') : []; // Converte os filtros de string para um array
}

// Salvar os filtros na URL
function updateUrlWithFilters() {
  const filtersParam = selectedFilters.join(',');
  const url = new URL(window.location);
  url.searchParams.set('filters', filtersParam);
  window.history.pushState({ path: url.href }, '', url.href);
}

// Atualizar o estado das checkboxes conforme os filtros da URL
function updateFilterCheckboxes() {
  const filtersFromUrl = getFiltersFromUrl();

  sourcesList.forEach(source => {
    const checkbox = document.querySelector(`input[value="${source.name.toLowerCase()}"]`);
    if (checkbox) {
      checkbox.checked = filtersFromUrl.includes(source.name.toLowerCase());
    }
  });

  // Atualiza a lista de filtros selecionados conforme as checkboxes
  selectedFilters = filtersFromUrl.length > 0 ? filtersFromUrl : sourcesList.map(source => source.name.toLowerCase());
}

// Função que realiza a pesquisa (igual à original)
function performSearch(searchQuery) {
  resultContainer.innerHTML = "";
  resultsCount.textContent = "0";

  // Verifica se a pesquisa está vazia
  if (!searchQuery) {
    resultContainer.innerHTML = "<p>8===D</p>";
    return;
  }

  const newUrl = window.location.pathname + "?query=" + encodeURIComponent(searchQuery);
  window.history.pushState({ path: newUrl }, '', newUrl);

  searchGames(searchQuery);
}

// Ao carregar a página, verificamos os filtros e realizamos a pesquisa
document.addEventListener('DOMContentLoaded', () => {
  // Atualiza as checkboxes com base nos filtros da URL
  updateFilterCheckboxes();

  // Realiza a pesquisa com o termo que está na URL, caso exista
  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get('query');
  if (initialQuery) {
    titleInput.value = decodeURIComponent(initialQuery);
    performSearch(query);
  }
});

// Se a string de filtros estiver presente, processa ela
if (initialFilters) {
  selectedFilters = initialFilters.split(',');  // Divide a string de filtros em um array
  applyFiltersToUI();  // Aplica os filtros no DOM (ex.: marca as checkboxes)
}

// Função para aplicar os filtros ao DOM
function applyFiltersToUI() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');  // Pega todas as checkboxes

  checkboxes.forEach(checkbox => {
    // Marca as checkboxes cujos valores estão nos filtros selecionados
    checkbox.checked = selectedFilters.includes(checkbox.value);
  });

  // Após aplicar os filtros, realiza a pesquisa novamente
  performSearch(titleInput.value.trim());
}

