// api/devs.js — POST inscription

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

  const { fields } = req.body || {};

  if (!fields?.['Nom'] || !fields?.['Email']) {
    return res.status(400).json({ error: 'Nom et Email sont obligatoires' });
  }

  // Champs autorisés — correspondent exactement à votre table Airtable
  const ALLOWED = [
    'Nom',
    'Email',
    'Accroche',
    'Touche perso',
    'Technologies',
    'Liens',
    'Photo',
    'Date inscription',
  ];

  const clean = {};
  for (const key of ALLOWED) {
    const val = fields[key];
    if (val !== undefined && val !== null && val !== '') {
      clean[key] = val;
    }
  }

  // Vues initialisées à 0 à la création
  clean['Vues']  = 0;
  clean['Stars'] = 0;

  console.log('Champs envoyés :', Object.keys(clean));

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/Devs`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields: clean }),
      }
    );

    const data = await response.json();
    console.log('Airtable →', response.status, JSON.stringify(data));

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || 'Erreur Airtable',
        detail: data,
      });
    }

    return res.status(200).json({ id: data.id, success: true });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}