// Elementos do DOM
const titleInput = document.getElementById('titleInput');
const resultContainer = document.getElementById('resultContainer');
const resultsCount = document.getElementById('results-count');
const filterButton = document.getElementById('filterButton');
const filterOptions = document.getElementById('filterOptions');
const urlParams = new URLSearchParams(window.location.search);



const initialQuery = urlParams.get('query');  
const initialFilters = urlParams.get('filters');  


let selectedFilters = [];


let sourcesList = [];


fetch('../public/source/sources.json')
  .then(response => response.json())
  .then(data => {
    sourcesList = data.sources;
    buildFilterOptions();
  })
  .catch(error => console.error('Erro ao carregar as fontes:', error));


function buildFilterOptions() {
  sourcesList.forEach(source => {
    const label = document.createElement('label');
    label.textContent = source.name;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = source.name.toLowerCase();
    checkbox.checked = true; 
    selectedFilters.push(checkbox.value);

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

    label.prepend(checkbox);
    filterOptions.appendChild(label);
    filterOptions.appendChild(document.createElement('br'));
  });
}

function teste() {
  const searchQuery = titleInput.value.trim(); 
  if (!searchQuery) {
    console.log("input vazio"); 
    return; 
  }
  performSearch(titleInput.value.trim()); 
}


filterOptions.classList.remove('visible');


filterButton.addEventListener('click', () => {
  const isVisible = filterOptions.classList.toggle('visible');
});

document.addEventListener('click', (event) => {
  if (!filterButton.contains(event.target) && !filterOptions.contains(event.target)) {
    filterOptions.classList.remove('visible');
  }
});

titleInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && titleInput.value.trim () !== "") {
    performSearch(titleInput.value.trim());
  }
});


  document.addEventListener('DOMContentLoaded', (event) => {
    setTimeout(() => {
      performSearch(titleInput.value.trim())
      console.log("Pesquisa - DOMContentLoaded")
    },1000 );
  });

function performSearch(searchQuery) {
  resultContainer.innerHTML = ""; 
  resultsCount.textContent = "0";

  if (!searchQuery) {
    console.log("Pesquisa vazia");
    return;
  }

  const newUrl = window.location.pathname + "?query=" + encodeURIComponent(searchQuery);
  window.history.pushState({ path: newUrl }, '', newUrl);

  searchGames(searchQuery);
}

function handleFilterChange() {
  const searchQuery = titleInput.value.trim();
  if (searchQuery) {
    performSearch(searchQuery);
  }
}

function searchGames(query) {
  resultContainer.innerHTML = "";
  resultsCount.textContent = "0";
  let allResults = [];

  const sourcesToUse = sourcesList.filter(source =>
    selectedFilters.includes(source.name.toLowerCase())
  );

  const sourcesAtivas = sourcesToUse.length > 0 ? sourcesToUse : sourcesList;
  let sourcesLoaded = 0;

  sourcesAtivas.forEach(source => {
    fetch(source.url)
      .then(response => response.json())
      .then(data => {
        const results = data.downloads.filter(game =>
          game.title.toLowerCase().includes(query.toLowerCase())
        );

        results.forEach(game => game.repoName = source.name);
        allResults = allResults.concat(results);
        sourcesLoaded++;

        if (sourcesLoaded === sourcesAtivas.length) {
          if (allResults.length === 0) {
            resultContainer.innerHTML = "<p>Nenhum resultado encontrado.</p>";
            resultsCount.textContent = "0";
          } else {
            displayResults(sortResultsByDate(allResults), 33);
          }
        }
      })
      .catch(err => console.error("Erro na busca na fonte " + source.name + ":", err));
  });
}

function sortResultsByDate(results) {
  return results.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
}

let currentResults = [];
let currentLimit = 21; 
const resultsIncrement = 15; 

function displayResults(results, limit = 100) {
  currentResults = results;
  currentLimit = Math.min(limit, currentResults.length);
  resultContainer.innerHTML = "";
  resultsCount.textContent = results.length;

  const initialResults = currentResults.slice(0, currentLimit);
  initialResults.forEach(result => {
    const resultCard = createResultCard(result);
    resultContainer.appendChild(resultCard);
  });
}


