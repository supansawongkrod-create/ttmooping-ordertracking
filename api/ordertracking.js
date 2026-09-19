export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false });
  }

  const phone = String(req.query.phone || '').replace(/\D/g, '');

  if (!/^0\d{8,9}$/.test(phone)) {
    return res.status(400).json({
      success: false,
      found: false,
      message: '電話號碼格式不正確',
      trackingNumbers: []
    });
  }

  try {
    const response = await fetch(
      `${process.env.KV_REST_API_URL}/get/TRACKING_${encodeURIComponent(phone)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Redis request failed');
    }

    const data = await response.json();

    let trackingNumbers = [];

    if (data.result) {
      try {
        const decoded = decodeURIComponent(data.result);
        trackingNumber = JSON.parse(decoded);
      } catch {
        trackingNumbers = [];
      }
    }

    return res.status(200).json({
      success: true,
      found: trackingNumbers.length > 0,
      trackingNumbers
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      found: false,
      message: '系統暫時無法查詢',
      trackingNumbers: []
    });
  }
}
