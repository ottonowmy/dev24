export async function handler(event) {
  try {
    const body =
      typeof event.body === "string"
        ? JSON.parse(event.body)
        : event.body;

    const response = await fetch(
      `https://api.airtable.com/v0/${process.env.BASE_ID}/Devs`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: body.fields,
        }),
      }
    );

    const data = await response.json();

    return {
      statusCode: response.status,
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}