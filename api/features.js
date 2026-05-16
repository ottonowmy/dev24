// api/features.js — Vercel Serverless Function
// GET  /api/features?clerkUserId=xxx  → liste les fonctionnalités du dev
// POST /api/features                  → crée une fonctionnalité (token Clerk requis)

import { createClerkClient } from '@clerk/backend';

const AIRTABLE_BASE_ID  = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TOKEN    = process.env.AIRTABLE_TOKEN;
const AIRTABLE_TABLE    = process.env.AIRTABLE_FEATURES_TABLE || 'Features';
const CLERK_SECRET_KEY  = process.env.CLERK_SECRET_KEY;

const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}`;

const headers = () => ({
  'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
  'Content-Type':  'application/json',
});

// Vérifie le token Clerk et retourne le userId ou null
async function verifyClerkToken(req) {
  try {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) return null;

    const clerk = createClerkClient({ secretKey: CLERK_SECRET_KEY });
    const payload = await clerk.verifyToken(token);
    return payload?.sub || null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── GET : liste les fonctionnalités d'un dev ────────────────────────────
  if (req.method === 'GET') {
    const { clerkUserId, publique } = req.query;

    let filterFormula = '';
    if (clerkUserId && publique === 'true') {
      filterFormula = `AND({ClerkUserId}="${clerkUserId}", {Publique}=1)`;
    } else if (clerkUserId) {
      filterFormula = `{ClerkUserId}="${clerkUserId}"`;
    } else if (publique === 'true') {
      filterFormula = `{Publique}=1`;
    }

    const params = new URLSearchParams({
      sort: JSON.stringify([{ field: 'Date publication', direction: 'desc' }]),
      ...(filterFormula ? { filterByFormula: filterFormula } : {}),
    });

    try {
      const atRes = await fetch(`${airtableUrl}?${params}`, { headers: headers() });
      if (!atRes.ok) {
        const err = await atRes.json();
        return res.status(atRes.status).json({ error: err });
      }
      const data = await atRes.json();
      return res.status(200).json(data.records || []);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  }

  // ── POST : créer une fonctionnalité ──────────────────────────────────────
  if (req.method === 'POST') {
    // Vérification Clerk
    const clerkUserId = await verifyClerkToken(req);
    if (!clerkUserId) {
      return res.status(401).json({ error: 'Non authentifié. Connectez-vous via Clerk.' });
    }

    const { fields } = req.body || {};
    if (!fields || !fields['Titre'] || !fields['Description']) {
      return res.status(400).json({ error: 'Champs obligatoires manquants : Titre, Description.' });
    }

    // S'assurer que le ClerkUserId correspond bien au token
    fields['ClerkUserId'] = clerkUserId;

    try {
      const atRes = await fetch(airtableUrl, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ fields }),
      });
      const data = await atRes.json();
      if (!atRes.ok) return res.status(atRes.status).json(data);
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée.' });
}
