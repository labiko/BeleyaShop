import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { OrderNumberGenerator } from './order-number.util';

/**
 * Script de migration pour mettre à jour les numéros de commande existants
 * au format GN905EGXXXXX
 */
export class OrderNumberMigration {
  private static supabase = createClient(environment.supabase.url, environment.supabase.anonKey);

  /**
   * Migre tous les numéros de commande existants
   */
  static async migrateOrderNumbers(): Promise<{
    success: boolean;
    migratedCount: number;
    errors: any[];
  }> {
    console.log('🔄 Début de la migration des numéros de commande...');
    
    let migratedCount = 0;
    const errors: any[] = [];

    try {
      // Récupérer toutes les commandes sans order_number ou avec l'ancien format
      const { data: orders, error: fetchError } = await this.supabase
        .from('orders')
        .select('id, order_number, created_at')
        .order('created_at', { ascending: true });

      if (fetchError) {
        console.error('❌ Erreur lors de la récupération des commandes:', fetchError);
        return { success: false, migratedCount: 0, errors: [fetchError] };
      }

      if (!orders || orders.length === 0) {
        console.log('✅ Aucune commande à migrer');
        return { success: true, migratedCount: 0, errors: [] };
      }

      console.log(`📊 ${orders.length} commandes trouvées`);

      // Traiter chaque commande
      for (const order of orders) {
        // Vérifier si la commande a déjà un numéro au bon format
        if (order.order_number && OrderNumberGenerator.isValid(order.order_number)) {
          console.log(`✓ Commande ${order.id} déjà migrée: ${order.order_number}`);
          continue;
        }

        try {
          // Générer un nouveau numéro
          const newOrderNumber = OrderNumberGenerator.generate();
          
          // Mettre à jour en base
          const { error: updateError } = await this.supabase
            .from('orders')
            .update({ order_number: newOrderNumber })
            .eq('id', order.id);

          if (updateError) {
            console.error(`❌ Erreur migration commande ${order.id}:`, updateError);
            errors.push({ orderId: order.id, error: updateError });
          } else {
            console.log(`✅ Commande ${order.id} migrée: ${newOrderNumber}`);
            migratedCount++;
          }

          // Attendre un peu entre chaque mise à jour pour éviter les collisions
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          console.error(`❌ Erreur lors de la migration de la commande ${order.id}:`, error);
          errors.push({ orderId: order.id, error });
        }
      }

      console.log(`\n📊 Résumé de la migration:`);
      console.log(`✅ Commandes migrées: ${migratedCount}`);
      console.log(`❌ Erreurs: ${errors.length}`);

      return {
        success: errors.length === 0,
        migratedCount,
        errors
      };

    } catch (error) {
      console.error('❌ Erreur générale lors de la migration:', error);
      return { success: false, migratedCount: 0, errors: [error] };
    }
  }

  /**
   * Vérifie le statut de migration des commandes
   */
  static async checkMigrationStatus(): Promise<{
    total: number;
    migrated: number;
    pending: number;
  }> {
    try {
      // Compter toutes les commandes
      const { count: totalCount } = await this.supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // Compter les commandes sans order_number
      const { count: pendingCount } = await this.supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .is('order_number', null);

      const total = totalCount || 0;
      const pending = pendingCount || 0;
      const migrated = total - pending;

      console.log(`📊 Statut de migration:`);
      console.log(`Total commandes: ${total}`);
      console.log(`Migrées: ${migrated}`);
      console.log(`En attente: ${pending}`);

      return { total, migrated, pending };

    } catch (error) {
      console.error('❌ Erreur lors de la vérification du statut:', error);
      return { total: 0, migrated: 0, pending: 0 };
    }
  }
}