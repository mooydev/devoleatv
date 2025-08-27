import puppeteer from 'puppeteer';
import { URL_SCR } from './config.js';

function parseTitulo(titulo) {
  const regex = /^([^:]+):\s*(.+)$/;
  const match = titulo.match(regex);

  if (!match) return null;

  return {
    torneo: match[1].trim(),
    equipos: match[2].trim()
  };
}

export async function scrapeRedCard(){

const URL = URL_SCR;

const browser = await puppeteer.launch({ 
  headless: true,
  args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
    ],
  executablePath: puppeteer.executablePath()
});
const page = await browser.newPage();

await page.goto(URL, { waitUntil: 'domcontentloaded' });

// Obtener estructura robusta
const enlaces = await page.evaluate(() => {
  const items = [];
  const eventos = document.querySelectorAll('ul.menu > li');

  eventos.forEach(evento => {
    const a = evento.querySelector(':scope > a');
    const spanHora = a?.querySelector('span.t');
    const hora = spanHora?.innerText.trim() || null;

    // Eliminar el span.t para extraer solo el texto del título
    spanHora?.remove();
    const titulo = a?.innerText.trim() || null;

    const subitems = evento.querySelectorAll('li.subitem1 a');

    subitems.forEach(a => {
      items.push({
        titulo,
        hora,
        canal: a.innerText.trim(),
        href: a.href
      });
    });
  });

  return items;
});

console.log(`Se encontraron ${enlaces.length} enlaces de canales.`);

const resultados = [];

for (const enlace of enlaces) {
  console.log(`Extrayendo: ${enlace.canal} (${enlace.titulo}) - ${enlace.href}`);
  try {
    const subPage = await browser.newPage();
    await subPage.goto(enlace.href, { waitUntil: 'domcontentloaded', timeout: 20000 });

    const iframeSrc = await subPage.$eval('.embed-responsive iframe', iframe =>
      iframe.getAttribute('src')
    );

    resultados.push({
      titulo: enlace.titulo,
      hora: enlace.hora,
      canal: enlace.canal,
      fuente: enlace.href,
      urlIframe: iframeSrc
    });
    await subPage.close();
  } catch (error) {
    console.error(`Error accediendo a ${enlace.href}: ${error.message}`);
  }
}

await browser.close();

const resultadosParseados = resultados.map(r => {
    const parsed = parseTitulo(r.titulo)
    if(!parsed) return null;
    return {
        hora: r.hora,
        torneo: parsed.torneo,
        equipos: parsed.equipos,
        link: r.urlIframe
      };
    })
    .filter(Boolean); // Elimina nulos por parseo fallido
console.log('\nResultados:\n', JSON.stringify(resultadosParseados, null, 2));
  return resultadosParseados;
}