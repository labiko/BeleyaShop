import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabase.url, environment.supabase.anonKey);
  }

  get client() {
    return this.supabase;
  }

  // Méthodes pour les produits
  async getProducts() {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('in_stock', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des produits:', error);
      throw error;
    }

    return data;
  }

  // Méthode pour l'admin - récupère TOUS les produits
  async getAllProductsForAdmin() {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des produits pour admin:', error);
      throw error;
    }

    return data;
  }

  async getProductById(id: number) {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erreur lors de la récupération du produit:', error);
      throw error;
    }

    return data;
  }

  async getProductsByCategory(category: string) {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .eq('in_stock', true)
      .order('name');

    if (error) {
      console.error('Erreur lors de la récupération des produits par catégorie:', error);
      throw error;
    }

    return data;
  }

  async createProduct(product: any) {
    const { data, error } = await this.supabase
      .from('products')
      .insert([product])
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création du produit:', error);
      throw error;
    }

    return data;
  }

  async updateProduct(id: number, updates: any) {
    const { data, error } = await this.supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour du produit:', error);
      throw error;
    }

    return data;
  }

  async deleteProduct(id: number) {
    const { error } = await this.supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erreur lors de la suppression du produit:', error);
      throw error;
    }

    return true;
  }

  // Méthodes pour les catégories
  async getCategories() {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      throw error;
    }

    return data;
  }

  async createCategory(category: any) {
    const { data, error } = await this.supabase
      .from('categories')
      .insert([category])
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création de la catégorie:', error);
      throw error;
    }

    return data;
  }

  async updateCategory(id: number, updates: any) {
    const { data, error } = await this.supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour de la catégorie:', error);
      throw error;
    }

    return data;
  }

  async deleteCategory(id: number) {
    const { error } = await this.supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erreur lors de la suppression de la catégorie:', error);
      throw error;
    }

    return true;
  }
}