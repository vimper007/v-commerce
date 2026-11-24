/**
 * Centralized API base URL configuration.
 * Resolves NEXT_PUBLIC_API_URL in production (e.g., https://api.vcommerce.yourdomain.com)
 * and defaults to http://localhost:5000 in local development.
 */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");
