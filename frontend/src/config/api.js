/**
 * SellSense Centralized API Configuration & URL Normalizer
 * 
 * Supports VITE_API_URL environment variable (e.g. set in Vercel or .env)
 * Fallback in production defaults to Render backend: https://sellsense-backend.onrender.com
 * Fallback in local development defaults to '' (relative URLs for Vite proxy)
 */

const DEFAULT_RENDER_URL = 'https://sellsense-backend.onrender.com';

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL !== undefined
    ? import.meta.env.VITE_API_URL
    : (import.meta.env.PROD ? DEFAULT_RENDER_URL : '')
).replace(/\/+$/, '');

/**
 * Returns full backend endpoint URL given an API path or full URL.
 * Examples:
 *   getApiUrl('/api/products') => 'https://sellsense-backend.onrender.com/api/products'
 *   getApiUrl('api/products')  => 'https://sellsense-backend.onrender.com/api/products'
 *   getApiUrl('https://...')   => 'https://...'
 */
export function getApiUrl(path) {
  if (!path) return API_BASE_URL;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}
