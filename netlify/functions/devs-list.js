// netlify/functions/devs-list.js
// Appelée par devs.html pour charger la liste des développeurs

export async function handler(event) {

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "",
    };
  }

  const TOKEN   = process.env.AIRTABLE_TOKEN;
  const BASE_ID = process.env.AIRTABLE_BASE_ID;

  if (!TOKEN || !BASE_ID) {
    console.error("Variables manquantes:", { TOKEN: !!TOKEN, BASE_ID: !!BASE_ID });
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Configuration serveur incomplète" }),
    };
  }

  const TABLE = encodeURIComponent("Développeurs");

  try {
    let allRecords = [];
    let offset = null;

    do {
      const url =
        `https://api.airtable.com/v0/${BASE_ID}/${TABLE}` +
        `?sort[0][field]=Date%20inscription&sort[0][direction]=desc` +
        (offset ? `&offset=${offset}` : "");

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${TOKEN}` },
      });

      const data = await res.json();

      console.log("Airtable list status:", res.status, "records:", data.records?.length);

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

      if (data.records) allRecords = allRecords.concat(data.records);
      offset = data.offset || null;

    } while (offset);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(allRecords),
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
