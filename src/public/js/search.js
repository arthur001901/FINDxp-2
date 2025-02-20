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

    // Executa a pesquisa apenas quando o botão de aplicar for clicado
    

    ///////////////////////////////////////////////////////////////////////////////////////////////

    label.prepend(checkbox);
    filterOptions.appendChild(label);
    filterOptions.appendChild(document.createElement('br'));
  });
}

function teste() {
    const searchQuery = titleInput.value.trim(); // Remove espaços extras
    if (!searchQuery) {
        
        console.log("input vazio"); // Mostra alerta se estiver vazio
        return; // Sai sem executar a busca
    }
    performSearch(titleInput.value.trim()); // Executa a busca com os filtros aplicados
};

// Elemento começa invisível por padrão
filterOptions.classList.remove('visible');

// Toggle dos filtros ao clicar no botão
filterButton.addEventListener('click', () => {
  const isVisible = filterOptions.classList.toggle('visible');
});

document.addEventListener('click', (event) => {
  if (!filterButton.contains(event.target) && !filterOptions.contains(event.target)) {
    filterOptions.classList.remove('visible');
  }
});
// 3. Inicia a busca ao pressionar a tecla Enter
titleInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    performSearch(titleInput.value.trim());
    showMoreButton.style.display = 'none';
  }
});


// Função que realiza a pesquisa
function performSearch(searchQuery) {
  resultContainer.innerHTML = ""; // Limpa os resultados anteriores
  resultsCount.textContent = "0";
  document.getElementById('showMoreButton').style.display = 'none';

  // Verifica se a pesquisa está vazia
  if (!searchQuery) {
    // Exibe a mensagem personalizada somente quando a pesquisa estiver vazia
    console.log("Pesquisa vazia");
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
            displayResults(sortResultsByDate(allResults), 33); // Pass the limit here
          }
        }
      })
      .catch(err => console.error("Erro na busca na fonte " + source.name + ":", err));
  });
}

function sortResultsByDate(results) {
  return results.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()); // Comparação direta usando timestamps
}

let currentResults = [];
let currentLimit = 33;

