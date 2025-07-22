import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ImageFallbackService {

  private readonly PRODUCT_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDQwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjlmYWZiIi8+CjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjM4MCIgaGVpZ2h0PSIxODAiIHJ4PSI4IiBzdHJva2U9IiNlNWU3ZWIiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0id2hpdGUiLz4KPGNpcmNsZSBjeD0iMjAwIiBjeT0iODAiIHI9IjI1IiBmaWxsPSIjM2Y4MmY2Ii8+CjxwYXRoIGQ9Ik0xODUgNzVoMzB2MTBoLTMweiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTE5MCA4MGgxMHYxNWgtMTB6IiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMjAwIDgwaDEwdjE1aC0xMHoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xODAgMTA1aDQwdjUwaC00MHoiIGZpbGw9IiNmMWY1ZjkiIHN0cm9rZT0iI2Q0ZDRkOCIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTMwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgZmlsbD0iIzM3NDE1MSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iNTAwIj5Qcm9kdWl0PC90ZXh0Pgo8dGV4dCB4PSIyMDAiIHk9IjE0NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9ImNlbnRyYWwiIGZpbGw9IiM2YjcyODAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiI+Y29zbcOpdGlxdWU8L3RleHQ+CjxjaXJjbGUgY3g9IjE3MCIgY3k9IjE3MCIgcj0iNCIgZmlsbD0iI2ZhNTI1MiIvPgo8Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNzAiIHI9IjQiIGZpbGw9IiNlYzQ4OTkiLz4KPGNpcmNsZSBjeD0iMjMwIiBjeT0iMTcwIiByPSI0IiBmaWxsPSIjMzkyNGE5Ii8+Cjwvc3ZnPg==';
  
  private readonly CART_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjZjlmYWZiIiByeD0iOCIvPgo8Y2lyY2xlIGN4PSI1MCIgY3k9IjM1IiByPSIxNSIgZmlsbD0iIzNmODJmNiIvPgo8cGF0aCBkPSJNNDAgMzJoMjB2NmgtMjB6IiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNNDUgMzZoNXY5aC01eiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTUwIDM2aDV2OWgtNXoiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHg9IjM1IiB5PSI1NSIgd2lkdGg9IjMwIiBoZWlnaHQ9IjI1IiBmaWxsPSIjZjFmNWY5IiBzdHJva2U9IiNkNGQ0ZDgiIHN0cm9rZS13aWR0aD0iMSIgcng9IjQiLz4KPHRleHQgeD0iNTAiIHk9IjY3IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgZmlsbD0iIzM3NDE1MSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjgiIGZvbnQtd2VpZ2h0PSI1MDAiPlByb2R1aXQ8L3RleHQ+CjxjaXJjbGUgY3g9IjQwIiBjeT0iODUiIHI9IjIiIGZpbGw9IiNmYTUyNTIiLz4KPGNpcmNsZSBjeD0iNTAiIGN5PSI4NSIgcj0iMiIgZmlsbD0iI2VjNDg5OSIvPgo8Y2lyY2xlIGN4PSI2MCIgY3k9Ijg1IiByPSIyIiBmaWxsPSIjMzkyNGE5Ii8+Cjwvc3ZnPg==';

  constructor() { }

  handleImageError(event: any, type: 'product' | 'cart' = 'product'): void {
    const img = event.target;
    if (!img.hasAttribute('data-error-handled')) {
      img.setAttribute('data-error-handled', 'true');
      img.src = type === 'cart' ? this.CART_PLACEHOLDER : this.PRODUCT_PLACEHOLDER;
      console.warn(`Image failed to load (${type}):`, img.getAttribute('data-original-src') || img.src);
    }
  }

  preloadImage(src: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }

  getPlaceholder(type: 'product' | 'cart' = 'product'): string {
    return type === 'cart' ? this.CART_PLACEHOLDER : this.PRODUCT_PLACEHOLDER;
  }
}