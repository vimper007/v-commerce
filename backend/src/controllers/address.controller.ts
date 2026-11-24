import { Request, Response } from 'express';
import { pool } from '../db/db';

export async function getUserAddresses(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT id, address_line1, address_line2, city, state, postal_code, country, is_default, created_at
       FROM addresses
       WHERE user_id = $1
       ORDER BY is_default DESC, created_at DESC;`,
      [userId]
    );

    res.json({
      success: true,
      addresses: result.rows.map(row => ({
        id: row.id,
        addressLine1: row.address_line1,
        addressLine2: row.address_line2,
        city: row.city,
        state: row.state,
        postalCode: row.postal_code,
        country: row.country,
        isDefault: row.is_default,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    console.error('[Addresses] Error fetching user addresses:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve addresses' });
  }
}

export async function createAddress(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const { addressLine1, addressLine2, city, state, postalCode, country, isDefault } = req.body;

  if (!addressLine1 || !city || !postalCode || !country) {
    res.status(400).json({
      success: false,
      error: 'Missing required address fields (addressLine1, city, postalCode, country are required)',
    });
    return;
  }

  try {
    if (isDefault) {
      await pool.query(
        `UPDATE addresses SET is_default = false WHERE user_id = $1;`,
        [userId]
      );
    }

    const insertRes = await pool.query(
      `INSERT INTO addresses (user_id, address_line1, address_line2, city, state, postal_code, country, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, address_line1, address_line2, city, state, postal_code, country, is_default, created_at;`,
      [
        userId,
        addressLine1.trim(),
        addressLine2 ? addressLine2.trim() : null,
        city.trim(),
        state ? state.trim() : null,
        postalCode.trim(),
        country.trim().toUpperCase(),
        Boolean(isDefault),
      ]
    );

    const row = insertRes.rows[0];
    res.status(201).json({
      success: true,
      address: {
        id: row.id,
        addressLine1: row.address_line1,
        addressLine2: row.address_line2,
        city: row.city,
        state: row.state,
        postalCode: row.postal_code,
        country: row.country,
        isDefault: row.is_default,
        createdAt: row.created_at,
      },
    });
  } catch (error) {
    console.error('[Addresses] Error creating address:', error);
    res.status(500).json({ success: false, error: 'Failed to create address' });
  }
}
