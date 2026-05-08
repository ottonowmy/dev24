// api/dev.js
// GET /api/dev?id=recXXXXXXXXXX
// Retourne le profil et incrémente le compteur de vues

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

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Paramètre id manquant' });

  const BASE_URL = `https://api.airtable.com/v0/${BASE_ID}/Devs`;
  const HEADERS  = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

  try {
    // 1. Récupérer le profil actuel
    const getRes  = await fetch(`${BASE_URL}/${id}`, { headers: HEADERS });
    const getData = await getRes.json();

    if (!getRes.ok) {
      return res.status(getRes.status).json({
        error: getData?.error?.message || 'Profil introuvable',
      });
    }

    const currentVues = getData.fields?.['Vues'] || 0;

    // 2. Incrémenter Vues en arrière-plan (PATCH)
    // On ne bloque pas la réponse pour ça
    fetch(`${BASE_URL}/${id}`, {
      method: 'PATCH',
      headers: HEADERS,
      body: JSON.stringify({
        fields: { 'Vues': currentVues + 1 }
      }),
    }).catch(err => console.error('Erreur incrément vues:', err));

    // 3. Retourner le profil immédiatement
    return res.status(200).json(getData);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}