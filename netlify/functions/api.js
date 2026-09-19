import serverless from 'serverless-http';
import { app, initializeDatastore } from '../../server.js';

let isDatastoreInitialized = false;

// Wrap Express app with serverless-http
// Netlify redirects /api/* to /.netlify/functions/api/:splat
const serverlessHandler = serverless(app);

export const handler = async (event, context) => {
  // Ensure datastore baseline (admin accounts, payment settings, Supabase verify) is initialized once per container
  if (!isDatastoreInitialized) {
    try {
      await initializeDatastore();
      isDatastoreInitialized = true;
    } catch (err) {
      console.error('[Netlify Function api.js] Datastore initialization notice:', err);
    }
  }

  return serverlessHandler(event, context);
};

export default handler;
