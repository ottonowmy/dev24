// api/verify-github.js
// GET /api/verify-github?username=pseudo
// Vérifie via l'API GitHub publique que le compte existe
// Retourne { verified: true/false, avatar, followers, repos, name }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { username } = req.query;

  if (!username || username.length < 1) {
    return res.status(400).json({ verified: false, error: 'username manquant' });
  }

  // Nettoyer : extraire le pseudo depuis une URL GitHub complète
  // ex: "https://github.com/monpseudo" → "monpseudo"
  const clean = username
    .replace(/https?:\/\/(www\.)?github\.com\//i, '')
    .replace(/\/$/, '')
    .trim();

  if (!clean || clean.includes('/')) {
    return res.status(400).json({ verified: false, error: 'URL GitHub invalide' });
  }

  try {
    // L'API GitHub publique : 60 req/heure sans token, 5000 avec
    // Pour plus de volume, ajoutez GITHUB_TOKEN dans vos variables Vercel
    const headers = { 'User-Agent': 'Ottonowmy-App' };
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const response = await fetch(`https://api.github.com/users/${clean}`, { headers });

    if (response.status === 404) {
      return res.status(200).json({ verified: false });
    }
    if (!response.ok) {
      return res.status(200).json({ verified: false, error: `GitHub API: ${response.status}` });
    }

    const data = await response.json();

    return res.status(200).json({
      verified:  true,
      login:     data.login,
      name:      data.name || null,
      avatar:    data.avatar_url || null,
      followers: data.followers || 0,
      repos:     data.public_repos || 0,
      url:       data.html_url,
    });

  } catch (err) {
    console.error('GitHub verify error:', err);
    return res.status(200).json({ verified: false, error: err.message });
  }
}