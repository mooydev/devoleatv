
// ================================
// CONFIGURACIÓN Y CONSTANTES
// ================================
const CONFIG = {
  POPUNDER_URL: "https://www.revenuecpmgate.com/vvpynx41d?key=afac2ed93a1337c32c53ae6ac0eaf064",
  API_URL: "https://devoleatv-api.onrender.com/api/partidos",
  TIMEZONE: 'UTC-5',
  BREAKPOINTS: {
    MOBILE: 768,
    TABLET_ASPECT_RATIO: 1.5
  },
  RESPONSIVE_CHECK_INTERVAL: 1000,
  POPUNDER_OPEN_INTERVAL: 7000,
  POPUNDER_LIMIT: 3
};

// ================================
// ELEMENTOS DEL DOM
// ================================
const DOMElements = {
  iframe: null,
  tournamentElem: null,
  hourElem: null,
  teamsElem: null,
  gamelist: null,
  playerBox: null,
  reloadButton: null,
  loader: null,
  inputSearch: null,

  init() {
    this.iframe = document.getElementById('main-frame');
    this.tournamentElem = document.querySelector('.player-info .tournament');
    this.hourElem = document.querySelector('.player-info .hour');
    this.teamsElem = document.getElementById('teams-player');
    this.gamelist = document.querySelector('.gamelist ul');
    this.playerBox = document.querySelector('.player-box');
    this.reloadButton = document.getElementById("match-info-img-button");
    this.loader = document.getElementById("loader");
    this.inputSearch = document.getElementById("search");

    this.validateElements();
  },

  validateElements() {
    const requiredElements = ['iframe', 'gamelist', 'loader'];
    const missingElements = requiredElements.filter(key => !this[key]);

    if (missingElements.length > 0) {
      console.warn('Elementos DOM faltantes:', missingElements);
    }
  }
};

// ================================
// ESTADO DE LA APLICACIÓN
// ================================
const AppState = {
  partidosArray: [],
  currentStreamUrl: '',
  currentActiveLink: null,
  letNextPopUnder: false,
  popUnderCount: 0,

  setPartidos(partidos) {
    this.partidosArray = partidos;
  },

  setCurrentStream(url) {
    this.currentStreamUrl = url;
  },

  setLetNextPopUnder(value) {
    this.letNextPopUnder = value;
  },

  setPopUnderCount(value) {
    this.popUnderCount = value;
  },

  setActiveLink(linkIndex, partidoId) {
    this.currentActiveLink = { linkIndex, partidoId };
  },

  getActiveLink() {
    return this.currentActiveLink;
  },

  getCurrentStream() {
    return this.currentStreamUrl;
  },

  getPartidos() {
    return this.partidosArray;
  },

  getLetNextPopUnder() {
    return this.letNextPopUnder;
  },

  getPopUnderCount() {
    return this.popUnderCount;
  }
};

// ================================
// UTILIDADES
// ================================
const Utils = {
  convertirHoraLocal(horaUTCmenos5) {
    if (!horaUTCmenos5 || typeof horaUTCmenos5 !== 'string') {
      return 'Hora no disponible';
    }

    try {
      const { DateTime } = luxon;
      const [h, m] = horaUTCmenos5.split(':').map(Number);

      if (isNaN(h) || isNaN(m)) {
        throw new Error('Formato de hora inválido');
      }

      const dt = DateTime.fromObject(
        { hour: h, minute: m },
        { zone: CONFIG.TIMEZONE }
      );

      return dt.setZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
        .toLocaleString(DateTime.TIME_SIMPLE);
    } catch (error) {
      console.error('Error al convertir hora:', error);
      return horaUTCmenos5;
    }
  },

  isWebViewAndroid() {
    return /Android/.test(navigator.userAgent) && /wv/.test(navigator.userAgent);
  },

  sanitizeText(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// ================================
// MANEJO DE POPUNDER
// ================================
const PopunderManager = {
  open() {
    if (AppState.getPopUnderCount() >= CONFIG.POPUNDER_LIMIT || !AppState.getLetNextPopUnder()) {
      return;
    }

    AppState.setPopUnderCount(AppState.getPopUnderCount() + 1);

    const pop = window.open(
      CONFIG.POPUNDER_URL,
      '_blank',
      'toolbar=no,scrollbars=yes,resizable=yes,width=800,height=600'
    );

    if (pop) {
      window.focus();
      AppState.setLetNextPopUnder(false);
      setTimeout(() => {
        AppState.setLetNextPopUnder(true);
      }, CONFIG.POPUNDER_OPEN_INTERVAL);
    } else {
      console.log("Popunder bloqueado por el navegador");
    }
  },

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        AppState.setLetNextPopUnder(true);
      }, CONFIG.POPUNDER_OPEN_INTERVAL);

      if (DOMElements.gamelist) {
        DOMElements.gamelist.addEventListener('click', this.open);
        DOMElements.gamelist.addEventListener('touchstart', this.open);
      }
    });
  }
};

