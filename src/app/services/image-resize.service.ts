import { Injectable } from '@angular/core';

export interface ResizeOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number; // 0-1, where 1 is best quality
  outputFormat?: 'jpeg' | 'png' | 'webp';
}

@Injectable({
  providedIn: 'root'
})
export class ImageResizeService {

  constructor() { }

  /**
   * Redimensionne une image en conservant le ratio d'aspect
   */
  async resizeImage(file: File, options: ResizeOptions): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Calculer les nouvelles dimensions en conservant le ratio
          const { width, height } = this.calculateDimensions(
            img.width,
            img.height,
            options.maxWidth,
            options.maxHeight
          );

          // Configurer le canvas
          canvas.width = width;
          canvas.height = height;

          // Activer le lissage pour une meilleure qualité
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Dessiner l'image redimensionnée
            ctx.drawImage(img, 0, 0, width, height);

            // Convertir en blob puis en File
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const resizedFile = new File(
                    [blob],
                    this.generateFileName(file.name, width, height),
                    {
                      type: this.getOutputMimeType(options.outputFormat || 'jpeg'),
                      lastModified: Date.now()
                    }
                  );
                  resolve(resizedFile);
                } else {
                  reject(new Error('Erreur lors de la conversion en blob'));
                }
              },
              this.getOutputMimeType(options.outputFormat || 'jpeg'),
              options.quality
            );
          } else {
            reject(new Error('Impossible d\'obtenir le contexte 2D du canvas'));
          }
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Erreur lors du chargement de l\'image'));
      };

      // Charger l'image
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Redimensionne plusieurs images en parallèle
   */
  async resizeMultipleImages(files: File[], options: ResizeOptions): Promise<File[]> {
    try {
      const resizePromises = files.map(file => this.resizeImage(file, options));
      return await Promise.all(resizePromises);
    } catch (error) {
      console.error('Erreur lors du redimensionnement multiple:', error);
      throw error;
    }
  }

  /**
   * Calcule les nouvelles dimensions en conservant le ratio d'aspect
   */
  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    
    // Si l'image est déjà plus petite que les dimensions maximales
    if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
      return { width: originalWidth, height: originalHeight };
    }

    const aspectRatio = originalWidth / originalHeight;

    let newWidth = maxWidth;
    let newHeight = maxWidth / aspectRatio;

    // Si la hauteur calculée dépasse le maximum, recalculer à partir de la hauteur
    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = maxHeight * aspectRatio;
    }

    return {
      width: Math.round(newWidth),
      height: Math.round(newHeight)
    };
  }

  /**
   * Génère un nom de fichier avec les nouvelles dimensions
   */
  private generateFileName(originalName: string, width: number, height: number): string {
    const lastDotIndex = originalName.lastIndexOf('.');
    const nameWithoutExtension = originalName.substring(0, lastDotIndex);
    const extension = originalName.substring(lastDotIndex);
    
    return `${nameWithoutExtension}_${width}x${height}${extension}`;
  }

  /**
   * Retourne le type MIME pour le format de sortie
   */
  private getOutputMimeType(format: string): string {
    switch (format) {
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      case 'jpeg':
      default:
        return 'image/jpeg';
    }
  }

  /**
   * Valide si le fichier est une image
   */
  isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  /**
   * Retourne la taille du fichier en MB
   */
  getFileSizeInMB(file: File): number {
    return file.size / (1024 * 1024);
  }

  /**
   * Configurations prédéfinies pour différents usages
   */
  static readonly PRESETS = {
    THUMBNAIL: {
      maxWidth: 150,
      maxHeight: 150,
      quality: 0.8,
      outputFormat: 'jpeg' as const
    },
    PRODUCT_IMAGE: {
      maxWidth: 800,
      maxHeight: 600,
      quality: 0.85,
      outputFormat: 'jpeg' as const
    },
    HERO_IMAGE: {
      maxWidth: 1200,
      maxHeight: 800,
      quality: 0.9,
      outputFormat: 'jpeg' as const
    },
    AVATAR: {
      maxWidth: 200,
      maxHeight: 200,
      quality: 0.8,
      outputFormat: 'jpeg' as const
    }
  };

  /**
   * Redimensionne avec un preset prédéfini
   */
  async resizeWithPreset(file: File, presetName: keyof typeof ImageResizeService.PRESETS): Promise<File> {
    const preset = ImageResizeService.PRESETS[presetName];
    return this.resizeImage(file, preset);
  }

  /**
   * Obtient les informations d'une image sans la charger complètement
   */
  async getImageInfo(file: File): Promise<{ width: number; height: number; size: number; type: string }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          size: file.size,
          type: file.type
        });
      };

      img.onerror = () => {
        reject(new Error('Erreur lors du chargement de l\'image'));
      };

      img.src = URL.createObjectURL(file);
    });
  }
}