// 6. Função para exibir os resultados (cada resultado em um parágrafo ou card)
function displayResults(results, limit = 21) {
  currentResults = results;
  currentLimit = limit;
  resultContainer.innerHTML = "";
  resultsCount.textContent = results.length;

  const limitedResults = results.slice(0, limit);

  limitedResults.forEach(result => {
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

  ///////////////////////////////////"Mostrar mais" e "Mostrar todos"
  const showMoreButton = document.getElementById('showMoreButton');
  const showAllButton = document.getElementById('showAllButton');
  if (results.length > limit) {
    setTimeout(() => {
    showMoreButton.style.display = 'block';
    showAllButton.style.display = 'block';
    }, 1);
  } else {
    showMoreButton.style.display = 'none';
    showAllButton.style.display = 'none';
  }
}

document.getElementById('showMoreButton').addEventListener('click', () => {
  currentLimit += 33; // Incrementa o limite
  displayResults(currentResults, currentLimit); // Exibe mais resultados
});

document.addEventListener('DOMContentLoaded', () => {
  // Atualiza as checkboxes com base nos filtros da URL
  updateFilterCheckboxes();

  // Oculta o botão "Mostrar mais" ao carregar a página
  document.getElementById('showMoreButton').style.display = 'none';

  // Realiza a pesquisa com o termo que está na URL, caso exista
  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get('query');
  if (initialQuery) {
    titleInput.value = decodeURIComponent(initialQuery);
    performSearch(query);
  }
});

document.getElementById('showAllButton').addEventListener('click', () => {
  // Cria o container do aviso com o timer circular responsivo
  const aviso = document.createElement('div');
  aviso.classList.add('aviso');
  aviso.innerHTML = `
    <div class="bg-aviso">
      <div class="aviso-content"> 
        <div class="timer-container" style="width: 15vmin; height: 15vmin;">
          <svg viewBox="0 0 200 200" style="transform: rotate(-90deg); width: 100%; height: 100%;">
            <!-- Círculo de fundo branco -->
            <circle cx="100" cy="100" r="70" stroke="white" stroke-width="30" fill="none"/>
            <!-- Círculo de progresso verde -->
            <circle id="progressCircle" cx="100" cy="100" r="70" stroke="green" stroke-width="29" fill="none"
              stroke-dasharray="439.82" stroke-dashoffset="439.82" />
          </svg>
          <!-- Texto central com o tempo restante -->
          <div class="time-text" id="timeText">5</div>
        </div>
        <h1>ATENÇÃO</h1>
      </div>
    </div>
  `;
  document.body.appendChild(aviso);

  // Seleciona os elementos do SVG e do texto
  const progressCircle = aviso.querySelector('#progressCircle');
  const timeText = aviso.querySelector('#timeText');

  const radius = 70; // Raio ajustado para o círculo menor
  const circumference = 2 * Math.PI * radius; // Circunferência ajustada

  const totalTime = 500; // Tempo total em segundos
  const startTime = Date.now();
  let timerInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000; // Tempo decorrido em segundos
    let progress = elapsed / totalTime;
    if (progress > 1) progress = 1; // Garante que o progresso não ultrapasse 100%

    // Atualiza o deslocamento do círculo para representar o progresso
    const offset = circumference * (1 - progress);
    progressCircle.style.strokeDashoffset = offset;

    // Atualiza o tempo exibido (arredondado para cima)
    let timeLeft = Math.ceil(totalTime - elapsed);
    if (timeLeft < 0) timeLeft = 0;
    timeText.textContent = timeLeft;

    // Quando o timer atinge 0 (100% do progresso)
    if (progress === 1) {
      progressCircle.style.strokeDashoffset = 0;
      timeText.textContent = "0";
      clearInterval(timerInterval);
      // Remove o aviso da tela
      document.body.removeChild(aviso);
    }
  }, 1000 / 60); // Atualiza cerca de 60 vezes por segundo
});






document.addEventListener('DOMContentLoaded', () => {
  // Atualiza as checkboxes com base nos filtros da URL
  updateFilterCheckboxes();

  // Oculta os botões "Mostrar mais" e "Mostrar todos" ao carregar a página
  document.getElementById('showMoreButton').style.display = 'none';
  document.getElementById('showAllButton').style.display = 'none';

  // Realiza a pesquisa com o termo que está na URL, caso exista
  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get('query');
  if (initialQuery) {
    titleInput.value = decodeURIComponent(initialQuery);
    performSearch(query);
  }
});

///////////////////////////////////////////////////////////////////////////////////////////////

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

  // Cria uma nova notificação
  const notification = document.createElement('div');
  notification.classList.add('copy-notification');
  notification.textContent = 'Link copiado!';

  // Adiciona a notificação no container
  const container = document.getElementById('notificationContainer');
  container.appendChild(notification);

  // Força reflow para que a transição funcione
  void notification.offsetWidth;

  // mostra a notificação
  notification.classList.add('show');

  // Remove a notificação dps de 2 segundos
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

// Função para marcar ou desmarcar todas as checkboxes
function marcarTodas() {
  // Marca todas as checkboxes
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.checked = true;
  });
  console.log("marcadas");

  // Atualiza o selectedFilters para incluir todas as opções
  selectedFilters = Array.from(checkboxes).map(checkbox => checkbox.value);

}
function desmarcarTodas() {
  // Desmarca todas as checkboxes
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.checked = false;
  });
  console.log("desmarcadas");

  // Limpa o selectedFilters
  selectedFilters = [];
}
///////////////////////////////////////////////////////////////////////////////////////////////

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
    resultContainer.innerHTML = "<p>Hello, World!</p>";
    console.log("input vazio");
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

