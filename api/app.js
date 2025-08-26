// api/app.js — CommonJS متوافق مع Vercel
module.exports = async (req, res) => {
  const GAS_URL_BASE = "https://script.google.com/macros/s/AKfycbwKiJRjHPWTeB7YeQWTecxMvY2PNkRgEL0szOZXIBJTb41-lc2yMckmm0ceq1BCkUcPtg/exec";

  try {
    // تجاهل طلبات الأيقونات إن وصلت بالخطأ إلى هذا المسار
    const path = (req.url  "").split("?")[0]  "";
    if (path === "/favicon.ico" || path === "/favicon.png") {
      res.statusCode = 204; // لا محتوى
      return res.end();
    }

    // أضِف الاستعلام كما هو بدون تعقيد URL()
    const qIndex = (req.url || "").indexOf("?");
    const query = qIndex >= 0 ? req.url.slice(qIndex) : "";
    const targetUrl = GAS_URL_BASE + query;

    // جهّز الرؤوس (بدون host)
    const headers = { ...req.headers };
    delete headers.host;

    const init = { method: req.method, headers, redirect: "follow" };

    // مرّر جسم الطلب لغير GET/HEAD
    if (req.method !== "GET" && req.method !== "HEAD") {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      init.body = Buffer.concat(chunks);
    }

    // نفّذ الطلب إلى GAS
    const upstream = await fetch(targetUrl, init);

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
