/**
 * Configuración centralizada para Cloudinary
 *
 * Aquí puedes modificar fácilmente la estructura de carpetas
 * sin tener que buscar en múltiples archivos.
 */

export const CLOUDINARY_CONFIG = {
  // Nombre base de la carpeta principal en Cloudinary
  BASE_FOLDER: 'tecnologiaplus',

  // Estructura de carpetas para diferentes tipos de contenido
  FOLDERS: {
    // Imágenes principales de artículos
    ARTICLES_COVERS: 'articles/covers',

    // Imágenes del contenido de artículos
    ARTICLES_CONTENT: 'articles/content',

    // Futuras carpetas que puedas agregar:
    // USERS_AVATARS: 'users/avatars',
    // CATEGORIES_ICONS: 'categories/icons',
    // BANNERS: 'banners',
  },

  // Configuración de upload
  UPLOAD: {
    // Tamaño máximo de archivo en bytes (8MB)
    MAX_FILE_SIZE: 8 * 1024 * 1024,

    // Tipos de archivo permitidos
    ALLOWED_TYPES: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
      'image/tiff',
    ],

    // Tamaño de chunks para archivos grandes (6MB)
    CHUNK_SIZE: 6 * 1024 * 1024,
    
    // Configuración para mantener calidad original
    PRESERVE_QUALITY: {
      quality: 'auto:best', // Mantener la mejor calidad automática
      fetch_format: 'auto', // Mantener formato original
      flags: 'preserve_transparency', // Preservar transparencia
    },
  },

  // Configuración de transformaciones por defecto
  TRANSFORMATIONS: {
    // Para imágenes principales (covers)
    COVER: {
      width: 1200,
      height: 630,
      crop: 'fill',
      quality: 80,
      format: 'webp',
    },

    // Para imágenes de contenido
    CONTENT: {
      width: 800,
      crop: 'scale',
      quality: 80,
      format: 'webp',
    },

    // Para miniaturas
    THUMBNAIL: {
      width: 300,
      height: 200,
      crop: 'fill',
      quality: 80,
      format: 'webp',
    },
  },
} as const;

/**
 * Generar la ruta completa de una carpeta
 */
export function getCloudinaryFolder(
  folderType: keyof typeof CLOUDINARY_CONFIG.FOLDERS,
  sessionId?: string,
): string {
  const baseFolder = CLOUDINARY_CONFIG.BASE_FOLDER;
  const subFolder = CLOUDINARY_CONFIG.FOLDERS[folderType];

  if (sessionId) {
    return `${baseFolder}/${subFolder}/${sessionId}`;
  }

  return `${baseFolder}/${subFolder}`;
}

/**
 * Obtener configuración de transformación por tipo
 */
export function getTransformationConfig(
  type: keyof typeof CLOUDINARY_CONFIG.TRANSFORMATIONS,
) {
  return CLOUDINARY_CONFIG.TRANSFORMATIONS[type];
}
