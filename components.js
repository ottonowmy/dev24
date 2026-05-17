// api/components.js
// GET  /api/components?clerkUserId=xxx  → liste les composants du dev
// POST /api/components                  → créer
// PATCH /api/components/:id             → modifier
// DELETE /api/components/:id            → supprimer

const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TOKEN   = process.env.AIRTABLE_TOKEN;
const TABLE   = process.env.AIRTABLE_COMPONENTS_TABLE || 'Components';
const URL     = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`;

const headers = () => ({
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — liste
  if (req.method === 'GET') {
    const { clerkUserId } = req.query;
    const filter = clerkUserId ? `{ClerkUserId}="${clerkUserId}"` : '';
    const params = new URLSearchParams({
      sort: JSON.stringify([{ field: 'Date', direction: 'desc' }]),
      ...(filter ? { filterByFormula: filter } : {}),
    });
    try {
      const r = await fetch(`${URL}?${params}`, { headers: headers() });
      const d = await r.json();
      return res.status(200).json(d.records || []);
    } catch(e) {
      return res.status(500).json({ error: String(e) });
    }
  }

  // POST — créer
  if (req.method === 'POST') {
    try {
      const r = await fetch(URL, { method:'POST', headers: headers(), body: JSON.stringify({ fields: req.body.fields }) });
      const d = await r.json();
      return res.status(r.ok ? 200 : r.status).json(d);
    } catch(e) {
      return res.status(500).json({ error: String(e) });
    }
  }

  // PATCH — modifier (id dans l'URL /api/components/recXXXX)
  if (req.method === 'PATCH') {
    const id = req.url.split('/').pop();
    try {
      const r = await fetch(`${URL}/${id}`, { method:'PATCH', headers: headers(), body: JSON.stringify({ fields: req.body.fields }) });
      const d = await r.json();
      return res.status(r.ok ? 200 : r.status).json(d);
    } catch(e) {
      return res.status(500).json({ error: String(e) });
    }
  }

  // DELETE
  if (req.method === 'DELETE') {
    const id = req.url.split('/').pop();
    try {
      const r = await fetch(`${URL}/${id}`, { method:'DELETE', headers: headers() });
      const d = await r.json();
      return res.status(r.ok ? 200 : r.status).json(d);
    } catch(e) {
      return res.status(500).json({ error: String(e) });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
}