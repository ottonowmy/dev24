// netlify/functions/devs.js
// Reçoit les inscriptions depuis inscription.html (POST)

export async function handler(event) {

  // Preflight CORS
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Méthode non autorisée" }),
    };
  }

  const TOKEN   = process.env.AIRTABLE_TOKEN;
  const BASE_ID = process.env.AIRTABLE_BASE_ID;

  if (!TOKEN || !BASE_ID) {
    console.error("Variables manquantes:", { TOKEN: !!TOKEN, BASE_ID: !!BASE_ID });
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Configuration serveur incomplète. Vérifiez AIRTABLE_TOKEN et AIRTABLE_BASE_ID dans Netlify." }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "JSON invalide" }),
    };
  }

  const { fields } = body;

  if (!fields?.["Nom"] || !fields?.["Email"] || !fields?.["Spécialité"]) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Champs obligatoires manquants : Nom, Email, Spécialité" }),
    };
  }

  // IMPORTANT : le nom exact de la table tel qu'il apparaît dans Airtable
  // Si votre table s'appelle "Développeurs" avec accent, on encode l'URL
  const TABLE = encodeURIComponent("Développeurs");

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${TABLE}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fields }),
      }
    );

    const data = await res.json();

    // Log pour debug dans Netlify Functions logs
    console.log("Airtable response status:", res.status);
    console.log("Airtable response:", JSON.stringify(data));

    if (!res.ok) {
      return {
        statusCode: res.status,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          error: data?.error?.message || "Erreur Airtable",
          detail: data,
        }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ id: data.id, success: true }),
    };

  } catch (err) {
    console.error("Erreur fetch Airtable:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message }),
    };
  }
}
