export async function refreshNotifications(pool) {
  // 🔴 Overdue
  await pool.query(`
    INSERT INTO notifications (ticket_id, title, message, type)
    SELECT t.id,
           CONCAT('Ticket ', t.id, ' is overdue'),
           COALESCE(NULLIF(t.remarks,''), LEFT(t.issue_text,250)),
           'OVERDUE'
    FROM tickets t
    WHERE t.end_date IS NOT NULL
      AND t.end_date < CURDATE()
      AND t.status NOT IN ('COMPLETE','REJECTED')
    ON DUPLICATE KEY UPDATE message = VALUES(message);
  `);

  // 🟡 Due Today
  await pool.query(`
    INSERT INTO notifications (ticket_id, title, message, type)
    SELECT t.id,
           CONCAT('Ticket ', t.id, ' is due today'),
           COALESCE(NULLIF(t.remarks,''), LEFT(t.issue_text,250)),
           'DUE_TODAY'
    FROM tickets t
    WHERE t.end_date = CURDATE()
      AND t.status NOT IN ('COMPLETE','REJECTED')
    ON DUPLICATE KEY UPDATE message = VALUES(message);
  `);

  // 3 days after notification delete
  await pool.query(`DELETE FROM notifications WHERE created_at < NOW() - INTERVAL 3 DAY;`);
}
