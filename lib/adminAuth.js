// lib/adminAuth.js
// Server-side admin token check — call this at the top of every admin API route

export function requireAdmin(req) {
  const token = req.headers['x-admin-token'];
  return token === process.env.ADMIN_PASSWORD;
}
