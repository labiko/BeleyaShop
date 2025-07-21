import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VersionService {
  // Version de l'application
  private readonly version = '0.0.13';
  private readonly buildDate = '2025-07-21T18:16:12.884Z';

  constructor() {}

  /**
   * Retourne la version actuelle de l'application
   */
  getVersion(): string {
    return this.version;
  }

  /**
   * Retourne la date de build
   */
  getBuildDate(): string {
    return this.buildDate;
  }

  /**
   * Retourne les informations complètes de version
   */
  getVersionInfo(): { version: string; buildDate: string; formattedBuildDate: string } {
    const date = new Date(this.buildDate);
    const formattedBuildDate = date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return {
      version: this.version,
      buildDate: this.buildDate,
      formattedBuildDate
    };
  }

  /**
   * Incrémente automatiquement la version
   * Cette méthode sera appelée lors des builds automatisés
   */
  incrementVersion(type: 'major' | 'minor' | 'patch' = 'patch'): string {
    const parts = this.version.split('.');
    let major = parseInt(parts[0]);
    let minor = parseInt(parts[1]);
    let patch = parseInt(parts[2]);

    switch (type) {
      case 'major':
        major++;
        minor = 0;
        patch = 0;
        break;
      case 'minor':
        minor++;
        patch = 0;
        break;
      case 'patch':
        patch++;
        break;
    }

    return `${major}.${minor}.${patch}`;
  }
}