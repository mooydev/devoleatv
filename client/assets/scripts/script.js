/**
 * Aplicación de Streaming de Partidos
 * Organizada por módulos para mejor mantenibilidad
 */

// ================================
// CONFIGURACIÓN Y CONSTANTES
// ================================
const CONFIG = {
  API_URL: "https://devoleatv-api.onrender.com/api/partidos",
  TIMEZONE: 'UTC-5',
  BREAKPOINTS: {
    MOBILE: 768,
    TABLET_ASPECT_RATIO: 1.5
  },
  RESPONSIVE_CHECK_INTERVAL: 1000
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
  
  // Inicializar elementos del DOM
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
    
    // Validar que todos los elementos existan
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
  
  setPartidos(partidos) {
    this.partidosArray = partidos;
  },
  
  setCurrentStream(url) {
    this.currentStreamUrl = url;
  },
  
  getCurrentStream() {
    return this.currentStreamUrl;
  },
  
  getPartidos() {
    return this.partidosArray;
  }
};

// ================================
// UTILIDADES
// ================================
const Utils = {
  /**
   * Convierte hora UTC-5 a hora local
   * @param {string} horaUTCmenos5 - Hora en formato "HH:mm"
   * @returns {string} Hora formateada en zona local
   */
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
  
  /**
   * Detecta si es WebView Android
   * @returns {boolean}
   */
  isWebViewAndroid() {
    return /Android/.test(navigator.userAgent) && /wv/.test(navigator.userAgent);
  },
  
  /**
   * Sanitiza texto para prevenir XSS
   * @param {string} text 
   * @returns {string}
   */
  sanitizeText(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// ================================
// MANEJO DE PARTIDOS
// ================================
const MatchManager = {
  /**
   * Actualiza el reproductor con información del partido
   * @param {Object} partido - Objeto partido
   */
  actualizarPlayer(partido) {
    if (!partido || !DOMElements.iframe) {
      console.error('Partido o iframe no válido');
      return;
    }
    
    // Evitar recargas innecesarias
    if (partido.link === AppState.getCurrentStream()) {
      return;
    }
    
    try {
      AppState.setCurrentStream(partido.link);
      DOMElements.iframe.src = partido.link;
      
      // Actualizar información del partido
      this.updateMatchInfo(partido);
      this.setActiveMatch(partido.id_partido);
      this.scrollToPlayerOnMobile();
      
    } catch (error) {
      console.error('Error al actualizar reproductor:', error);
    }
  },
  
  /**
   * Actualiza la información del partido en la UI
   * @param {Object} partido 
   */
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
  
  /**
   * Establece el partido activo visualmente
   * @param {number|string} partidoId 
   */
  setActiveMatch(partidoId) {
    // Remover clase active de todos los elementos
    document.querySelectorAll('.match.active').forEach(el => 
      el.classList.remove('active')
    );
    
    // Activar el partido actual
    if (DOMElements.gamelist) {
      const matchElement = DOMElements.gamelist.querySelector(
        `[data-id="${partidoId}"]`
      );
      if (matchElement) {
        matchElement.classList.add('active');
      }
    }
  },
  
  /**
   * Scroll suave al reproductor en dispositivos móviles
   */
  scrollToPlayerOnMobile() {
    if (window.innerWidth <= CONFIG.BREAKPOINTS.MOBILE && DOMElements.playerBox) {
      DOMElements.playerBox.scrollIntoView({ behavior: 'smooth' });
    }
  },
  
  /**
   * Recarga el frame actual
   */
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
  /**
   * Renderiza la lista completa de partidos
   * @param {Array} partidos 
   */
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
  
  /**
   * Renderiza un elemento de partido individual
   * @param {Object} partido 
   */
  renderMatchItem(partido) {
    if (!partido || !partido.id_partido) {
      console.warn('Partido inválido:', partido);
      return;
    }
    
    const horaLocal = Utils.convertirHoraLocal(partido.hora);
    const li = document.createElement('li');
    
    li.classList.add('match');
    li.dataset.id = partido.id_partido;
    
    li.innerHTML = `
      <a href="#" class="match-a">
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
          <img src="assets/images/play.svg" alt="Reproducir partido">
        </div>
      </a>
    `;
    
    // Agregar event listener
    this.addMatchEventListener(li, partido);
    DOMElements.gamelist.appendChild(li);
  },
  
  /**
   * Agrega event listener a un elemento de partido
   * @param {HTMLElement} element 
   * @param {Object} partido 
   */
  addMatchEventListener(element, partido) {
    const anchor = element.querySelector('a');
    if (anchor) {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        MatchManager.actualizarPlayer(partido);
      });
    }
  },
  
  /**
   * Renderiza estado vacío
   */
  renderEmptyState() {
    DOMElements.gamelist.innerHTML = '<li class="empty-state">No hay partidos disponibles hoy.</li>';
  },
  
  /**
   * Renderiza estado de error
   */
  renderErrorState() {
    DOMElements.gamelist.innerHTML = '<li class="error-state">Error al cargar partidos.</li>';
  }
};

