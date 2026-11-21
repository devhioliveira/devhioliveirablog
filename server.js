/* Servidor estático sem dependências. Uso: node server.js */
const http = require("http");
const fs = require("fs");
const path = require("path");

const PUB = path.join(__dirname, "public");
const CFG = path.join(__dirname, "config.json");
const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".avif": "image/avif", ".gif": "image/gif", ".ico": "image/x-icon",
  ".ttf": "font/ttf", ".otf": "font/otf", ".woff": "font/woff", ".woff2": "font/woff2"
};
const IMG = /\.(jpe?g|png|webp|avif|gif)$/i;
const SEC = { "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin" };

// Lê o config.json a cada requisição: editou, salvou, recarregou a página.
const readConfig = () => JSON.parse(fs.readFileSync(CFG, "utf8"));

let boot;
try { boot = readConfig().server || {}; }
catch (e) { console.error("config.json inválido:", e.message); process.exit(1); }
const PORT = Number(process.env.PORT) || boot.port || 3000;
const HOST = process.env.HOST || boot.host || "0.0.0.0";

const send = (res, code, body, type = "text/plain; charset=utf-8", extra = {}) => {
  res.writeHead(code, { ...SEC, "Content-Type": type, ...extra });
  res.end(body);
};

http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD")
    return send(res, 405, "Método não permitido", undefined, { Allow: "GET, HEAD" });

  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname); }
  catch { return send(res, 400, "Requisição inválida"); }

  if (pathname === "/api/config") {
    try {
      const { server, ...pub } = readConfig(); // a seção "server" não vai para o navegador
      return send(res, 200, JSON.stringify(pub), MIME[".json"], { "Cache-Control": "no-store" });
    } catch (e) {
      return send(res, 500, JSON.stringify({ error: "config.json inválido: " + e.message }), MIME[".json"], { "Cache-Control": "no-store" });
    }
  }

  if (pathname.endsWith("/")) pathname += "index.html";
  const file = path.join(PUB, pathname);
  if (!file.startsWith(PUB + path.sep) || /(^|[\\/])\./.test(pathname)) return send(res, 403, "Acesso negado");

  // Hotlink: imagem só carrega dentro do próprio site (opcional: "allowedHosts" em config.server)
  if (IMG.test(pathname)) {
    const ok = [req.headers.host, ...(boot.allowedHosts || [])], ref = req.headers.referer;
    let bad = req.headers["sec-fetch-site"] === "cross-site";
    if (!bad && ref) { try { bad = !ok.includes(new URL(ref).host); } catch { bad = true; } }
    if (bad) return send(res, 403, "Hotlink bloqueado");
  }

  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, "Não encontrado");
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      ...SEC,
      ...(IMG.test(ext) ? { "Cross-Origin-Resource-Policy": "same-origin" } : {}),
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Content-Length": st.size,
      "Cache-Control": /\.(html|css|js|json)$/.test(ext) ? "no-cache" : "public, max-age=3600"
    });
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(file).on("error", () => res.destroy()).pipe(res);
  });
}).listen(PORT, HOST, () => console.log(`Site no ar: http://localhost:${PORT}`));