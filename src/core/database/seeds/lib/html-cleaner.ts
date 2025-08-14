/**
 * Limpia el contenido HTML de un texto, removiendo todas las etiquetas HTML
 * y dejando solo el texto plano
 */
export const cleanHtml = (htmlContent: string): string => {
  if (!htmlContent) return '';

  // Remover todas las etiquetas HTML
  const textWithoutTags = htmlContent.replace(/<[^>]*>/g, '');

  // Remover entidades HTML comunes
  const textWithoutEntities = textWithoutTags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

  // Limpiar espacios múltiples y saltos de línea
  const cleanText = textWithoutEntities
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();

  return cleanText;
};
