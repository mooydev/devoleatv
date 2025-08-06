const iframe = document.getElementById('main-frame');
const tournamentElem = document.querySelector('.player-info .tournament');
const hourElem = document.querySelector('.player-info .hour');
const teamsElem = document.getElementById('teams-player');
const gamelist = document.querySelector('.gamelist ul');
const playerBox = document.querySelector('.player-box');

const {DateTime} = luxon;
// función para convertir hora "HH:mm" que llega del endpoint
// en zona UTC-5 a hora local y formatear en "hh:mm a" o "HH:mm"
function convertirHoraLocal(horaUTCmenos5) {
  // Extraemos horas y minutos
  const [h, m] = horaUTCmenos5.split(':').map(Number);

  // Creamos DateTime en zona UTC-5 con fecha actual
  const dt = DateTime.fromObject(
    { hour: h, minute: m },
    { zone: 'UTC-5' }
  );

  // Convertimos a zona local del navegador y formateamos la hora (ej: 14:00 o 2:00 PM)
  return dt.setZone(Intl.DateTimeFormat().resolvedOptions().timeZone).toLocaleString(
    DateTime.TIME_SIMPLE
  );
}

// Guarda el stream actual para evitar recargas
let currentStreamUrl = ''; 

//actualiza el reproductor y la info del partido
function actualizarPlayer(partido) {
   // Si el partido ya esta en el reproductor NO RECARGA
  if (partido.link === currentStreamUrl) return;

  currentStreamUrl = partido.link;
  iframe.src = partido.link;
  tournamentElem.textContent = partido.torneo;
  //Se llama la funcion con luxon para actualizar la hora.
  const horaLocal = convertirHoraLocal(partido.hora);
  hourElem.textContent = horaLocal;
  teamsElem.textContent = partido.equipos;

  //antes de agregar la clase active al elemento seleccionado, remueve 
  document.querySelectorAll('.match.active').forEach(el => el.classList.remove('active'));
  // Activa el partido actual visualmente
  const index = Array.from(gamelist.children).findIndex(li =>
    li.dataset.id === partido.id_partido.toString()
  );
  if (index !== -1) gamelist.children[index].classList.add('active');

  // Scroll suave al reproductor en móviles
  if (window.innerWidth <= 768) {
    playerBox.scrollIntoView({ behavior: 'smooth' });
  }
}

// crea la lista de partidos
function renderizarLista(partidos) {
  gamelist.innerHTML = '';
  partidos.forEach(partido => {
    const horaLocal = convertirHoraLocal(partido.hora);
    const li = document.createElement('li');
    li.classList.add('match');
    li.dataset.id = partido.id_partido; // útil para activar visualmente
    li.innerHTML = `
      <a href="#" class="match-a">
        <div class="match-info">
          <div id="match-info-tournament-hour">
            <p class="tournament">${partido.torneo}</p>
            <p class="tournament">|</p>
            <p class="hour">${horaLocal}</p>
          </div>
          <div id="match-info-teams">
            <p class="teams">${partido.equipos}</p>
          </div>
        </div>
        <div id="match-info-img">
          <img src="assets/images/play.svg" alt="Reproducir partido">
        </div>
      </a>
    `;
      li.querySelector('a').addEventListener('click', e => {
      e.preventDefault();
      actualizarPlayer(partido);
    });
    gamelist.appendChild(li);
  });
}

const API_URL = "https://devoleatv-api.onrender.com/api/partidos"
// inicializa la app
function init() {
  fetch(API_URL)
    .then(res => res.json())
    .then(partidos => {
      if (partidos.length > 0) {
        renderizarLista(partidos);
        actualizarPlayer(partidos[0]);
      } else {
        gamelist.innerHTML = '<li>No hay partidos disponibles hoy.</li>';
      }
    })
    .catch(err => {
      console.error('Error al cargar partidos:', err);
      gamelist.innerHTML = '<li>Error al cargar partidos.</li>';
    });
}
init(); // lanzamiento

