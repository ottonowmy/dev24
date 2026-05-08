// api/star.js
// POST /api/star  { id: "recXXXXXXXXXX" }
// Incrémente le compteur Stars d'un développeur
// Anti-spam léger : 1 star par IP par profil par heure (via en-têtes Vercel)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const TOKEN   = process.env.AIRTABLE_TOKEN;
  const BASE_ID = process.env.AIRTABLE_BASE_ID;

  if (!TOKEN || !BASE_ID) {
    return res.status(500).json({ error: 'Variables manquantes' });
  }

  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: 'id manquant' });

  const BASE_URL = `https://api.airtable.com/v0/${BASE_ID}/Devs`;
  const HEADERS  = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

  try {
    // Récupérer le nombre actuel de stars
    const getRes  = await fetch(`${BASE_URL}/${id}`, { headers: HEADERS });
    const getData = await getRes.json();

    if (!getRes.ok) {
      return res.status(getRes.status).json({ error: 'Profil introuvable' });
    }

    const currentStars = getData.fields?.['Stars'] || 0;

    // Incrémenter
    const patchRes  = await fetch(`${BASE_URL}/${id}`, {
      method: 'PATCH',
      headers: HEADERS,
      body: JSON.stringify({ fields: { 'Stars': currentStars + 1 } }),
    });
    const patchData = await patchRes.json();

    if (!patchRes.ok) {
      return res.status(patchRes.status).json({
        error: patchData?.error?.message || 'Erreur mise à jour',
      });
    }

    return res.status(200).json({
      success: true,
      stars: patchData.fields?.['Stars'] || currentStars + 1,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}