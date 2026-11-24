export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured on server" });
  }

  try {
    const { mimeType, base64Data } = req.body || {};
    if (!base64Data) {
      return res.status(400).json({ error: "Missing base64Data" });
    }

    const safeMimeType =
      typeof mimeType === "string" && mimeType.startsWith("image/")
        ? mimeType
        : "image/png";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'This is a German Lohnsteuerbescheinigung tax document. Extract only two rounded euro integers: "brutto" (Line 3: Bruttoarbeitslohn) and "lohnsteuer" (Line 4: Einbehaltene Lohnsteuer). Ignore IDs, Steuer-ID, Personalnummer, postcodes, and cent decimals by rounding to nearest whole euro. Return strict JSON like {"brutto": 130458, "lohnsteuer": 39706}. Use null if a field is not present.',
                },
                {
                  inline_data: {
                    mime_type: safeMimeType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0,
          },
        }),
      }
    );

    if (!response.ok) {
      return res.status(502).json({ error: `Gemini API error: ${response.status}` });
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const parsed = JSON.parse(rawText);

    const brutto =
      typeof parsed?.brutto === "number" && Number.isFinite(parsed.brutto) && parsed.brutto >= 500
        ? Math.round(parsed.brutto)
        : null;
    const lohnsteuer =
      typeof parsed?.lohnsteuer === "number" && Number.isFinite(parsed.lohnsteuer) && parsed.lohnsteuer >= 0
        ? Math.round(parsed.lohnsteuer)
        : null;

    return res.status(200).json({ brutto, lohnsteuer });
  } catch {
    return res.status(500).json({ error: "Failed to scan document" });
  }
}