// ================================
// MANEJO DE PARTIDOS
// ================================
const MatchManager = {
  actualizarPlayer(partido, linkIndex = 0) {
    if (!partido || !DOMElements.iframe) {
      console.error('Partido o iframe no válido');
      return;
    }

    const link = partido.link || (partido.links && partido.links[linkIndex]);
    if (!link || link === AppState.getCurrentStream()) {
      return;
    }

    try {
      DOMElements.iframe.src = link;
      AppState.setCurrentStream(link);
      AppState.setActiveLink(linkIndex, partido.id_partido);

      this.updateMatchInfo(partido);
      this.setActiveMatch(partido.id_partido);
      this.setActiveLink(linkIndex, partido.id_partido);
      this.scrollToPlayerOnMobile();
    } catch (error) {
      console.error('Error al actualizar reproductor:', error);
    }
  },

   setActiveLink(linkIndex, partidoId) {
    // Remover clase active de todos los links
    document.querySelectorAll('.links-list a.active').forEach(el => 
      el.classList.remove('active')
    );

    // Activar el link específico del partido actual
    const matchElement = DOMElements.gamelist.querySelector(`[data-id="${partidoId}"]`);
    if (matchElement) {
      const linkElement = matchElement.querySelector(`.links-list li:nth-child(${linkIndex + 1}) a`);
      if (linkElement) {
        linkElement.classList.add('active');
      }
    }
  },

  updateMatchInfo(partido) {
    if (DOMElements.tournamentElem) {
      DOMElements.tournamentElem.textContent = Utils.sanitizeText(partido.torneo || '');
    }

    if (DOMElements.hourElem) {
      const horaLocal = Utils.convertirHoraLocal(partido.hora);
      DOMElements.hourElem.textContent = horaLocal;
    }

    if (DOMElements.teamsElem) {
      DOMElements.teamsElem.textContent = Utils.sanitizeText(partido.equipos || '');
    }
  },

  setActiveMatch(partidoId) {
    // Remover clases activas
    document.querySelectorAll('.match.active, .links-list.active').forEach(el =>
      el.classList.remove('active')
    );

    // Activar el partido actual
    if (DOMElements.gamelist) {
      const matchElement = DOMElements.gamelist.querySelector(`[data-id="${partidoId}"]`);
      if (matchElement) {
        matchElement.classList.add('active');
      }
    }
  },

  scrollToPlayerOnMobile() {
    if (window.innerWidth <= CONFIG.BREAKPOINTS.MOBILE && DOMElements.playerBox) {
      DOMElements.playerBox.scrollIntoView({ behavior: 'smooth' });
    }
  },

  reloadFrame() {
    if (DOMElements.iframe && DOMElements.iframe.src) {
      DOMElements.iframe.src = DOMElements.iframe.src;
    }
  }
};

