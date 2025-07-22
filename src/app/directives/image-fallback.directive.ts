import { Directive, ElementRef, Input, Renderer2, inject } from '@angular/core';
import { ImageFallbackService } from '../services/image-fallback.service';

@Directive({
  selector: '[appImageFallback]',
  standalone: true
})
export class ImageFallbackDirective {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private imageFallbackService = inject(ImageFallbackService);

  @Input() fallbackType: 'product' | 'cart' = 'product';

  constructor() {
    this.setupFallback();
  }

  private setupFallback(): void {
    const img = this.el.nativeElement;
    
    // Stocker l'URL originale
    const originalSrc = img.src;
    this.renderer.setAttribute(img, 'data-original-src', originalSrc);
    
    // Ajouter l'écouteur d'erreur
    this.renderer.listen(img, 'error', (event) => {
      this.imageFallbackService.handleImageError(event, this.fallbackType);
    });
  }
}