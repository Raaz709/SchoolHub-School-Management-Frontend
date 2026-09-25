const rawBase = import.meta.env.VITE_API_BASE_URL;

/**
 * Origin of the SchoolHub API.
 * Controller routes already include the "api/" prefix, so this must NOT end in /api.
 */
export const API_BASE_URL = (rawBase ?? "http://localhost:5000").replace(/\/+$/, "");