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
      const shiftParam = shift.toLowerCase().trim();

      filtered = filtered.filter((item) => {
        const rawValue = item.shift?.toLowerCase() || "";
        const value = rawValue.replace(/\s*,\s*/g, ",");
        // shift = "Hết ca"
        if (shiftParam === "hết ca") {
          return (
            value === "hết ca" ||
            value === "giữa ca" ||
            value === "giữa ca,hết ca"
          );
        }

        // shift = "Giữa ca"
        if (shiftParam === "giữa ca") {
          return value === "giữa ca";
        }

        return true;
      });
    }

        // normalize string (bỏ dấu + lowercase)
    const normalize = (str) =>
      str
        ?.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    // init
    let soDon = 0;
    let soDonHoanHuy = 0;
    let doanhSo = 0;
    let tongTienHuy = 0;

    filtered.forEach((item) => {
      const status = normalize(item.check_result);
      const money = item.tongtien || 0;

      // tổng doanh số (ALL)
      doanhSo += money;

      if (status === "ok") {
        soDon++;
      }

      if (status === "huy") {
        soDonHoanHuy++;
        tongTienHuy += money;
      }
    });

    // tổng doanh số sau khi trừ đi các đơn hoàn hủy
    const dsSauHoanHuy = doanhSo - tongTienHuy;

    return res.status(200).json({
      total: filtered.length,
      soDon,
      soDonHoanHuy,
      doanhSo,
      dsSauHoanHuy,
      filters: { nhanvien_maketing, country, order_date, product, shift },
      data: filtered,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
