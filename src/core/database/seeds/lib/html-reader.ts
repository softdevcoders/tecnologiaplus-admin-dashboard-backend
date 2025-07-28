import * as fs from 'fs';
import { enlacesParaReemplazar } from './enlaces-para-reemplazar-en-html';

const replaceLinksInHtml = (htmlContent: string) => {
  let modifiedHtml = htmlContent;

  // Recorremos la lista de enlaces a reemplazar
  enlacesParaReemplazar.forEach(({ previous, current }) => {
    // Si el enlace 'previous' es una URL completa, necesitamos reemplazar solo el path.
    // Si el enlace 'previous' contiene el dominio base, extraemos el path solo.
    const pathToReplace = new URL(previous).pathname;

    // Creamos una expresión regular para encontrar todas las instancias del `path` en el contenido HTML
    const regex = new RegExp(pathToReplace, 'g');
    const regexUrlBase = new RegExp('https://tecnologiaplus.com/', 'g');

    // Reemplazamos el `path` encontrado por la URL actual
    modifiedHtml = modifiedHtml.replace(regex, current);
    modifiedHtml = modifiedHtml.replace(regexUrlBase, '/');
  });

  return modifiedHtml;
};

export const htmlReader = (filePath: string) => {
  // Remove leading slash if present
  const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  const absolutePath = `./src/core/database/seeds/data/articles/html/${cleanPath}`;

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  const htmlContent = fs.readFileSync(absolutePath, 'utf-8');

  const modifiedHtml = replaceLinksInHtml(htmlContent);
  return modifiedHtml;
};
