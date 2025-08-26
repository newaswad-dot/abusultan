// api/app.js — CommonJS (متوافق مع Vercel بدون package.json)
module.exports = async (req, res) => {
  const GAS_URL = "https://script.google.com/macros/s/AKfycbwKiJRjHPWTeB7YeQWTecxMvY2PNkRgEL0szOZXIBJTb41-lc2yMckmm0ceq1BCkUcPtg/exec";

  try {
    const url = new URL(GAS_URL);
    const incoming = new URL(req.url, http://${req.headers.host});
    url.search = incoming.search; // مرر الاستعلام نفسه

    // جهّز الرؤوس (بدون host)
    const headers = { ...req.headers };
    delete headers.host;

    const init = { method: req.method, headers, redirect: "follow" };

    // مرّر جسم الطلب للطلبات غير GET/HEAD
    if (req.method !== "GET" && req.method !== "HEAD") {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      init.body = Buffer.concat(chunks);
    }

    // نفّذ الطلب إلى GAS
    const upstream = await fetch(url.toString(), init);

    // انسخ الرؤوس مع إزالة ما يمنع العرض
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

    // تحسينات
    outHeaders["Cache-Control"] = "no-store";
    outHeaders["Access-Control-Allow-Origin"] = "*";

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.writeHead(upstream.status, outHeaders);
    res.end(buf);
  } catch (err) {
    res.statusCode = 502;
    res.end("Upstream error: " + (err && err.message ? err.message : String(err)));
  }
};
