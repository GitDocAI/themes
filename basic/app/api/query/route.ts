import data from '../../../static/static_data.json';
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