function createResultCard(result) {
  const resultCard = document.createElement('div');
  resultCard.classList.add('resultCard');
  resultCard.innerHTML = `
    <div class="source-card">
      <p id="source">${result.repoName}</p>
      <p id="Data">${new Date(result.uploadDate).toLocaleDateString()}</p>
    </div>
    <div class="title">
      <p id="title">${result.title}</p>
    </div>
    <p id="size"><b>Tamanho:&nbsp;</b>${result.fileSize}</p>
    <div class="bottom-card">
      <button class="openTorrentButton" onclick="openMagnetLink('${result.uris[0]}')">
        <i class="fas fa-download"></i> instalar
      </button>
      <button id="copyButton" class="copyButton" onclick="copyToClipboard('${result.uris[0]}')">
        <i class="fas fa-copy"></i> <span id="buttonText">Copiar</span>
      </button>
    </div>
  `;
  return resultCard;
}


function loadMoreResults() {
  const loading = document.getElementById('loading');
  loading.style.display = 'flex';

  function executarComDelay() {
    let min = 750; // Tempo mínimo (2 segundos)
    let max = 2000; // Tempo máximo (5 segundos)

    let delay = Math.random() * (max - min) + min;

    setTimeout(() => {
      if (currentLimit < currentResults.length) {
        const nextLimit = Math.min(currentLimit + resultsIncrement, currentResults.length);
        const additionalResults = currentResults.slice(currentLimit, nextLimit);
        additionalResults.forEach(result => {
          const resultCard = createResultCard(result);
          resultContainer.appendChild(resultCard);
        });
        currentLimit = nextLimit;
      }
      loading.style.display = 'none';
      resultContainer.style.marginBottom = 0;
    }, delay);
  }

  executarComDelay();
}

// Função para carregar mais resultados ao rolar a página
  window.addEventListener('scroll', () => {
    if(window.scrollY + window.innerHeight >= document.documentElement.scrollHeight && currentLimit < currentResults.length) {
      loadMoreResults();
    }
  });


document.addEventListener('DOMContentLoaded', () => {
  updateFilterCheckboxes();

  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get('query');
  if (initialQuery) {
    titleInput.value = decodeURIComponent(initialQuery);
    performSearch(query);
  }
});

// Função para abrir o link magnet
function openMagnetLink(magnetLink) {
  window.location.href = magnetLink;
}

// Função para copiar o link magnet
function copyToClipboard(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);

  const notification = document.createElement('div');
  notification.classList.add('copy-notification');
  notification.textContent = 'Link copiado!';

  const container = document.getElementById('notificationContainer');
  container.appendChild(notification);

  void notification.offsetWidth;

  notification.classList.add('show');

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (container.contains(notification)) {
        container.removeChild(notification);
      }
    }, 500);
  }, 2000);
}

// Função para marcar ou desmarcar todas as checkboxes
function marcarTodas() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.checked = true;
  });
  console.log("marcadas");

  selectedFilters = Array.from(checkboxes).map(checkbox => checkbox.value);
}

function desmarcarTodas() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.checked = false;
  });
  console.log("desmarcadas");

  selectedFilters = [];
}

// Carregar os filtros da URL (caso existam)
function getFiltersFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  let filtersFromUrl = urlParams.get('filters');
  return filtersFromUrl ? filtersFromUrl.split(',') : [];
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

  selectedFilters = filtersFromUrl.length > 0 ? filtersFromUrl : sourcesList.map(source => source.name.toLowerCase());
}

// Se a string de filtros estiver presente, processa ela
if (initialFilters) {
  selectedFilters = initialFilters.split(',');
  applyFiltersToUI();
}

// Função para aplicar os filtros ao DOM
function applyFiltersToUI() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');

  checkboxes.forEach(checkbox => {
    checkbox.checked = selectedFilters.includes(checkbox.value);
  });

  performSearch(titleInput.value.trim());
}

function clearInput() {
  titleInput.value="";
}