// ================================
// RENDERIZADO DE LISTA
// ================================
const ListRenderer = {
  renderizarLista(partidos) {
    if (!DOMElements.gamelist) {
      console.error('Elemento gamelist no encontrado');
      return;
    }

    if (!Array.isArray(partidos)) {
      console.error('Partidos debe ser un array');
      return;
    }

    DOMElements.gamelist.innerHTML = '';

    if (partidos.length === 0) {
      this.renderEmptyState();
      return;
    }

    partidos.forEach(partido => this.renderMatchItem(partido));
  },

  renderMatchItem(partido) {
    if (!partido || !partido.id_partido) return;

    const horaLocal = Utils.convertirHoraLocal(partido.hora);
    const li = document.createElement('li');

    li.classList.add('match');
    li.dataset.id = partido.id_partido;

    li.innerHTML = `
      <div class="match-header">
        <div class="match-info">
          <div id="match-info-tournament-hour">
            <p class="tournament">${Utils.sanitizeText(partido.torneo || '')}</p>
            <p class="tournament">|</p>
            <p class="hour">${horaLocal}</p>
          </div>
          <div id="match-info-teams">
            <p class="teams">${Utils.sanitizeText(partido.equipos || '')}</p>
          </div>
        </div>
        <div id="match-info-img">
          <img src="assets/images/play.svg" alt="Mostrar opciones">
        </div>
      </div>
      <ul class="links-list"></ul>
    `;

    this.createLinksSublist(li, partido);
    this.addMatchEventListeners(li, partido);

    // Reproducir automáticamente el primer partido si no hay otros
    if (DOMElements.gamelist.children.length === 0 && partido.links.length > 0) {
      MatchManager.actualizarPlayer({ ...partido, link: partido.links[0] });
    }

    DOMElements.gamelist.appendChild(li);
  },

    createLinksSublist(li, partido) {
    const linksList = li.querySelector('.links-list');
    
    partido.links.forEach((link, i) => {
      const option = document.createElement('li');
      option.innerHTML = `<a href="#" data-link-index="${i}">Opción ${i + 1}</a>`;
      
      option.addEventListener('click', (e) => {
        e.preventDefault();
        MatchManager.actualizarPlayer({ ...partido, link }, i);
      });
      
      linksList.appendChild(option);
    });
  },

  addMatchEventListeners(li, partido) {
    const header = li.querySelector('.match-header');
    const linksList = li.querySelector('.links-list');

    header.addEventListener('click', () => {
      const isActive = linksList.classList.contains('open');
      
      // Cerrar todas las listas abiertas
      document.querySelectorAll('.links-list').forEach(list => {
        list.classList.remove('open');
      });

      // Reproducir el primer link del partido
      MatchManager.actualizarPlayer({ ...partido, link: partido.links[0] }, 0);

      // Abrir la lista si no estaba activa
      if (!isActive) {
        linksList.classList.add('open');
      }
    });
  },

  renderEmptyState() {
    DOMElements.gamelist.innerHTML = '<li class="empty-state">No hay partidos disponibles hoy.</li>';
  },

  renderErrorState() {
    DOMElements.gamelist.innerHTML = '<li class="error-state">Error al cargar partidos.</li>';
  }
};

// ================================
// BÚSQUEDA
// ================================
const SearchManager = {
  searchMatch(e) {
    const searchTerm = e.target.value.trim().toLowerCase();

    if (!searchTerm) {
      const partidos = AppState.getPartidos();
      ListRenderer.renderizarLista(partidos);
      if (partidos.length > 0) {
        MatchManager.setActiveMatch(partidos[0].id_partido);
      }
      return;
    }

    const results = this.filterMatches(searchTerm);
    ListRenderer.renderizarLista(results);
    if (results.length > 0) {
      MatchManager.setActiveMatch(results[0].id_partido);
    }
  },

  filterMatches(searchTerm) {
    return AppState.getPartidos().filter(match => {
      const teams = (match.equipos || '').toLowerCase();
      const tournament = (match.torneo || '').toLowerCase();
      return teams.includes(searchTerm) || tournament.includes(searchTerm);
    });
  }
};

