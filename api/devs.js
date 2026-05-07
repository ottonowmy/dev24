// api/devs.js — Vercel Serverless Function
// Reçoit les inscriptions POST depuis inscription.html

export default async function handler(req, res) {

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const TOKEN   = process.env.AIRTABLE_TOKEN;
  const BASE_ID = process.env.AIRTABLE_BASE_ID;

  if (!TOKEN || !BASE_ID) {
    return res.status(500).json({ error: 'Variables manquantes : AIRTABLE_TOKEN et AIRTABLE_BASE_ID' });
  }

  const { fields } = req.body || {};

  if (!fields?.['Nom'] || !fields?.['Email'] || !fields?.['Spécialité']) {
    return res.status(400).json({ error: 'Champs obligatoires manquants : Nom, Email, Spécialité' });
  }

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/Devs`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields }),
      }
    );

    const data = await response.json();
    console.log('Airtable POST →', response.status, JSON.stringify(data));

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || 'Erreur Airtable',
        detail: data,
      });
    }

    return res.status(200).json({ id: data.id, success: true });

  } catch (err) {
    console.error('Erreur serveur:', err);
    return res.status(500).json({ error: err.message });
  }
}
