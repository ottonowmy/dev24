// api/devs-list.js
// Retourne tous les devs, triés par Stars puis par date d'inscription

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const TOKEN   = process.env.AIRTABLE_TOKEN;
  const BASE_ID = process.env.AIRTABLE_BASE_ID;

  if (!TOKEN || !BASE_ID) {
    return res.status(500).json({ error: 'Variables manquantes' });
  }

  try {
    let allRecords = [];
    let offset     = null;

    do {
      // Trier par Stars décroissant, puis Date inscription décroissant
      const url =
        `https://api.airtable.com/v0/${BASE_ID}/Devs` +
        `?sort[0][field]=Stars&sort[0][direction]=desc` +
        `&sort[1][field]=Date%20inscription&sort[1][direction]=desc` +
        (offset ? `&offset=${offset}` : '');

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${TOKEN}` },
      });

      const data = await response.json();
      console.log('Airtable GET →', response.status, 'records:', data.records?.length);

      if (!response.ok) {
        return res.status(response.status).json({
          error: data?.error?.message || 'Erreur Airtable',
          detail: data,
        });
      }

      if (data.records) allRecords = allRecords.concat(data.records);
      offset = data.offset || null;

    } while (offset);

    return res.status(200).json(allRecords);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}