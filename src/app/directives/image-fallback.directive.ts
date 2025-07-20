import { Directive, ElementRef, Input, Renderer2 } from '@angular/core';
import { ImageFallbackService } from '../services/image-fallback.service';

@Directive({
  selector: '[appImageFallback]',
  standalone: true
})
export class ImageFallbackDirective {
  @Input() fallbackType: 'product' | 'cart' = 'product';

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private imageFallbackService: ImageFallbackService
  ) {
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