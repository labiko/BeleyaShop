import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Order } from '../models/order';

export interface InvoiceData {
  order: Order;
  paidAmount: number;
  paidAt: string;
  paidBy: string;
  deliveryPersonName: string;
}

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {

  constructor() { }

  async generateInvoicePDF(invoiceData: InvoiceData): Promise<Blob> {
    // Charger le logo en base64
    const logoBase64 = await this.loadLogoAsBase64();
    
    // Créer un élément HTML temporaire pour la facture
    const invoiceElement = this.createInvoiceHTML(invoiceData, logoBase64);
    document.body.appendChild(invoiceElement);

    try {
      // Convertir l'élément HTML en canvas
      const canvas = await html2canvas(invoiceElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Créer le PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Ajouter l'image au PDF
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Ajouter des pages supplémentaires si nécessaire
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Retourner le PDF comme Blob
      return pdf.output('blob');
    } finally {
      // Nettoyer l'élément temporaire
      document.body.removeChild(invoiceElement);
    }
  }

  private async loadLogoAsBase64(): Promise<string> {
    try {
      const response = await fetch('assets/logo.png');
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Erreur lors du chargement du logo:', error);
      // Retourner un logo par défaut en SVG si le PNG n'est pas disponible
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiByeD0iMTIiIGZpbGw9IiNGNUZGNzgiLz4KPHRleHQgeD0iMzAiIHk9IjM1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZvbnQtd2VpZ2h0PSI4MDAiIGZpbGw9IiMwMDAwMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkJTPC90ZXh0Pgo8L3N2Zz4K';
    }
  }

  private createInvoiceHTML(invoiceData: InvoiceData, logoBase64: string): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      width: 800px;
      font-family: 'Roboto', 'Helvetica Neue', sans-serif;
      background: white;
      padding: 40px;
      color: #000000;
    `;

    const currentDate = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const currentDateTime = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    container.innerHTML = `
      <div style="max-width: 720px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        
        <!-- Header avec logo et informations -->
        <div style="background: linear-gradient(135deg, #F5FF78 0%, #f6ff86 100%); padding: 30px; border-bottom: 3px solid #000000;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 15px;">
              <div style="width: 60px; height: 60px; border-radius: 12px; overflow: hidden; border: 2px solid #000000;">
                <img src="${logoBase64}" style="width: 100%; height: 100%; object-fit: cover;" alt="BeleyaShop Logo" />
              </div>
              <div>
                <h1 style="font-size: 28px; font-weight: 800; color: #000000; margin: 0; letter-spacing: -0.5px;">BeleyaShop</h1>
                <p style="color: #374151; font-size: 14px; margin: 0; font-weight: 500;">Cosmétiques & Beauté</p>
              </div>
            </div>
            <div style="text-align: right;">
              <h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 0;">FACTURE</h2>
              <p style="color: #374151; font-size: 14px; margin: 4px 0 0 0;">Date: ${currentDate}</p>
            </div>
          </div>
          
          <div style="background: rgba(255,255,255,0.9); border-radius: 12px; padding: 20px; border: 2px solid rgba(0,0,0,0.1);">
            <h3 style="font-size: 18px; font-weight: 700; color: #000000; margin: 0 0 12px 0;">Paiement Livreur</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Livreur</p>
                <p style="margin: 4px 0 0 0; color: #000000; font-size: 16px; font-weight: 700;">${invoiceData.deliveryPersonName}</p>
              </div>
              <div>
                <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Numéro de commande</p>
                <p style="margin: 4px 0 0 0; color: #000000; font-size: 16px; font-weight: 700;">${invoiceData.order.order_number || '#' + invoiceData.order.id}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Détails de la commande -->
        <div style="padding: 30px;">
          <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
            <h3 style="font-size: 18px; font-weight: 700; color: #000000; margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px;">
              <span style="width: 20px; height: 20px; background: #10b981; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 12px;">✓</span>
              </span>
              Détails de la livraison
            </h3>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase;">Code de validation</p>
                <p style="margin: 4px 0 0 0; color: #10b981; font-size: 18px; font-weight: 700; font-family: 'Courier New', monospace; background: white; padding: 8px 12px; border-radius: 6px; border: 2px solid #bbf7d0; display: inline-block;">${invoiceData.order.delivery_code || 'N/A'}</p>
              </div>
              <div>
                <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase;">Date de livraison</p>
                <p style="margin: 4px 0 0 0; color: #000000; font-size: 14px; font-weight: 600;">${this.formatDate(invoiceData.order.delivered_at!)}</p>
              </div>
            </div>

            ${invoiceData.order.customer_phone ? `
            <div style="margin-bottom: 16px;">
              <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase;">Téléphone client</p>
              <p style="margin: 4px 0 0 0; color: #000000; font-size: 14px; font-weight: 600;">${invoiceData.order.customer_phone}</p>
            </div>
            ` : ''}

            <div>
              <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase;">Montant total de la commande</p>
              <p style="margin: 4px 0 0 0; color: #000000; font-size: 16px; font-weight: 700;">${this.formatPrice(invoiceData.order.total_amount)} GNF</p>
            </div>
          </div>

          <!-- Détails du paiement -->
          <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border-radius: 12px; padding: 24px; border: 2px solid #10b981;">
            <h3 style="font-size: 20px; font-weight: 700; color: #000000; margin: 0 0 20px 0; display: flex; align-items: center; gap: 10px;">
              <span style="width: 24px; height: 24px; background: #10b981; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 14px;">💰</span>
              </span>
              Détails du paiement
            </h3>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
              <div>
                <p style="margin: 0; color: #065f46; font-size: 12px; font-weight: 600; text-transform: uppercase;">Date de paiement</p>
                <p style="margin: 4px 0 0 0; color: #000000; font-size: 14px; font-weight: 600;">${this.formatDate(invoiceData.paidAt)}</p>
              </div>
              <div>
                <p style="margin: 0; color: #065f46; font-size: 12px; font-weight: 600; text-transform: uppercase;">Payé par</p>
                <p style="margin: 4px 0 0 0; color: #000000; font-size: 14px; font-weight: 600;">${invoiceData.paidBy}</p>
              </div>
            </div>

            <div style="background: white; border-radius: 8px; padding: 20px; border: 1px solid #bbf7d0;">
              <p style="margin: 0; color: #065f46; font-size: 14px; font-weight: 600; text-transform: uppercase; text-align: center;">Montant payé au livreur</p>
              <p style="margin: 8px 0 0 0; color: #10b981; font-size: 32px; font-weight: 800; text-align: center; letter-spacing: -1px;">${this.formatPrice(invoiceData.paidAmount)} GNF</p>
            </div>
          </div>

          <!-- Footer -->
          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center;">
            <p style="color: #64748b; font-size: 12px; margin: 0; font-weight: 500;">
              BeleyaShop - Système de gestion des livraisons<br>
              Facture générée automatiquement le ${currentDateTime}
            </p>
          </div>
        </div>
      </div>
    `;

    return container;
  }

  private formatPrice(price: number): string {
    return price.toLocaleString('fr-FR');
  }

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  async shareInvoice(invoiceData: InvoiceData): Promise<void> {
    try {
      const pdfBlob = await this.generateInvoicePDF(invoiceData);
      const fileName = `facture_${invoiceData.order.order_number || invoiceData.order.id}_${invoiceData.deliveryPersonName.replace(/\s+/g, '_')}.pdf`;

      // Vérifier si Web Share API est supporté
      if (navigator.share && navigator.canShare) {
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Facture de paiement livreur',
            text: `Facture de paiement pour ${invoiceData.deliveryPersonName} - Commande ${invoiceData.order.order_number || '#' + invoiceData.order.id}`,
            files: [file]
          });
          return;
        }
      }

      // Fallback: téléchargement direct
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Erreur lors du partage/téléchargement de la facture:', error);
      throw error;
    }
  }
}