/**
 * Vercel Web Analytics Initialization
 * This script imports and initializes the @vercel/analytics package
 */

import { inject } from '../vendor/analytics.mjs';

// Initialize Vercel Web Analytics
inject({
  mode: 'auto', // Automatically detect production/development
  debug: false  // Set to true for debug logging in development
});
