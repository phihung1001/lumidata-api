const SOURCE_API = "https://lumidataapi.vercel.app/orders";

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Fetch data from source API
    const response = await fetch(SOURCE_API);
    if (!response.ok) {
      throw new Error(`Source API error: ${response.status}`);
    }
    const json = await response.json();
    const data = Array.isArray(json) ? json : (json.data ?? []);

    // Extract filter params
    const { nhanvien_maketing, country, order_date, product, shift } = req.query;

    // Filter logic
    let filtered = data;

    if (nhanvien_maketing) {
      filtered = filtered.filter((item) =>
        item.nhanvien_maketing
          ?.toLowerCase()
          .includes(nhanvien_maketing.toLowerCase())
      );
    }

    if (country) {
      filtered = filtered.filter((item) =>
        item.country?.toLowerCase().includes(country.toLowerCase())
      );
    }

    if (order_date) {
      // Support exact match (YYYY-MM-DD) or partial (YYYY-MM)
      filtered = filtered.filter((item) =>
        item.order_date?.startsWith(order_date)
      );
    }

    if (product) {
      filtered = filtered.filter((item) =>
        item.product?.toLowerCase().includes(product.toLowerCase())
      );
    }

    if (shift) {
      if (shift === "Hết ca") {
        filtered = filtered.filter((item) => {
          const value = item.shift?.toLowerCase() || "";
          return (
            value.includes("hết ca") ||
            value.includes("giữa ca")
          );
        });
      }

      if (shift === "Giữa ca") {
        filtered = filtered.filter((item) => {
          const value = item.shift?.toLowerCase() || "";
          return value === "giữa ca";
        });
      }
    }

    return res.status(200).json({
      total: filtered.length,
      filters: { nhanvien_maketing, country, order_date, product, shift },
      data: filtered,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
