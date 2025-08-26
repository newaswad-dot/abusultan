export default async function handler(req, res) {
  const GAS_URL = "https://script.google.com/macros/s/AKfycbwKiJRjHPWTeB7YeQWTecxMvY2PNkRgEL0szOZXIBJTb41-lc2yMckmm0ceq1BCkUcPtg/exec";

  try {
    const url = new URL(GAS_URL);
    const incoming = new URL(req.url, http://${req.headers.host});
    url.search = incoming.search;

    const headers = { ...req.headers };
    delete headers.host;

    const init = {
      method: req.method,
      headers,
      redirect: "follow"
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      init.body = Buffer.concat(chunks);
    }

    const upstream = await fetch(url.toString(), init);

    const outHeaders = {};
    upstream.headers.forEach((v, k) => {
      const key = k.toLowerCase();
      if (
        key === "x-frame-options" ||
        key === "content-security-policy" ||
        key === "content-security-policy-report-only"
      ) return;
      outHeaders[k] = v;
    });

    outHeaders["Cache-Control"] = "no-store";
    outHeaders["Access-Control-Allow-Origin"] = "*";

    const arrayBuffer = await upstream.arrayBuffer();
    res.writeHead(upstream.status, outHeaders);
    res.end(Buffer.from(arrayBuffer));
  } catch (err) {
    res.status(502).send("Upstream error: " + (err?.message || String(err)));
  }
}