// ================================
// LAYOUT RESPONSIVO
// ================================
const ResponsiveManager = {
  handleResponsiveLayout() {
    const body = document.body;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspectRatio = width / height;

    // Limpiar clases previas
    this.clearLayoutClasses(body);

    // Detectar WebView Android
    if (Utils.isWebViewAndroid()) {
      body.classList.add('webview-android');
    }

    // Aplicar layout basado en dimensiones
    this.applyLayout(body, width, aspectRatio);

    console.log(`Layout: ${width}x${height}, Ratio: ${aspectRatio.toFixed(2)}`);
  },

  clearLayoutClasses(body) {
    body.classList.remove('layout-mobile', 'layout-tablet', 'layout-desktop', 'webview-android');
  },

  applyLayout(body, width, aspectRatio) {
    if (width < CONFIG.BREAKPOINTS.MOBILE) {
      body.classList.add('layout-mobile');
    } else if (aspectRatio > CONFIG.BREAKPOINTS.TABLET_ASPECT_RATIO && width >= CONFIG.BREAKPOINTS.MOBILE) {
      body.classList.add('layout-desktop');
    } else {
      body.classList.add('layout-tablet');
    }
  },

  init() {
    // Event listeners
    window.addEventListener('load', () => this.handleResponsiveLayout());
    window.addEventListener('resize', () => this.handleResponsiveLayout());
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.handleResponsiveLayout(), 100);
    });

    // Para WebView Android - verificación periódica
    if (Utils.isWebViewAndroid()) {
      setInterval(() => this.handleResponsiveLayout(), CONFIG.RESPONSIVE_CHECK_INTERVAL);
    }
  }
};

// ================================
// MANEJO DE API
// ================================
const APIManager = {
  async fetchPartidos() {
    try {
      const response = await fetch(CONFIG.API_URL);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const partidos = await response.json();
      return Array.isArray(partidos) ? partidos : [];
    } catch (error) {
      console.error('Error al cargar partidos:', error);
      throw error;
    }
  },

  groupMatches(partidos) {
    return Object.values(
      partidos.reduce((acc, item) => {
        const key = `${item.equipos}`;
        if (!acc[key]) {
          acc[key] = {
            id_partido: item.id_partido,
            hora: item.hora,
            torneo: item.torneo,
            equipos: item.equipos,
            links: []
          };
        }
        acc[key].links.push(item.link);
        return acc;
      }, {})
    );
  }
};

// ================================
// INICIALIZADOR PRINCIPAL
// ================================
const App = {
  async init() {
    try {
      DOMElements.init();
      this.setupEventListeners();
      ResponsiveManager.init();
      PopunderManager.init();
      await this.loadMatches();
    } catch (error) {
      console.error('Error al inicializar la aplicación:', error);
      this.handleInitError();
    }
  },

  setupEventListeners() {
    if (DOMElements.reloadButton) {
      DOMElements.reloadButton.onclick = () => MatchManager.reloadFrame();
    }

    if (DOMElements.inputSearch) {
      DOMElements.inputSearch.addEventListener('input', (e) => SearchManager.searchMatch(e));
    }
  },

  async loadMatches() {
    try {
      this.showLoader();

      const partidosRaw = await APIManager.fetchPartidos();
      const grouped = APIManager.groupMatches(partidosRaw);

      console.log('Partidos agrupados:', JSON.stringify(grouped, null, 2));

      this.hideLoader();

      AppState.setPartidos(grouped);

      if (grouped.length > 0) {
        ListRenderer.renderizarLista(grouped);
        MatchManager.actualizarPlayer(grouped[0], 0); 
        MatchManager.setActiveMatch(grouped[0].id_partido);
        MatchManager.setActiveLink(0, grouped[0].id_partido);
      } else {
        ListRenderer.renderEmptyState();
      }
    } catch (error) {
      this.hideLoader();
      ListRenderer.renderErrorState();
      throw error;
    }
  },

  showLoader() {
    if (DOMElements.loader) {
      DOMElements.loader.style.display = "flex";
    }
  },

  hideLoader() {
    if (DOMElements.loader) {
      DOMElements.loader.style.display = "none";
    }
  },

  handleInitError() {
    this.hideLoader();
    if (DOMElements.gamelist) {
      DOMElements.gamelist.innerHTML = '<li class="error-state">Error al inicializar la aplicación.</li>';
    }
  }
};

// ================================
// INICIALIZACIÓN
// ================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}