import { readFile } from 'fs/promises';
import path from 'path';
import {loadTfIdfIndex} from '../../../shared/file_indexer/buildIndex'
import {search} from '../../../shared/file_indexer/query'



export async function POST(req:any) {
  try {
    const body = await req.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid query. Provide a non-empty string.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }



    const isProduction = process.env.NODE_ENV === 'production';

    const staticDataPath = isProduction
      ? path.join(process.cwd(), 'static_data.json')   // Sin 'public' en producción
      : path.join(process.cwd(), 'public', 'static_data.json');  // Con 'public' en desarrollo
    // Load the precomputed data from static file
    const data = loadTfIdfIndex(staticDataPath) as any;
    const results = search(query, data.docs, data, 3);

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing query:', error);
    return new Response(JSON.stringify({ error: 'Internal server error.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}




