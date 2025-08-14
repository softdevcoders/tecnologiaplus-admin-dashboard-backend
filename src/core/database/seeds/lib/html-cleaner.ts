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
    .replace(/&apos;/g, "'")
    .replace(/&#8230;/g, '...');

  // Limpiar emojis
  const textWithoutEmojis = textWithoutEntities.replace(
    /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
    '',
  );

  // Limpiar espacios múltiples y saltos de línea
  const cleanText = textWithoutEmojis
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();

  return cleanText;
};
