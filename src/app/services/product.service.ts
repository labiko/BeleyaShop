import { Injectable, inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Product } from '../models/product';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private supabaseService = inject(SupabaseService);


  constructor() { 
    this.initializeProducts();
  }

  private async initializeProducts() {
    try {
      const products = await this.supabaseService.getProducts();
      if (!products || products.length === 0) {
        await this.seedInitialProducts();
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des produits:', error);
    }
  }

  private async seedInitialProducts() {
    const initialProducts = [
      {
        name: 'Crème Nivea Soft',
        description: 'Crème hydratante pour peau douce et soyeuse. Enrichie en jojoba et vitamine E.',
        price: 100000,
        image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop&crop=center',
        category: 'cremes',
        in_stock: true,
        stock_quantity: 50,
        three_day_delivery_eligible: true
      },
      {
        name: 'Crème Vaseline Intensive Care',
        description: 'Soin intensif pour peaux très sèches. Hydratation 24h garantie.',
        price: 120000,
        image: 'https://images.unsplash.com/photo-1570554886111-e80fcca6a029?w=400&h=400&fit=crop&crop=center',
        category: 'cremes',
        in_stock: true,
        stock_quantity: 30,
        three_day_delivery_eligible: true
      },
      {
        name: 'Gel Douche Dove',
        description: 'Gel douche hydratant au 1/4 de crème hydratante. Douceur incomparable.',
        price: 80000,
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=center',
        category: 'gels',
        in_stock: true,
        stock_quantity: 75,
        three_day_delivery_eligible: true
      },
      {
        name: 'Gel Douche Johnson\'s Baby',
        description: 'Formule douce spécialement conçue pour les peaux sensibles.',
        price: 75000,
        image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&h=400&fit=crop&crop=center',
        category: 'gels',
        in_stock: true,
        stock_quantity: 40,
        three_day_delivery_eligible: true
      },
      {
        name: 'Parfum CK One',
        description: 'Parfum mixte Calvin Klein. Fraîcheur moderne et élégante.',
        price: 250000,
        image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop&crop=center',
        category: 'parfums',
        in_stock: true,
        stock_quantity: 15,
        three_day_delivery_eligible: false
      },
      {
        name: 'Parfum Adidas Dynamic Pulse',
        description: 'Parfum homme énergisant. Notes fraîches et sportives.',
        price: 180000,
        image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&h=400&fit=crop&crop=center',
        category: 'parfums',
        in_stock: true,
        stock_quantity: 25,
        three_day_delivery_eligible: false
      },
      {
        name: 'Crème L\'Occitane Karité',
        description: 'Crème nourrissante au beurre de karité. Réparation intense.',
        price: 150000,
        image: 'https://images.unsplash.com/photo-1556228852-33462d9de1a5?w=400&h=400&fit=crop&crop=center',
        category: 'cremes',
        in_stock: true,
        stock_quantity: 20,
        three_day_delivery_eligible: true
      },
      {
        name: 'Gel Exfoliant Neutrogena',
        description: 'Gel nettoyant exfoliant pour une peau nette et purifiée.',
        price: 90000,
        image: 'https://images.unsplash.com/photo-1556228894-56c2f0ba90aa?w=400&h=400&fit=crop&crop=center',
        category: 'gels',
        in_stock: true,
        stock_quantity: 35,
        three_day_delivery_eligible: true
      }
    ];

    for (const product of initialProducts) {
      try {
        await this.supabaseService.createProduct(product);
        console.log(`Produit créé: ${product.name}`);
      } catch (error) {
        console.error(`Erreur lors de la création du produit ${product.name}:`, error);
      }
    }
  }

  getAllProducts(): Observable<Product[]> {
    return from(this.supabaseService.getProducts()).pipe(
      map(products => products.map(this.mapSupabaseToProduct)),
      catchError(error => {
        console.error('Erreur lors de la récupération des produits:', error);
        return of([]);
      })
    );
  }

  // Méthode pour forcer le rafraîchissement (invalide le cache)
  forceRefreshProducts(): Observable<Product[]> {
    console.log('🔄 Forçage du rafraîchissement des produits...');
    return from(this.supabaseService.getProducts()).pipe(
      map(products => {
        const mappedProducts = products.map(this.mapSupabaseToProduct);
        console.log('🔄 Produits rafraîchis:', mappedProducts.length);
        return mappedProducts;
      }),
      catchError(error => {
        console.error('Erreur lors du rafraîchissement forcé:', error);
        return of([]);
      })
    );
  }

  // Méthode pour l'admin - récupère TOUS les produits (y compris en rupture)
  getAllProductsForAdmin(): Observable<Product[]> {
    return from(this.supabaseService.getAllProductsForAdmin()).pipe(
      map(products => products.map(this.mapSupabaseToProduct)),
      catchError(error => {
        console.error('Erreur lors de la récupération des produits pour admin:', error);
        return of([]);
      })
    );
  }

  getProductsByCategory(category: string): Observable<Product[]> {
    return from(this.supabaseService.getProductsByCategory(category)).pipe(
      map(products => products.map(this.mapSupabaseToProduct)),
      catchError(error => {
        console.error('Erreur lors de la récupération des produits par catégorie:', error);
        return of([]);
      })
    );
  }

  getProductById(id: number): Observable<Product | undefined> {
    return from(this.supabaseService.getProductById(id)).pipe(
      map(product => product ? this.mapSupabaseToProduct(product) : undefined),
      catchError(error => {
        console.error('Erreur lors de la récupération du produit:', error);
        return of(undefined);
      })
    );
  }

  private mapSupabaseToProduct(supabaseProduct: any): Product {
    return {
      id: supabaseProduct.id,
      name: supabaseProduct.name,
      description: supabaseProduct.description,
      price: supabaseProduct.price,
      image: supabaseProduct.image,
      category: supabaseProduct.category,
      inStock: supabaseProduct.in_stock,
      stock_quantity: supabaseProduct.stock_quantity || 0,
      three_day_delivery_eligible: supabaseProduct.three_day_delivery_eligible || false
    };
  }

  getCategories(): Observable<any[]> {
    return from(this.supabaseService.getCategories()).pipe(
      catchError(error => {
        console.error('Erreur lors du chargement des catégories:', error);
        // En cas d'erreur, retourner les catégories par défaut
        return of([
          { name: 'Soins du visage', icon: 'face-outline' },
          { name: 'Maquillage', icon: 'brush-outline' },
          { name: 'Parfums', icon: 'flower-outline' }
        ]);
      })
    );
  }
}
