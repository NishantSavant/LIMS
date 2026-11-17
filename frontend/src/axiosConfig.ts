import axios from 'axios';

// CRA substitutes this value at build time. In production it must be the Django
// API origin, never the Cloudflare Worker frontend origin.
const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/$/, '');

axios.defaults.baseURL = API_BASE_URL;

