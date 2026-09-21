export default async function handler(req, res) {
  // อนุญาตเฉพาะ GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false
    });
  }

  // Normalize phone
  const phone = String(req.query.phone || '')
    .replace(/\D/g, '');

  // Server-side validation
  if (!/^0\d{8,9}$/.test(phone)) {
    return res.status(400).json({
      success: false,
      found: false,
      message: '電話號碼格式不正確',
      trackingNumbers: []
    });
  }

  try {
    if (
      !process.env.SUPABASE_URL ||
      !process.env.SUPABASE_SECRET_KEY
    ) {
      throw new Error('Missing Supabase environment variables');
    }

    const url =
      `${process.env.SUPABASE_URL}/rest/v1/tracking` +
      `?phone=eq.${encodeURIComponent(phone)}` +
      `&select=tracking_number`;

    const response = await fetch(url, {
      headers: {
        apikey: process.env.SUPABASE_SECRET_KEY,
        Authorization:
          `Bearer ${process.env.SUPABASE_SECRET_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(
        `Supabase request failed: ${response.status}`
      );
    }

    const data = await response.json();

    const trackingNumbers = [
      ...new Set(
        data
          .map(row =>
            String(row.tracking_number || '')
              .replace(/\D/g, '')
          )
          .filter(Boolean)
      )
    ];

    // ไม่ cache ข้อมูลลูกค้า
    res.setHeader(
      'Cache-Control',
      'private, no-store, max-age=0'
    );

    return res.status(200).json({
      success: true,
      found: trackingNumbers.length > 0,
      trackingNumbers
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      found: false,
      message: '系統暫時無法查詢',
      trackingNumbers: []
    });
  }
}
