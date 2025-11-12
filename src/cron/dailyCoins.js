import cron from "node-cron";
import { pool } from "../config/db.js"; // db path sahi rakho
import dotenv from "dotenv";
dotenv.config();

cron.schedule(
  '5 0 * * *',
  async () => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [[adminRow]] = await conn.query("SELECT coins FROM admin ORDER BY id LIMIT 1");
      const adminCoins = adminRow ? Number(adminRow.coins || 0) : 0;
      if (!adminCoins) throw new Error("admin coins empty");

      const [logRows] = await conn.query("SELECT id FROM daily_coins_log WHERE run_date = CURDATE() FOR UPDATE");
      if (logRows.length > 0) throw new Error("Already run today");

      await conn.query(
        `INSERT INTO wallet (user_id, balance, coins, status, created_at, updated_at)
         SELECT u.id, 0, 0, 'active', NOW(), NOW()
         FROM users u
         LEFT JOIN wallet w ON u.id = w.user_id
         WHERE w.user_id IS NULL`
      );

      await conn.query(`UPDATE wallet SET coins = coins + ?, updated_at = NOW()`, [adminCoins]);
      await conn.query(`INSERT INTO daily_coins_log (run_date, coins_added) VALUES (CURDATE(), ?)`, [adminCoins]);

      await conn.commit();
      console.log("✅ Daily coins credited:", adminCoins);
    } catch (err) {
      await conn.rollback();
      console.error("❌ Error in daily coins job:", err.message);
    } finally {
      conn.release();
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Kolkata", // ✅ IST time pe chalega
  }
);


/**
 * Function to add daily coins
 */
export async function runDailyCoins() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Fetch coins for normal users (id = 1) and premium users (id = 2) from text_slider
    const [rows] = await conn.query(`SELECT id, message FROM text_slider WHERE id IN (1,2)`);
    const normalCoins = Number(rows.find(r => r.id === 1)?.message || 0);
    const premiumCoins = Number(rows.find(r => r.id === 2)?.message || 0);

    // Check if already run today
    const [logRows] = await conn.query("SELECT id FROM daily_coins_log WHERE run_date = CURDATE() FOR UPDATE");
    if (logRows.length > 0) throw new Error("Already run today");

    // Create wallet for users who don't have it yet
    await conn.query(`
      INSERT INTO wallet (user_id, balance, coins, status, created_at, updated_at)
      SELECT u.id, 0, 0, 'active', NOW(), NOW()
      FROM users u
      LEFT JOIN wallet w ON u.id = w.user_id
      WHERE w.user_id IS NULL
    `);

    // Update normal users (oauth_sub = 0)
    await conn.query(`
      UPDATE wallet w
      JOIN users u ON w.user_id = u.id
      SET w.coins = w.coins + ?
      WHERE u.oauth_sub = 0
    `, [normalCoins]);

    // Update premium users (oauth_sub = 1)
    await conn.query(`
      UPDATE wallet w
      JOIN users u ON w.user_id = u.id
      SET w.coins = w.coins + ?
      WHERE u.oauth_sub = 1
    `, [premiumCoins]);

    // Log daily coins run
    await conn.query(`
      INSERT INTO daily_coins_log (run_date, coins_added) 
      VALUES (CURDATE(), ?)
    `, [normalCoins + premiumCoins]);

    await conn.commit();
    console.log(`✅ Daily coins credited: Normal(${normalCoins}) | Premium(${premiumCoins})`);
  } catch (err) {
    await conn.rollback();
    console.error("❌ Error in daily coins job:", err.message);
    throw err;
  } finally {
    conn.release();
  }
}

// Cron job – automatic daily run at 12:05 AM IST
cron.schedule(
  "5 0 * * *",
  () => {
    runDailyCoins().catch(err => console.error(err));
  },
  {
    scheduled: true,
    timezone: "Asia/Kolkata",
  }
);

console.log("🕒 Cron job scheduled for daily coins (12:05 AM IST)");

/**
 * Manual trigger via function (can be used in API)
 */
export async function manualDailyCoins(req, res) {
  try {
    await runDailyCoins();
    res.json({ success: true, msg: "Daily coins run executed successfully" });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
}
