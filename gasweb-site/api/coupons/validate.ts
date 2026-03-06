// Coupon Validation — validates coupon codes against the database
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Missing coupon code' });

    const supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('is_active', true)
      .single();

    if (error || !coupon) {
      return res.status(404).json({ valid: false, message: 'Invalid or expired coupon code' });
    }

    // Check expiration
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return res.status(400).json({ valid: false, message: 'This coupon has expired' });
    }

    // Check usage limit
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      return res.status(400).json({ valid: false, message: 'This coupon has reached its usage limit' });
    }

    // Increment usage count
    await supabase.from('coupons')
      .update({ current_uses: (coupon.current_uses || 0) + 1 })
      .eq('id', coupon.id);

    return res.status(200).json({
      valid: true,
      discountType: coupon.discount_type, // 'percentage' or 'fixed'
      discountValue: coupon.discount_value,
      message: coupon.description || `${coupon.discount_value}${coupon.discount_type === 'percentage' ? '%' : '$'} off applied`,
    });
  } catch (error: any) {
    console.error('Coupon validation error:', error);
    return res.status(500).json({ error: error.message || 'Failed to validate coupon' });
  }
}
