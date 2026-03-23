const http = require("http");
const handler = require("./api/orders.js").default;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:3000`);

  if (url.pathname !== "/orders") {
    res.writeHead(404);
    return res.end("Not found");
  }

  // Gắn query params vào req
  req.query = Object.fromEntries(url.searchParams.entries());

  handler(req, res);
});

server.listen(3000, () => {
  console.log("✅ Server đang chạy tại http://localhost:3000");
});