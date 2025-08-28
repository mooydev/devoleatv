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
      "--disable-dev-shm-usage", // 👈 Importante para contenedores
      "--disable-gpu",
      "--disable-web-security",
      "--no-first-run",
      "--disable-extensions",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding"
    ],
    executablePath: puppeteer.executablePath()
  });

  // Reutilizar la misma página en lugar de crear nuevas
  const page = await browser.newPage();
  
  // Reducir memoria deshabilitando imágenes y CSS
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if(req.resourceType() == 'stylesheet' || req.resourceType() == 'image'){
      req.abort();
    } else {
      req.continue();
    }
  });

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

  // 🔥 CAMBIO CLAVE: Procesar reutilizando la página y con monitoreo de memoria
  for (let i = 0; i < enlaces.length; i++) {
    const enlace = enlaces[i];
    console.log(`Extrayendo: ${enlace.canal} (${enlace.titulo}) - ${enlace.href}`);
    
    try {
      // Reutilizar la misma página en lugar de crear nuevas
      await page.goto(enlace.href, { 
        waitUntil: 'domcontentloaded', 
        timeout: 15000 
      });

      const iframeSrc = await page.$eval('.embed-responsive iframe', iframe =>
        iframe.getAttribute('src')
      ).catch(() => null); // Manejo de errores más suave

      if (iframeSrc) {
        resultados.push({
          titulo: enlace.titulo,
          hora: enlace.hora,
          canal: enlace.canal,
          fuente: enlace.href,
          urlIframe: iframeSrc
        });
      }

      // Limpiar memoria cada 10 elementos
      if (i % 10 === 0) {
        await page.evaluate(() => {
          if (window.gc) window.gc();
        });
        
        // Mostrar uso de memoria
        const formatBytes = (bytes) => Math.round(bytes / 1024 / 1024) + 'MB';
        const mem = process.memoryUsage();
        console.log(`Memoria usada: ${formatBytes(mem.heapUsed)} de ${formatBytes(mem.heapTotal)}`);
      }

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