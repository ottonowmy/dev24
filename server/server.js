import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();

// ✅ middlewares
app.use(cors());
app.use(express.json());

// ✅ GET
app.get("/api/devs-count", async (req, res) => {
  try {
    const response = await fetch(
  `https://api.airtable.com/v0/${process.env.BASE_ID}/Devs?filterByFormula={Disponible}=1&fields[]=Nom`,
      {
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
        },
      }
    );

    const data = await response.json();

    res.json({
      count: data.records ? data.records.length : 0,
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ✅ POST
app.post("/api/devs", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${process.env.BASE_ID}/Devs`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: req.body.fields,
        }),
      }
    );

    const data = await response.json(); // ✅ SAFE

    console.log("AIRTABLE:", data);

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data); // ✅ renvoie id
  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ✅ START serveur à la fin
app.listen(3000, () => {
  console.log("API running on http://localhost:3000");
});