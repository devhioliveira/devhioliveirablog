// Substitui a rota /api/config do server.js na Vercel.
// O require embute o config.json na função; a seção "server" não vai para o navegador.
const { server, ...pub } = require("../config.json");

module.exports = (req, res) => {
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.status(200).json(pub);
};