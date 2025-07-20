/**
 * Générateur de numéros de commande personnalisés
 * Format: GN905EG32802
 * - GN: Guinée
 * - 905: Code région Conakry
 * - EG: Initiales BeleyaShop (E-commerce Guinée)
 * - 32802: Numéro séquentiel (timestamp + compteur)
 */

export class OrderNumberGenerator {
  private static readonly PREFIX = 'GN905EG';
  
  /**
   * Génère un numéro de commande unique
   * @returns string - Numéro de commande au format GN905EG32802
   */
  static generate(): string {
    // Utiliser timestamp en secondes (10 chiffres) puis prendre les 5 derniers
    const timestamp = Math.floor(Date.now() / 1000);
    const timestampStr = timestamp.toString();
    const lastFiveDigits = timestampStr.slice(-5);
    
    // Ajouter un nombre aléatoire à 2 chiffres pour éviter les collisions
    const randomSuffix = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    
    return `${this.PREFIX}${lastFiveDigits}${randomSuffix}`;
  }
  
  /**
   * Valide le format d'un numéro de commande
   * @param orderNumber - Numéro à valider
   * @returns boolean - true si le format est valide
   */
  static isValid(orderNumber: string): boolean {
    const pattern = /^GN905EG\d{7}$/;
    return pattern.test(orderNumber);
  }
  
  /**
   * Extrait les informations d'un numéro de commande
   * @param orderNumber - Numéro de commande
   * @returns object - Informations extraites
   */
  static parseOrderNumber(orderNumber: string): {
    country: string;
    region: string;
    business: string;
    sequence: string;
    isValid: boolean;
  } {
    if (!this.isValid(orderNumber)) {
      return {
        country: '',
        region: '',
        business: '',
        sequence: '',
        isValid: false
      };
    }
    
    return {
      country: orderNumber.substring(0, 2), // GN
      region: orderNumber.substring(2, 5),  // 905
      business: orderNumber.substring(5, 7), // EG
      sequence: orderNumber.substring(7),    // Numéro séquentiel
      isValid: true
    };
  }
}