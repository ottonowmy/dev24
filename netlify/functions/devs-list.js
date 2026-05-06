// netlify/functions/devs-list.js
// Appelée par devs.html via fetch("/.netlify/functions/devs-list")

export async function handler(event, context) {
  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const BASE_ID        = process.env.AIRTABLE_BASE_ID;
  const TABLE          = encodeURIComponent('Devs');

  if (!AIRTABLE_TOKEN || !BASE_ID) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Variables d\'environnement manquantes (AIRTABLE_TOKEN, AIRTABLE_BASE_ID)' }),
    };
  }

  try {
    let allRecords = [];
    let offset     = null;

    do {
      const url = `https://api.airtable.com/v0/${BASE_ID}/${tbl5FSoQvMMqqcyQv}`
        + `?sort[0][field]=Date%20inscription&sort[0][direction]=desc`
        + (offset ? `&offset=${offset}` : '');

      const res  = await fetch(url, {
        headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
      });

      if (!res.ok) {
        const err = await res.json();
        console.error('Airtable error:', err);
        return {
          statusCode: res.status,
          body: JSON.stringify({ error: err }),
        };
      }

      const data = await res.json();
      if (data.records) allRecords = allRecords.concat(data.records);
      offset = data.offset || null;

    } while (offset);

    return {
      statusCode: 200,
      headers: {
        'Content-Type':                'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(allRecords),
    };

  } catch (err) {
    console.error('Erreur serveur:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
