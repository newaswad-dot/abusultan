module.exports = async (req, res) => {
  const GAS_URL = "https://script.google.com/macros/s/AKfycbwKiJRjHPWTeB7YeQWTecxMvY2PNkRgEL0szOZXIBJTb41-lc2yMckmm0ceq1BCkUcPtg/exec";

  try {
    const incomingUrl = req.url ? req.url : "/";
    const queryPart = incomingUrl.includes("?") ? incomingUrl.substring(incomingUrl.indexOf("?")) : "";
    const targetUrl = GAS_URL + queryPart;

    const headers = { ...req.headers };
    delete headers.host;

    const init = { method: req.method, headers, redirect: "follow" };

    if (req.method !== "GET" && req.method !== "HEAD") {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      init.body = Buffer.concat(chunks);
    }

    const upstream = await fetch(targetUrl, init);

    // انسخ الرؤوس
    const outHeaders = {};
    upstream.headers.forEach((v, k) => {
      const key = String(k).toLowerCase();
      if (
        key === "x-frame-options" ||
        key === "content-security-policy" ||
        key === "content-security-policy-report-only"
      ) return;
      outHeaders[k] = v;
    });

    // ✅ إجبار نوع المحتوى HTML
    outHeaders["Content-Type"] = "text/html; charset=utf-8";

    outHeaders["Cache-Control"] = "no-store";
    outHeaders["Access-Control-Allow-Origin"] = "*";

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.writeHead(upstream.status, outHeaders);
    res.end(buf);
  } catch (err) {
    res.statusCode = 502;
    res.end("Proxy error: " + (err?.message || String(err)));
  }
};
