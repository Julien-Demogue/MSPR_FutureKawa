import axios from 'axios';
import type { AxiosError, AxiosRequestConfig } from 'axios';

/**
 * Indique si un rafraîchissement de token est actuellement en cours.
 * Permet d'éviter les appels simultanés multiples à l'endpoint de refresh.
 */
let isRefreshing = false;

/**
 * File d'attente des requêtes ayant échoué pendant le rafraîchissement du token.
 * Ces requêtes seront rejouées une fois le nouveau token obtenu.
 */
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (error?: unknown) => void;
}> = [];

/**
 * Traite toutes les requêtes en file d'attente après une tentative de refresh
 * @param {AxiosError | null} error - L'erreur survenue lors du refresh (null si succès)
 * @returns {void}
 */
const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

/**
 * Crée une instance Axios configurée avec gestion automatique du refresh token
 * @param {string} baseURL - L'URL de base de l'API
 * @returns {AxiosInstance} Instance Axios avec intercepteurs configurés pour le refresh automatique
 */
function createApiClient(baseURL: string) {
  // Crée une instance axios
  const api = axios.create({
    baseURL,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });

  // Intercepteur de réponse pour gérer le refresh token
  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

      // Si 401 et pas déjà retry et pas sur l'endpoint de refresh (sinon ça boucle à l'infini)
      if (
        error.response?.status === 401 && 
        !originalRequest._retry &&
        !originalRequest.url?.includes('/auth/refresh')
      ) {
        console.log('⚠️ 401 detected, attempting token refresh...');
        // Si déjà en train de refresh, mettre en file d'attente
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(() => api(originalRequest))
            .catch(err => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Appel pour refresh l'access token
          await api.post('/auth/refresh');
          console.log('✅ Token refreshed successfully');
          
          // Succès : renvoyer toutes les requêtes en attente
          processQueue(null);
          
          // Renvoyer la requête originale
          return api(originalRequest);
          
        } catch (refreshError) {
          console.error('❌ Token refresh failed', refreshError);
          // Échec du refresh : déconnexion
          processQueue(refreshError as AxiosError);
          localStorage.clear();
          
          // Rediriger vers login
          window.location.href = '/login';
          
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );

  return api;
}

// Instances axios des clients API (une par microservice)
export const headOfficeApi = createApiClient(import.meta.env.VITE_HEAD_OFFICE_API_URL);