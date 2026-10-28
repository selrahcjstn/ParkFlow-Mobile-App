function requireHttpsApi(value) {
  try {
    const url = new URL(value || "");
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname.replace(/\/+$/, "") !== "/api" || /[\\\x00-\x1f\x7f?#]/.test(value || "") || !/^https:\/\//i.test(value || "")) throw new Error();
    return url.toString().replace(/\/+$/, "");
  } catch {
    throw new Error("Release blocked: configure EXPO_PUBLIC_API_URL as an HTTPS API endpoint ending in /api without credentials, query or fragment.");
  }
}
module.exports = { requireHttpsApi };
if (require.main === module) requireHttpsApi(process.env.EXPO_PUBLIC_API_URL);
