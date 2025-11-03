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
  POPUNDER_LIMIT: 3,
  IFRAME_LOAD_TIMEOUT: 15000
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
  iframeLoading: null,
  iframeError: null,

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
    this.createIframeOverlays();
    this.validateElements();
  },

  createIframeOverlays() {
    const iframeContainer = document.querySelector('.iframe-container');

    if (!iframeContainer) {
      console.error('No se encontró .iframe-container');
      return;
    }

    this.iframeLoading = document.createElement('div');
    this.iframeLoading.id = 'iframe-loading';
    this.iframeLoading.className = 'iframe-overlay iframe-loading-overlay';
    this.iframeLoading.innerHTML = `
    <div class="iframe-loading-content">
      <div class="iframe-spinner"></div>
    </div>
  `;

    this.iframeError = document.createElement('div');
    this.iframeError.id = 'iframe-error';
    this.iframeError.className = 'iframe-overlay iframe-error-overlay';
    this.iframeError.innerHTML = `
    <div class="iframe-error-content">
      <h3 class="iframe-error-title">ALGO SALIÓ MAL</h3>
      <p class="iframe-error-description">No se pudo cargar el recurso. Esto puede suceder por:</p>
      <ul class="iframe-error-reasons">
        <li>Algo en la red bloqueó el acceso</li>
        <li>Conexión lenta o interrumpida</li>
        <li>Stream no disponible o expirado</li>
      </ul>
      <p class="iframe-error-description">Prueba recargar el reproductor con el boton inferior derecho</p>
    </div>
  `;
    iframeContainer.appendChild(this.iframeLoading);
    iframeContainer.appendChild(this.iframeError);
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
// MANEJO DEL IFRAME CON LOADING Y ERRORES
// ================================
const IframeManager = {
  loadTimeout: null,

  showLoading() {
    if (DOMElements.iframeLoading) {
      DOMElements.iframeLoading.style.display = 'flex';
    }
  },

  hideLoading() {
    if (DOMElements.iframeLoading) {
      DOMElements.iframeLoading.style.display = 'none';
    }
  },

  showError() {
    if (DOMElements.iframeError) {
      DOMElements.iframeError.style.display = 'flex';
    }
  },

  hideError() {
    if (DOMElements.iframeError) {
      DOMElements.iframeError.style.display = 'none';
    }
  },

  setLoadTimeout() {
    this.clearLoadTimeout();
    this.loadTimeout = setTimeout(() => {
      if (DOMElements.iframeLoading.style.display === 'flex') {
        this.showError();
        this.hideLoading();
      }
    }, CONFIG.IFRAME_LOAD_TIMEOUT);
  },

  clearLoadTimeout() {
    if (this.loadTimeout) {
      clearTimeout(this.loadTimeout);
      this.loadTimeout = null;
    }
  },

  init() {
    if (!DOMElements.iframe) return;

    DOMElements.iframe.addEventListener('load', () => {
      this.clearLoadTimeout();
      this.hideLoading();
      this.hideError();
    });

    DOMElements.iframe.addEventListener('error', () => {
      this.clearLoadTimeout();
      this.hideLoading();
      this.showError();
    });
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

const DateUtils = {
  parseMatchTime(horaUTCminus5, fecha = null) {
    const { DateTime } = luxon;
    const [h, m] = horaUTCminus5.split(':').map(Number);

    let year, month, day;

    if (fecha) {
      // Formato nuevo: "2025-10-28"
      const [y, m, d] = fecha.split('-').map(Number);
      year = y;
      month = m;
      day = d;
    } else {
      const now = DateTime.now();
      year = now.year;
      month = now.month;
      day = now.day;
    }

    const matchTimeUTC5 = DateTime.fromObject(
      { year, month, day, hour: h, minute: m, second: 0, millisecond: 0 },
      { zone: 'UTC-5' }
    );

    return matchTimeUTC5.setZone('local');
  },

  isMatchExpired(horaUTCminus5, fecha = null) {
    const matchTime = this.parseMatchTime(horaUTCminus5, fecha);
    const now = luxon.DateTime.now();
    const duration = now.diff(matchTime, 'minutes').minutes;
    return duration > 135;
  },

  compareMatchTimes(horaA, fechaA, horaB, fechaB) {
    const timeA = this.parseMatchTime(horaA, fechaA);
    const timeB = this.parseMatchTime(horaB, fechaB);
    return timeA.toMillis() - timeB.toMillis();
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
// MANEJO DEL NOTICE/MODAL
// ================================
const NoticeManager = {
  STORAGE_KEY: 'devoleatv_notice_closed',
  NOTICE_VERSION: 'android_app_v1', // cambiar para mostrar nuevo aviso

  isAndroidApp() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isAndroid = /android/i.test(userAgent);
    const isWebView = /wv|webview/i.test(userAgent);
    const isDeVoleaApp = /DeVoleaApp/i.test(userAgent);

    return (isAndroid && isWebView) || isDeVoleaApp;
  },

  hasClosedNotice() {
    try {
      const closedVersion = localStorage.getItem(this.STORAGE_KEY);
      return closedVersion === this.NOTICE_VERSION;
    } catch (e) {
      console.warn('LocalStorage no disponible:', e);
      return false;
    }
  },

  markAsClosed() {
    try {
      localStorage.setItem(this.STORAGE_KEY, this.NOTICE_VERSION);
    } catch (e) {
      console.warn('No se pudo guardar en LocalStorage:', e);
    }
  },

  shouldShowNotice() {
    if (this.isAndroidApp()) {
      return false;
    }

    if (this.hasClosedNotice()) {
      return false;
    }

    return true;
  },

  show() {
    const notice = document.getElementById('notice');
    if (notice) {
      notice.classList.add('show');
    }
  },

  hide() {
    const notice = document.getElementById('notice');
    if (notice) {
      notice.classList.remove('show');
      this.markAsClosed();
    }
  },

  init() {
    const closeBtn = document.getElementById('close-btn');
    const downloadBtn = document.getElementById('download-btn');
    const notice = document.getElementById('notice');

    if (!notice) {
      console.warn('Elemento #notice no encontrado');
      return;
    }

    // Event listener para cerrar
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hide();
      });
    }

    // Event listener para el botón de descarga
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        console.log('Usuario hizo clic en descargar app');
        this.hide();
      });
    }

    // Cerrar al hacer clic fuera del modal
    notice.addEventListener('click', (e) => {
      if (e.target === notice) {
        this.hide();
      }
    });

    // Cerrar con tecla ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && notice.classList.contains('show')) {
        this.hide();
      }
    });

    // Mostrar el notice si corresponde
    if (this.shouldShowNotice()) {
      setTimeout(() => {
        this.show();
      }, 1500);
    }
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

    if (!link) {
      console.error('Link no disponible');
      return;
    }

    const isSameStream = link === AppState.getCurrentStream();

    try {
      this.updateMatchInfo(partido);
      this.setActiveMatch(partido.id_partido);
      this.setActiveLink(linkIndex, partido.id_partido);

      if (!isSameStream) {
        IframeManager.showLoading();
        IframeManager.hideError();
        IframeManager.setLoadTimeout();

        DOMElements.iframe.src = link;
        AppState.setCurrentStream(link);
        AppState.setActiveLink(linkIndex, partido.id_partido);

        if (DOMElements.reloadButton) {
         this.enableReloadButton();
        }
      }
      this.scrollToPlayerOnMobile();
    } catch (error) {
      console.error('Error al actualizar reproductor:', error);
      IframeManager.hideLoading();
      IframeManager.showError();
    }
  },

  setActiveLink(linkIndex, partidoId) {
    document.querySelectorAll('.links-list a.active').forEach(el =>
      el.classList.remove('active')
    );

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
    document.querySelectorAll('.match.active, .links-list.active').forEach(el =>
      el.classList.remove('active')
    );

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
    if (DOMElements.iframe && DOMElements.iframe.src && DOMElements.iframe.src !== window.location.href) {
      IframeManager.showLoading();
      IframeManager.hideError();
      IframeManager.setLoadTimeout();
      DOMElements.iframe.src = DOMElements.iframe.src;
    } else {
      console.log('No hay stream para recargar');
    }
  },

  disableReloadButton() {
    if (DOMElements.reloadButton) {
      DOMElements.reloadButton.disabled = true;
      DOMElements.reloadButton.style.opacity = '0.5';
      DOMElements.reloadButton.style.cursor = 'not-allowed';
    }
  },

  enableReloadButton() {
    if (DOMElements.reloadButton) {
      DOMElements.reloadButton.disabled = false;
      DOMElements.reloadButton.style.opacity = '1';
      DOMElements.reloadButton.style.cursor = 'pointer';
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
    DOMElements.gamelist.innerHTML = '<li class="empty-state">Parece que no hay eventos en este momento.</li>';
    MatchManager.disableReloadButton();
  },

  renderErrorState() {
    DOMElements.gamelist.innerHTML = '<li class="error-state">Algo salió mal al intentar obtener los eventos.<button class="button-normal" onclick="location.reload()">Reintentar</button></li>';
    MatchManager.disableReloadButton();
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
      }else{
        MatchManager.disableReloadButton();
      }
      return;
    }

    const results = this.filterMatches(searchTerm);
    ListRenderer.renderizarLista(results);
    if (results.length > 0) {
      MatchManager.setActiveMatch(results[0].id_partido);
    }else{
      MatchManager.disableReloadButton();
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
    const grouped = Object.values(
      partidos.reduce((acc, item) => {
        const key = `${item.equipos}`;
        if (!acc[key]) {
          acc[key] = {
            id_partido: item.id_partido,
            hora: item.hora,
            fecha: item.fecha,
            torneo: item.torneo,
            equipos: item.equipos,
            links: []
          };
        }
        acc[key].links.push(item.link);
        return acc;
      }, {})
    );

    return this.filterAndSortMatches(grouped);
  },

  filterAndSortMatches(partidos) {
    const { DateTime } = luxon;
    const today = DateTime.now();

    // Filtrar solo partidos de hoy que no hayan expirado
    const active = partidos.filter(p => {
      if (!p.fecha) return false;

      // Parsear fecha formato "YYYY-MM-DD"
      const [year, month, day] = p.fecha.split('-').map(Number);

      // Verificar que sea de hoy
      const isToday = (
        year === today.year &&
        month === today.month &&
        day === today.day
      );

      if (!isToday) return false;

      // Verificar que no haya expirado
      return !DateUtils.isMatchExpired(p.hora, p.fecha);
    });

    // Ordenar por hora
    active.sort((a, b) =>
      DateUtils.compareMatchTimes(a.hora, a.fecha, b.hora, b.fecha)
    );


    return active;
  }
};

// ================================
// INICIALIZADOR PRINCIPAL
// ================================
const App = {
  refreshInterval: null,
  async init() {
    try {
      DOMElements.init();
      IframeManager.init();
      NoticeManager.init();
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
      DOMElements.gamelist.innerHTML = '<li class="error-state">Error al iniciar la aplicación. <button class="button-normal" onclick="location.reload()">Reintentar</button></li>';
    }
  },

  startAutoRefresh() {
    // Revisar cada 5 minutos si hay partidos que ocultar
    this.refreshInterval = setInterval(() => {
      const current = AppState.getPartidos();
      const filtered = APIManager.filterAndSortMatches(current);

      if (filtered.length !== current.length) {
        console.log('Actualizando lista: partidos vencidos removidos');
        AppState.setPartidos(filtered);
        ListRenderer.renderizarLista(filtered);

        // Si el partido actual venció, cargar el siguiente
        if (filtered.length > 0) {
          MatchManager.actualizarPlayer(filtered[0], 0);
        }else{
          MatchManager.disableReloadButton();
        }
      }
    }, 5 * 60 * 1000); // 5 minutos
  },

  // Limpiar al cerrar
  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
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