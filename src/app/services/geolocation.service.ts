import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
}

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {

  constructor() { }

  getCurrentPosition(): Observable<LocationCoords> {
    return new Observable(observer => {
      if (!navigator.geolocation) {
        observer.error('La géolocalisation n\'est pas supportée par ce navigateur.');
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: LocationCoords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          observer.next(coords);
          observer.complete();
        },
        (error) => {
          let errorMessage = 'Une erreur inconnue s\'est produite.';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Accès à la localisation refusé. Veuillez autoriser l\'accès.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Information de localisation non disponible.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Timeout de la demande de localisation.';
              break;
          }
          
          observer.error(errorMessage);
        },
        options
      );
    });
  }

  watchPosition(): Observable<LocationCoords> {
    return new Observable(observer => {
      if (!navigator.geolocation) {
        observer.error('La géolocalisation n\'est pas supportée par ce navigateur.');
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 5000
      };

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const coords: LocationCoords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          observer.next(coords);
        },
        (error) => {
          let errorMessage = 'Erreur de surveillance de position.';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permission de localisation refusée.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Position non disponible.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Timeout de surveillance de position.';
              break;
          }
          
          observer.error(errorMessage);
        },
        options
      );

      // Cleanup function
      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    });
  }

  formatCoordinates(coords: LocationCoords): string {
    return `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
  }

  getGoogleMapsUrl(coords: LocationCoords): string {
    return `https://maps.google.com/?q=${coords.latitude},${coords.longitude}`;
  }

  calculateDistance(coord1: LocationCoords, coord2: LocationCoords): number {
    const R = 6371e3; // Rayon de la Terre en mètres
    const φ1 = coord1.latitude * Math.PI / 180;
    const φ2 = coord2.latitude * Math.PI / 180;
    const Δφ = (coord2.latitude - coord1.latitude) * Math.PI / 180;
    const Δλ = (coord2.longitude - coord1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance en mètres
  }
}