// ================================
// BÚSQUEDA
// ================================
const SearchManager = {
  /**
   * Maneja la búsqueda de partidos
   * @param {Event} e 
   */
  searchMatch(e) {
    const searchTerm = e.target.value.trim().toLowerCase();
    
    if (!searchTerm) {
      ListRenderer.renderizarLista(AppState.getPartidos());
      return;
    }
    
    const results = this.filterMatches(searchTerm);
    ListRenderer.renderizarLista(results);
  },
  
  /**
   * Filtra partidos por término de búsqueda
   * @param {string} searchTerm 
   * @returns {Array}
   */
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
  /**
   * Maneja el layout responsivo
   */
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
  
  /**
   * Limpia clases de layout previas
   * @param {HTMLElement} body 
   */
  clearLayoutClasses(body) {
    body.classList.remove('layout-mobile', 'layout-tablet', 'layout-desktop', 'webview-android');
  },
  
  /**
   * Aplica layout basado en dimensiones
   * @param {HTMLElement} body 
   * @param {number} width 
   * @param {number} aspectRatio 
   */
  applyLayout(body, width, aspectRatio) {
    if (width < CONFIG.BREAKPOINTS.MOBILE) {
      body.classList.add('layout-mobile');
    } else if (aspectRatio > CONFIG.BREAKPOINTS.TABLET_ASPECT_RATIO && width >= CONFIG.BREAKPOINTS.MOBILE) {
      body.classList.add('layout-desktop');
    } else {
      body.classList.add('layout-tablet');
    }
  },
  
  /**
   * Inicializa el manejo responsivo
   */
  init() {
    // Event listeners
    window.addEventListener('load', () => this.handleResponsiveLayout());
    window.addEventListener('resize', () => this.handleResponsiveLayout());
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.handleResponsiveLayout(), 100);
    });
    
    // Para WebView Android
    if (Utils.isWebViewAndroid()) {
      setInterval(() => this.handleResponsiveLayout(), CONFIG.RESPONSIVE_CHECK_INTERVAL);
    }
  }
};

// ================================
// API MANAGER
// ================================
const APIManager = {
  /**
   * Obtiene partidos desde la API
   * @returns {Promise<Array>}
   */
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
  }
};

// ================================
// INICIALIZADOR PRINCIPAL
// ================================
const App = {
  /**
   * Inicializa la aplicación
   */
  async init() {
    try {
      // Inicializar elementos DOM
      DOMElements.init();
      
      // Configurar event listeners
      this.setupEventListeners();
      
      // Inicializar layout responsivo
      ResponsiveManager.init();
      
      // Cargar partidos
      await this.loadMatches();
      
    } catch (error) {
      console.error('Error al inicializar la aplicación:', error);
      this.handleInitError();
    }
  },
  
  /**
   * Configura event listeners
   */
  setupEventListeners() {
    // Botón de recarga
    if (DOMElements.reloadButton) {
      DOMElements.reloadButton.onclick = () => MatchManager.reloadFrame();
    }
    
    // Input de búsqueda
    if (DOMElements.inputSearch) {
      DOMElements.inputSearch.addEventListener('input', (e) => SearchManager.searchMatch(e));
    }
  },
  
  /**
   * Carga los partidos desde la API
   */
  async loadMatches() {
    try {
      // Mostrar loader
      if (DOMElements.loader) {
        DOMElements.loader.style.display = "flex";
      }
      
      const partidos = await APIManager.fetchPartidos();
      
      // Ocultar loader
      if (DOMElements.loader) {
        DOMElements.loader.style.display = "none";
      }
      
      // Guardar estado y renderizar
      AppState.setPartidos(partidos);
      
      if (partidos.length > 0) {
        ListRenderer.renderizarLista(partidos);
        MatchManager.actualizarPlayer(partidos[0]);
      } else {
        ListRenderer.renderEmptyState();
      }
      
    } catch (error) {
      // Ocultar loader
      if (DOMElements.loader) {
        DOMElements.loader.style.display = "none";
      }
      
      ListRenderer.renderErrorState();
      throw error;
    }
  },
  
  /**
   * Maneja errores de inicialización
   */
  handleInitError() {
    if (DOMElements.loader) {
      DOMElements.loader.style.display = "none";
    }
    
    if (DOMElements.gamelist) {
      DOMElements.gamelist.innerHTML = '<li class="error-state">Error al inicializar la aplicación.</li>';
    }
  }
};

 document.getElementById("close-btn").addEventListener("click", function() {
      document.getElementById("precontent-add").style.display = "none";})

// ================================
// INICIALIZACIÓN
// ================================

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}