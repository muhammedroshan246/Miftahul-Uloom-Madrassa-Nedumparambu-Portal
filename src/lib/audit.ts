import { getDb } from './db';
import { TokenPayload } from './auth';

export async function logAudit({
  user,
  action,
  module,
  targetId,
  previousValue,
  newValue,
  ipAddress,
}: {
  user?: TokenPayload | { id?: number; username?: string; role?: string } | null;
  action: string;
  module: string;
  targetId?: string | number;
  previousValue?: any;
  newValue?: any;
  ipAddress?: string;
}) {
  try {
    const db = getDb();
    const prevStr = previousValue ? (typeof previousValue === 'string' ? previousValue : JSON.stringify(previousValue)) : null;
    const newStr = newValue ? (typeof newValue === 'string' ? newValue : JSON.stringify(newValue)) : null;
    
    await db.execute({
      sql: `
        INSERT INTO audit_logs (user_id, username, user_role, action, module, target_id, previous_value, new_value, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        user?.id || null,
        user?.username || 'SYSTEM',
        user?.role || 'SYSTEM',
        action,
        module,
        targetId ? String(targetId) : null,
        prevStr,
        newStr,
        ipAddress || '127.0.0.1',
      ],
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}