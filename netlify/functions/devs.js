// netlify/functions/devs.js
// Appelée par inscription.html via fetch("/.netlify/functions/devs", { method: "POST" })

export async function handler(event, context) {

  // Gestion CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
  }

  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const BASE_ID        = process.env.AIRTABLE_BASE_ID;
  const TABLE          = encodeURIComponent('Développeurs');

  if (!AIRTABLE_TOKEN || !BASE_ID) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Variables d\'environnement manquantes' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Corps JSON invalide' }) };
  }

  const { fields } = body;

  // Validation minimale côté serveur
  if (!fields || !fields['Nom'] || !fields['Email'] || !fields['Spécialité']) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Champs obligatoires manquants (Nom, Email, Spécialité)' }),
    };
  }

  try {
    const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE}`, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Airtable POST error:', data);
      return {
        statusCode: res.status,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: data }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type':                'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ id: data.id, success: true }),
    };

  } catch (err) {
    console.error('Erreur serveur:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
