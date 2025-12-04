
import express from 'express';
import { pool } from "../config/db.js";
import requireAdmin from '../middleware/requireAdmin.js';
import axios from 'axios';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const base_url = process.env.APP_URL;
const router = express.Router();

// 🗂️ Correct folder path (2 dots if public is outside src)
const bannerFolder = path.join(__dirname, '../../public/banner');

// Ensure folder exists
if (!fs.existsSync(bannerFolder)) {
  fs.mkdirSync(bannerFolder, { recursive: true });
}

// 🖼️ Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, bannerFolder);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});
const upload = multer({ storage });

router.get('/login', (req, res) => {
  if (res.locals.admin) {
    return res.redirect('/');
  }
  res.render('login');
});
router.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/login");
});

router.get('/vediocall', (req, res) => {
  res.render('vediocall');
});
router.get('/calling', (req, res) => {
  res.render('calling');
});
router.get('/test', (req, res) => {
  res.render('test');
});
router.get('/charts', (req, res) => {
  res.render('charts');
});




// router.get('/',requireAdmin,  async (req, res) => {
//   try {
//     const [rows] = await pool.query("SELECT COUNT(*) AS total FROM users");
//     res.json(rows[0]);
//   } catch (err) {
//     console.error("DB Test Error:", err);
//     res.status(500).send("Database test error");
//   }
// });

// router.use(requireAdmin);//all routes are secure
router.get('/',requireAdmin, async (req, res) => {
  try {
 
        const countQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM users WHERE status = 'active') AS active_users,
        (SELECT COUNT(*) FROM users WHERE status = 'inactive') AS inactive_users,
        (SELECT COUNT(*) FROM userss WHERE online = '1') AS online_users,
        (SELECT IFNULL(SUM(amount), 0) FROM payments WHERE status = 'success') AS total_payment,
        (SELECT IFNULL(SUM(amount), 0) FROM payments WHERE status = 'success' AND DATE(created_at) = CURDATE()) AS today_payment,
(SELECT COUNT(*) FROM payments WHERE status = 'success' AND expire_at > NOW()) AS total_Sub,
(SELECT COUNT(*) FROM payments WHERE status = 'success' AND DATE(created_at) = CURDATE()) AS today_Sub
        `;

    // mysql2/promise returns [rows, fields]
    const [results] = await pool.query(countQuery);

    const counts = results[0];

    res.render('index', {
      totalUsers: counts.total_users,
    //   premiumUsers: counts.premium_users,
      activeUsers: counts.active_users,
      inactiveUsers: counts.inactive_users,
      onlineUsers: counts.online_users,
      totalPayment: counts.total_payment,
      todayPayment: counts.today_payment,
      totalWithdrawal: counts.total_withdrawal,
      todayWithdrawal: counts.today_withdrawal,
      totalSub: counts.total_Sub,
      todaySub: counts.today_Sub
    });
  } catch (err) {
    console.error('Error fetching counts:', err);
    res.status(200).send('Database error',err);
  }
});

router.get('/adminprofile',requireAdmin, async (req, res) => {
  try {
    const adminId = 1; // ya req.session.adminId

    const [result] = await pool.query('SELECT * FROM admin WHERE id = ?', [adminId]);

    if (result.length === 0) {
      return res.render('adminprofile', { admin: null });
    }

    res.render('adminprofile', { admin: result[0] });
  } catch (err) {
    console.error('Error fetching admin profile:', err);
    res.status(500).send('Database error');
  }
});

router.get('/deleteprofile/:id',requireAdmin,async (req, res) => {node
  try {
    const { id } = req.params;
    console.log("User ID to delete:", id);

    const [result] = await pool.query("DELETE FROM users WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "User deleted permanently" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ success: false, message: "An error occurred while deleting user" });
  }
});

router.get("/users", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const search = req.query.search ? req.query.search.trim() : "";

    let whereClause = "status != 'delete'";
    let params = [];

    if (search) {
      whereClause += " AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR mobile_no LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    // 🔹 Count total rows
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM users WHERE ${whereClause}`,
      params
    );
    const total = countRows[0].total;
    const totalPages = Math.ceil(total / limit);

    // 🔹 Fetch paginated data
    const [rows] = await pool.query(
      `SELECT id, first_name, last_name, email, mobile_no, dob, gender, status,img
       FROM users
       WHERE ${whereClause}
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.render("users", {
      users: rows,
      totalPages,
      currentPage: page,
      search,
    });
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).send("Server Error");
  }
});

router.patch("/users/:id/status",requireAdmin,  async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const [result] = await pool.query(
      "UPDATE users SET status = ? WHERE id = ?",
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "Status updated successfully" });
  } catch (err) {
    console.error("❌ Error updating user status:", err);
    res.status(500).json({ success: false, message: "Failed to update status" });
  }
});


router.get('/userregister',requireAdmin, (req,res)=>{
  res.render('userregister')
})

router.get("/viewprofile/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Fetch all user details across groups 1–4
    const [rows] = await pool.query(
      `SELECT 
        id, mobile_no, email,
        first_name, last_name, gender, dob, state, city, address, pincode, img, 
        religion, sub_religion, profession, status, token,
        caste, blood_group, residency_year, family_income, mother_name, father_name, any_disability, mangalik,
        about, hobbies, horoscopes, diet, height, skin_tone, brother_count, sister_count,
        marital_status, child, highest_education, organization, course, work_type, company_name, income
      FROM users
      WHERE id = ? LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.render("viewprofile", { user: null });
    }

    const user = rows[0];

    res.render("viewprofile", { user });
  } catch (err) {
    console.error("❌ Error fetching profile:", err);
    res.render("viewprofile", { user: null });
  }
});


// GET edit profile page
router.get("/editprofile/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT 
        id, mobile_no, email, first_name, last_name, gender, dob,
        state, city, address, pincode, img, religion, sub_religion,
        profession, status, token, caste, blood_group, residency_year,
        family_income, mother_name, father_name, any_disability,
        mangalik, about, hobbies, horoscopes, diet, height, skin_tone,
        brother_count, sister_count, marital_status, child,
        highest_education, organization, course, work_type,
        company_name, income
       FROM users WHERE id = ?`,
      [id]
    );

    res.render("editprofile", { users: rows });
  } catch (err) {
    console.error("Error loading profile:", err);
    res.render("editprofile", { users: [] });
  }
});


// POST update profile
router.post("/update-profile", requireAdmin, async (req, res) => {
  try {
    const data = req.body;
    const { id, img } = data;

    if (!id)
      return res.json({ success: false, msg: "User ID is required" });

    let imgPath = null;

    // Save profile image if sent
    if (img) {
      const imgData = img.replace(/^data:image\/\w+;base64,/, "");
      imgPath = `/images/users/user_${id}.png`;
      fs.writeFileSync(
        path.join("public", imgPath),
        Buffer.from(imgData, "base64")
      );
    }

    // Remove img from update object (handled separately)
    delete data.img;

    // Convert hobbies / horoscopes etc if array
    if (Array.isArray(data.hobbies)) data.hobbies = JSON.stringify(data.hobbies);
    if (Array.isArray(data.horoscopes)) data.horoscopes = JSON.stringify(data.horoscopes);

    // Build Dynamic Query
    let fields = [];
    let values = [];

    Object.keys(data).forEach((key) => {
      if (key !== "id") {
        fields.push(`${key} = ?`);
        values.push(data[key] || "");
      }
    });

    if (imgPath) {
      fields.push("img = ?");
      values.push(imgPath);
    }

    values.push(id);

    const updateQuery = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;

    await pool.query(updateQuery, values);

    res.json({ success: true, msg: "Profile updated successfully" });

  } catch (err) {
    console.error("Update error:", err);
    res.json({ success: false, msg: "Error updating profile" });
  }
});






router.get("/termcondition",requireAdmin,  async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM terms_conditions ORDER BY id ASC");

    // rows is the list of all terms
    // choose first term as selected by default
    const selectedTerm = rows.length > 0 ? rows[0] : {};

    res.render("termcondition", { terms: rows, selectedTerm });
  } catch (err) {
    console.error("Error fetching terms:", err);
    res.render("termcondition", { terms: [], selectedTerm: {} });
  }
});


router.get("/termcondition/:id",requireAdmin,  async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query("SELECT * FROM terms_conditions WHERE id = ?", [id]);
    if (rows.length > 0) res.json(rows[0]);
    else res.status(404).json({ msg: "Term not found" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// POST update
router.post("/termsave",requireAdmin,  async (req, res) => {
  const { title, description, status,id } = req.body;
 

  try {
    await pool.query(
      "UPDATE terms_conditions SET title = ?, description = ?, status = ?, updated_at = NOW() WHERE id = ?",
      [title, description, status,id]
    );

    res.json({ success: true, msg: `${title} updated successfully.` });
  } catch (err) {
    console.error("Error updating terms:", err);
    res.json({ success: false, msg: "Failed to update terms." });
  }
});

router.get('/sendnotificationto',requireAdmin,  async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id AS token,mobile_no As phone, first_name AS name FROM users');
    res.render('sendnotificationto', { users });
  } catch (err) {
    console.error('Error fetching users for notification:', err);
    res.status(200).send('Database error');
  }
});

router.get('/pushnotification',requireAdmin, (req, res) => {
  res.render('pushnotification');
});

// Show Notifications Route with Pagination
// router.get('/shownotification', requireAdmin, async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;   // current page (default 1)
//     const limit = 10;  // प्रति page कितनी notifications
//     const offset = (page - 1) * limit;

//     // total notifications count
//     const countQuery = `SELECT COUNT(*) AS total FROM notifications`;
//     const [countResult] = await pool.query(countQuery);
//     const totalNotifications = countResult[0].total;
//     const totalPages = Math.ceil(totalNotifications / limit);

//     // paginated query
//     const query = `
//       SELECT 
//         n.id,
//         n.user_id,
//         n.title,
//         n.message,
//         n.is_read,
//         n.created_at,
//         n.senderid,
//         n.status,
//         u.username AS user_name,
//         su.username AS sender_name
//       FROM notifications n
//       LEFT JOIN users u ON n.user_id = u.id       -- receiver
//       LEFT JOIN users su ON n.senderid = su.id    -- sender
//       ORDER BY n.id DESC
//       LIMIT ? OFFSET ?
//     `;

//     const [results] = await pool.query(query, [limit, offset]);

//     res.render('shownotification', { 
//       users: results, 
//       currentPage: page, 
//       totalPages 
//     });
//   } catch (err) {
//     console.error('❌ Error fetching notifications:', err);
//     res.status(500).send('Database error');
//   }
// });

// Show Notifications Route with Pagination + Search
router.get('/shownotification', requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const search = req.query.search ? req.query.search.trim() : "";

    let whereClause = "";
    let params = [];

    if (search) {
      whereClause = `
        WHERE n.title LIKE ? 
        OR n.message LIKE ? 
        OR u.first_name LIKE ? 
        OR su.first_name LIKE ? 
        OR DATE(n.created_at) LIKE ?
      `;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    // total notifications count with search
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      LEFT JOIN users su ON n.senderid = su.id
      ${whereClause}
    `;
    const [countResult] = await pool.query(countQuery, params);
    const totalNotifications = countResult[0].total;
    const totalPages = Math.ceil(totalNotifications / limit);

    // notifications list with search
    const query = `
      SELECT 
        n.id,
        n.user_id,
        n.title,
        n.message,
        n.is_read,
        n.created_at,
        n.senderid,
        n.status,
       n.type,
        u.first_name AS user_name,
        su.first_name AS sender_name
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      LEFT JOIN users su ON n.senderid = su.id
      ${whereClause}
      ORDER BY n.id DESC
      LIMIT ? OFFSET ?
    `;
    const [results] = await pool.query(query, [...params, limit, offset]);

    res.render('shownotification', {
      users: results,
      currentPage: page,
      totalPages,
      search
    });

  } catch (err) {
    console.error("❌ Error fetching notifications:", err);
    res.status(500).send("Database error",err);
  }
});



router.post("/sendnotificationtouser",requireAdmin,  async (req, res) => {
  const { user_ids, title, message, senderid } = req.body;

  if (!title || !message || (user_ids === undefined || user_ids === null || user_ids === '')) {
    return res.status(200).json({ success: false, message: "Required fields missing" });
  }

  console.log("userid", user_ids);
  console.log("senderid", senderid);

  try {
    let userIdArray = [];

    if (user_ids === 0) {
      // 🔹 Special case: Send only to "Admin Panel"
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, senderid, is_read, created_at) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [0, title, message, 0, 0, new Date()]
      );

      return res.json({
        success: true,
        message: "Notification sent to Admin (user_id 0)",
      });
    }

    if (user_ids === "all") {
      // 🔹 Get all active users
      const [users] = await pool.query(
        'SELECT id FROM users WHERE status = "active"'
      );
      userIdArray = users.map((u) => u.id);
    } else if (Array.isArray(user_ids)) {
      userIdArray = user_ids;
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user_ids format" });
    }

    if (userIdArray.length === 0) {
      return res.json({ success: false, message: "No users found" });
    }

    // 🔹 Insert notifications in bulk
    const values = userIdArray.map((uid) => [
      uid,
      title,
      message,
      senderid || 0, // default = Admin
      0, // is_read
      new Date(),
    ]);

    await pool.query(
      `INSERT INTO notifications (user_id, title, message, senderid, is_read, created_at) 
       VALUES ?`,
      [values]
    );

    res.json({
      success: true,
      message: `Notifications sent to ${userIdArray.length} users`,
    });
  } catch (err) {
    console.error("Error sending notifications:", err);
    res
      .status(500)
      .json({ success: false, message: "Database error", error: err.message });
  }
});

router.get('/transactions',requireAdmin,  async (req, res) => {
  try {
    const [results] = await pool.query(`
		SELECT 
		  p.*, 
		  u.first_name AS name, 
		  u.mobile_no AS phone,
		  pl.name AS plan_name
		FROM payments p
		LEFT JOIN users u ON p.user_id = u.id
		LEFT JOIN plans pl ON p.plan_id = pl.id
		ORDER BY p.created_at DESC;
    `);

    res.render('transaction', { payments: results });
  } catch (err) {
    console.error("Error fetching transactions:", err.message);
    res.render('transaction', { payments: [] });
  }
});


// PATCH update transaction status
router.patch('/transactions/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status, plan_id } = req.body;
    const { id } = req.params;

    if (!['success', 'failed'].includes(status)) {
      return res.status(200).json({ success: false, msg: 'Invalid status' });
    }

    // Fetch the payment
    const [rows] = await pool.query("SELECT * FROM payments WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(200).json({ success: false, msg: 'Payment not found' });
    }

    const payment = rows[0];

    if (payment.status !== 'pending') {
      return res.status(200).json({ success: false, msg: 'Only pending payments can be updated' });
    }

    if (status === 'success') {
      // fetch plan perks
      const [planRows] = await pool.query("SELECT perks, days FROM plans WHERE id = ?", [plan_id]);
      if (planRows.length === 0) {
        return res.status(200).json({ success: false, msg: 'Plan not found' });
      }

      const plan = planRows[0];
      let perks = {};
      try {
        perks = JSON.parse(plan.perks || "{}");
      } catch (e) {
        console.error("Invalid perks JSON:", plan.perks);
      }

      const createdAt = new Date();
      const expireAt = new Date();
      expireAt.setDate(expireAt.getDate() + (plan.days || 0));

      // Helper: store truthy as-is, undefined/null as 0, strings as-is
        const normalize = (val) => {
          if (val === true) return "true";      // boolean true → "true"
          if (val === false) return "false";    // boolean false → "false"
          
          if (typeof val === 'number') return val.toString(); // numbers → string
          if (typeof val === 'string' && val.trim() !== '') return val.trim(); // text → keep as-is
        
          return "false"; // fallback
        };


         await pool.query(
          `UPDATE payments 
           SET status = ?, created_at = ?, expire_at = ?, 
               Filter_Both = ?, Filter_Gender = ?, Filter_Region = ?, 
               No_Ads = ?, Rear_Camra = ? 
           WHERE id = ?`,
          [
            status, createdAt, expireAt,
            normalize(perks["Swipe"]),
            normalize(perks["Message"]),
            normalize(perks["Profile"]),
            normalize(perks["Audio"]),
            normalize(perks["Video"]),
            id
          ]
        );

    } else {
      await pool.query("UPDATE payments SET status = ? WHERE id = ?", [status, id]);
    }

    res.json({ success: true, msg: `Payment marked as ${status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Something went wrong' });
  }
});

router.post('/transactions/update', async (req, res) => {
  try {
    const { 
      id, 
      day, 
      Filter_Both, 
      Filter_Gender, 
      Filter_Region, 
      No_Ads, 
      Rear_Camra, 
      created_at, 
      expire_at 
    } = req.body;

    console.log("Update Request Body:", req.body);

    if (!id) {
      return res.json({ success: false, msg: "ID is required" });
    }

    // Convert datetime (IF needed)
    const createdAtFormatted = created_at ? created_at.replace("T", " ") : null;
    const expireAtFormatted  = expire_at ? expire_at.replace("T", " ") : null;

    // --- UPDATE QUERY ---
    const [result] = await pool.query(
      `UPDATE payments 
       SET 
         day=?, 
         Filter_Both=?, 
         Filter_Gender=?, 
         Filter_Region=?, 
         No_Ads=?, 
         Rear_Camra=?, 
         created_at=?, 
         expire_at=? 
       WHERE id=?`,
      [
        day,
        Filter_Both,
        Filter_Gender,
        Filter_Region,
        No_Ads,
        Rear_Camra,
        createdAtFormatted,
        expireAtFormatted,
        id
      ]
    );

    console.log("SQL Result:", result);

    if (result.affectedRows === 0) {
      return res.json({ success: false, msg: "No record found with this ID" });
    }

    return res.json({ success: true, msg: "Updated successfully" });

  } catch (err) {
    console.error("Update error:", err);
    return res.json({ success: false, msg: err.message || "Error updating" });
  }
});


// GET plans page
router.get('/plans1',requireAdmin,  async (req, res) => {
  try {
    const [plans] = await pool.query('SELECT * FROM plans');

    // Perks ko object me parse karke bhejna
    plans.forEach(p => {
      try {
        p.perksObj = JSON.parse(p.perks || '{}');
      } catch {
        p.perksObj = {};
      }
    });

    res.render('plans', { plans });
  } catch (err) {
    console.error('Error fetching plans:', err.message);
    res.status(500).send('Database error');
  }
});

// GET plans page
router.get('/plans', requireAdmin, async (req, res) => {
  try {
    const [plans] = await pool.query('SELECT * FROM plans');

    plans.forEach(p => {
      // perks ko object me parse
      try {
        p.perksObj = JSON.parse(p.perks || '{}');
      } catch {
        p.perksObj = {};
      }

      // description ko array me convert
      if (p.description) {
        p.descriptionArr = p.description
          .split(/\r?\n/)       // newline split
          .map(d => d.trim())
          .filter(d => d);      // empty remove
      } else {
        p.descriptionArr = [];
      }
    });

    res.render('plans', { plans });
  } catch (err) {
    console.error('Error fetching plans:', err.message);
    res.status(500).send('Database error');
  }
});

// Inline field update
router.post('/plans/update-field',requireAdmin,  async (req, res) => {
  const { id, field, value } = req.body;
  const allowedFields = ['name', 'billing_cycle', 'price','tax', 'days', 'perks', 'off','description'];
  if (!allowedFields.includes(field)) {
    return res.status(200).json({ success: false, message: 'Invalid field' });
  }

  try {
    await pool.query(`UPDATE plans SET ${field} = ? WHERE id = ?`, [value, id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Update error:', err.message);
    res.status(500).json({ success: false });
  }
});

// DELETE plan
router.get('/plans/delete/:id',requireAdmin,  async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM plans WHERE id = ?', [id]);
    res.redirect('/plans?deleted=1');
  } catch (err) {
    console.error('Delete error:', err.message);
    res.redirect('/plans?error=1');
  }
});

// ADD new plan
router.post('/plans/add', async (req, res) => {
  try {
    const { name, billing_cycle, days, price, tax, off, status } = req.body;

    // --- Validation ---
    if (!name || !billing_cycle || !days || !price || !tax || !off) {
      return res.status(200).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Default perks
    const defaultPerks = {
      Swipe: "10",
      Message: true,
      Pofile: true,
      Audio: true,
      Video: true
    };

    const [insert] = await pool.query(
      `INSERT INTO plans (
        name, billing_cycle, days, price, tax, off, status, perks, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,

      [
        name,
        billing_cycle,
        days,
        price,
        tax,
        off,
        status,
        JSON.stringify(defaultPerks),  // 👉 default perks inserted
        JSON.stringify()             // 👉 default empty description
      ]
    );

    if (insert.affectedRows > 0) {
      return res.status(200).json({
        success: true,
        message: "Plan created successfully",
      });
    } else {
      return res.status(200).json({
        success: false,
        message: "Insert failed",
      });
    }

  } catch (error) {
    console.log("PLAN INSERT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
});


// Toggle plan status
router.post('/plans/status-toggle',requireAdmin,  async (req, res) => {
  const { id, status } = req.body;
  if (!id || !['0','1'].includes(String(status))) {
    return res.status(200).json({ success: false, message: 'Invalid input' });
  }

  try {
    await pool.query('UPDATE plans SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating status:', err.message);
    res.status(500).json({ success: false });
  }
});

// POST API: नया स्लाइडर जोड़ने या अपडेट करने के लिए
router.post("/text-slider", async (req, res) => {
  try {
    const { id, message, status } = req.body;

    if (!message || message.trim() === "") {
      return res.status(200).json({ success: false, msg: "Message is required" });
    }

    const validStatus = status === "inactive" ? "inactive" : "active";

    if (id) {
      // Update existing record
      const updateQuery = `UPDATE text_slider SET message = ?, status = ?, updated_at = NOW() WHERE id = ?`;
      await pool.query(updateQuery, [message.trim(), validStatus, id]);
      return res.status(200).json({ success: true, msg: "Slider updated successfully" });
    } else {
      // Insert new record
      const insertQuery = `INSERT INTO text_slider (message, status) VALUES (?, ?)`;
      await pool.query(insertQuery, [message.trim(), validStatus]);
      return res.status(200).json({ success: true, msg: "Slider added successfully" });
    }
  } catch (err) {
    res.status(500).json({ success: false, msg: "Database operation failed", error: err });
  }
});

router.get("/coins", requireAdmin, async (req, res) => {
  try {
    // Fetch both sliders in parallel
    const [userResults] = await pool.query(`SELECT * FROM text_slider WHERE id = 1`);
    const [vendorResults] = await pool.query(`SELECT * FROM text_slider WHERE id = 2`);

    res.render("coins", {
      userText: userResults[0] || { id: 1, message: "", status: "active" },
      vendorText: vendorResults[0] || { id: 2, message: "", status: "active" }
    });
  } catch (err) {
    console.error("Coins Page Error:", err);
    return res.status(200).json({ success: false, msg: "Error fetching slider texts", error: err });
  }
});

// GET all matches
router.get("/matches",requireAdmin,  async (req, res) => {
  try {
    const [results] = await pool.query(`
      SELECT m.*, 
        ua.username AS user_a_name,
        ub.username AS user_b_name
      FROM matches m
      LEFT JOIN users ua ON m.user_a = ua.id
      LEFT JOIN users ub ON m.user_b = ub.id
      ORDER BY m.created_at DESC
    `);
    res.render("matches", { matches: results });
  } catch (err) {
    console.error(err);
    res.render("matches", { matches: [] });
  }
});

// PATCH status
router.patch("/matches/:id/status",requireAdmin,  async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  const validStatus = ["pending", "active", "ended"];

  if (!validStatus.includes(status)) {
    return res.status(200).json({ success: false, msg: "Invalid status" });
  }

  try {
    const [result] = await pool.query("UPDATE matches SET status = ? WHERE id = ?", [status, id]);
    if (result.affectedRows === 0) return res.status(200).json({ success: false, msg: "Match not found" });
    res.json({ success: true, msg: "Status updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

// DELETE match
router.delete("/matches/:id",requireAdmin,  async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM matches WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(200).json({ success: false, msg: "Match not found" });
    res.json({ success: true, msg: "Match deleted permanently" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

//friend  history
// GET all friends
// router.get("/friends",requireAdmin,  async (req, res) => {
//   try {
//     const [results] = await pool.query(`
//       SELECT f.*, 
//         u.username AS user_name,
//         fr.username AS friend_name
//       FROM friends f
//       LEFT JOIN users u ON f.user_id = u.id
//       LEFT JOIN users fr ON f.friend_id = fr.id
//       ORDER BY f.created_at DESC
//     `);
//     res.render("friends", { friends: results });
//   } catch (err) {
//     console.error(err);
//     res.render("friends", { friends: [] });
//   }
// });
router.get("/friends", requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 1;
    const offset = (page - 1) * limit;

    const search = req.query.search ? req.query.search.trim() : "";

    let whereClause = "";
    let params = [];

    if (search) {
      whereClause = `
        WHERE u.first_name LIKE ? 
        OR fr.first_name LIKE ? 
        OR f.type LIKE ? 
        OR f.status LIKE ?
      `;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Total count for pagination
    const [countResult] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM friends f
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN users fr ON f.friend_id = fr.id
      ${whereClause}
    `, params);
    const totalFriends = countResult[0].total;
    const totalPages = Math.ceil(totalFriends / limit);

    // Fetch friends list with limit & offset
    const [results] = await pool.query(`
      SELECT f.*, 
        u.first_name AS user_name,
        fr.first_name AS friend_name
      FROM friends f
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN users fr ON f.friend_id = fr.id
      ${whereClause}
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    res.render("friends", { 
      friends: results, 
      currentPage: page, 
      totalPages, 
      search 
    });

  } catch (err) {
    console.error(err);
    res.render("friends", { friends: [], currentPage: 1, totalPages: 1, search: '' });
  }
});


// PATCH status
router.patch("/friends/:id/status",requireAdmin,  async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  const validStatus = ["active", "inactive"];

  if (!validStatus.includes(status)) {
    return res.status(200).json({ success: false, msg: "Invalid status" });
  }

  try {
    const [result] = await pool.query("UPDATE friends SET status = ? WHERE id = ?", [status, id]);
    if (result.affectedRows === 0) return res.status(200).json({ success: false, msg: "Friend not found" });
    res.json({ success: true, msg: "Status updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

// DELETE friend
router.delete("/friends/:id",requireAdmin,  async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM friends WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(200).json({ success: false, msg: "Friend not found" });
    res.json({ success: true, msg: "Friend deleted permanently" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

// List social links
router.get('/social-links',requireAdmin,  async (req, res) => {
  try {
    const [links] = await pool.query('SELECT * FROM social_links ');
    res.render('social_links', { links });
  } catch (err) {
    console.error('Error fetching social links:', err.message);
    res.status(500).send('Database error');
  }
});

// Toggle status
router.post('/social-links/status-toggle',requireAdmin,  async (req, res) => {
  const { id, status } = req.body;
//   console.log("status:",status);
  if (!id || !['ACTIVE', 'INACTIVE'].includes(String(status))) {
    return res.json({ success: false, message: 'Invalid input' });
  }

  try {
    await pool.query('UPDATE social_links SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating status:', err.message);
    res.status(500).json({ success: false });
  }
});

// Inline field update
router.post('/social-links/update-field',requireAdmin,  async (req, res) => {
  const { id, field, value } = req.body;
  const allowedFields = ['name', 'link'];
  if (!allowedFields.includes(field)) {
    return res.json({ success: false, message: 'Invalid field' });
  }

  try {
    await pool.query(`UPDATE social_links SET ${field} = ? WHERE id = ?`, [value, id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Update error:', err.message);
    res.status(500).json({ success: false });
  }
});

// GET all regions
router.get("/regions",requireAdmin,  async (req, res) => {
  try {
    const [regions] = await pool.query("SELECT * FROM regions ORDER BY id DESC");
    res.render("regions", { regions });
  } catch (err) {
    console.error("Error fetching regions:", err.message);
    res.status(500).send("Database error");
  }
});

// Toggle region status
router.post("/regions/status-toggle",requireAdmin,  async (req, res) => {
  const { id, status } = req.body;
  if (!id || !["active", "inactive"].includes(status)) {
    return res.json({ success: false, message: "Invalid input" });
  }

  try {
    await pool.query("UPDATE regions SET status = ? WHERE id = ?", [status, id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Error updating status:", err.message);
    res.status(500).json({ success: false });
  }
});

// Inline field update
router.post("/regions/update-field",requireAdmin,  async (req, res) => {
  const { id, field, value } = req.body;
  const allowedFields = ["name", "title"];
  if (!allowedFields.includes(field)) {
    return res.json({ success: false, message: "Invalid field" });
  }

  try {
    await pool.query(`UPDATE regions SET ${field} = ? WHERE id = ?`, [value, id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Update error:", err.message);
    res.status(500).json({ success: false });
  }
});

// DELETE region
router.get("/regions/delete/:id",requireAdmin,  async (req, res) => {
  try {
    await pool.query("DELETE FROM regions WHERE id = ?", [req.params.id]);
    res.redirect("/regions?deleted=1");
  } catch (err) {
    console.error("Delete error:", err.message);
    res.redirect("/regions?error=1");
  }
});

// ADD new region
router.post("/regions/add",requireAdmin,  async (req, res) => {
  const { name, title } = req.body;
  if (!name || !title) {
    return res.json({ success: false, message: "Missing required fields" });
  }

  try {
    await pool.query(
      `INSERT INTO regions (name, title, status, created_at, updated_at)
       VALUES (?, ?, 'active', NOW(), NOW())`,
      [name, title]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Insert error:", err.message);
    res.status(500).json({ success: false });
  }
});

// GET wallet list with pagination
router.get("/wallet", requireAdmin, async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = 10;
    let offset = (page - 1) * limit;

    // Fetch total count for pagination
    const [countResult] = await pool.query("SELECT COUNT(*) AS total FROM wallet w JOIN users u ON u.id = w.user_id");
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    // Fetch wallet data
    const [results] = await pool.query(`
      SELECT w.*, u.name AS user_name, u.phone
      FROM wallet w
      JOIN users u ON u.id = w.user_id
      ORDER BY w.updated_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    res.render("wallet", { wallets: results, page, totalPages });
  } catch (err) {
    console.error("Error fetching wallet data:", err);
    res.render("wallet", { wallets: [], page: 1, totalPages: 1 });
  }
});

// PATCH toggle status
router.patch("/wallet/:id/status", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await pool.query("UPDATE wallet SET status = ? WHERE id = ?", [status, id]);
    res.json({ success: true, message: "Status updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to update status" });
  }
});

// POST add/subtract balance or coins
router.post("/wallet/:id/adjust", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount = 0, coins = 0, action } = req.body; // action: add or subtract

    // Fetch existing wallet
    const [walletRows] = await pool.query("SELECT balance, coins FROM wallet WHERE id = ?", [id]);
    if (!walletRows.length) return res.status(404).json({ success: false, message: "Wallet not found" });

    let newBalance = parseFloat(walletRows[0].balance);
    let newCoins = parseInt(walletRows[0].coins);

    if (action === "add") {
      newBalance += parseFloat(amount);
      newCoins += parseInt(coins);
    } else if (action === "subtract") {
      newBalance -= parseFloat(amount);
      newCoins -= parseInt(coins);
    }

    await pool.query("UPDATE wallet SET balance = ?, coins = ?, updated_at = NOW() WHERE id = ?", [newBalance, newCoins, id]);
    res.json({ success: true, message: "Wallet updated successfully", balance: newBalance, coins: newCoins });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// All referrals users page
router.get("/referrals", async (req, res) => {
  try {
    const search = req.query.search ? `%${req.query.search}%` : "%%";
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const offset = (page - 1) * limit;

    // Total count
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM users u
       LEFT JOIN referrals r ON u.id = r.user_id
       WHERE (u.username LIKE ? OR u.email LIKE ? OR u.phone LIKE ?) 
         AND u.status != 'delete'`,
      [search, search, search]
    );
    const totalUsers = countRows[0].total;
    const totalPages = Math.ceil(totalUsers / limit);

    // Fetch users with referral info
    const [results] = await pool.query(
      `SELECT u.id, u.username, u.name, u.phone, r.code, IFNULL(r.total_invited,0) AS total_invites, r.joined, r.rewards, r.available, r.created_at
       FROM users u
       LEFT JOIN referrals r ON u.id = r.user_id
       WHERE (u.username LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)
         AND u.status != 'delete'
       ORDER BY u.id DESC
       LIMIT ? OFFSET ?`,
      [search, search, search, limit, offset]
    );

    res.render("referrals", {
      referrals: results,
      currentPage: page,
      totalPages,
      search: req.query.search || "",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// Referral invites page for a user
router.get("/referrals/:user_id/invites", async (req, res) => {
  try {
    const user_id = req.params.user_id;

    // Get user's referral code
    const [[referral]] = await pool.query(
      `SELECT code FROM referrals WHERE user_id = ? LIMIT 1`,
      [user_id]
    );
    if (!referral) return res.status(404).send("Referral not found");

    // Fetch invited users
    const [invites] = await pool.query(
      `SELECT ri.id, ri.ref_code, ri.invited_user_id, u.username AS invited_user_name, ri.created_at
       FROM referral_invites ri
       JOIN users u ON ri.invited_user_id = u.id
       WHERE ri.ref_code = ?
       ORDER BY ri.created_at DESC`,
      [referral.code]
    );

    res.render("referralsInvites", {
      invites,
      referral_code: referral.code,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});



// Get paginated + searchable videos
router.get("/user_videos", requireAdmin, async (req, res) => {
  try {
    const search = req.query.search ? `%${req.query.search}%` : "%%";
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const offset = (page - 1) * limit;

    // Count total videos
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total 
       FROM user_videos v
       LEFT JOIN users u ON v.user_id = u.id
       WHERE (u.username LIKE ? OR u.name LIKE ? OR v.caption LIKE ?)`,
      [search, search, search]
    );
    const totalVideos = countRows[0].total;
    const totalPages = Math.ceil(totalVideos / limit);

    // Fetch data
    const [videos] = await pool.query(
      `SELECT 
        v.*, 
        u.username, 
        u.name,
        u.profile_pic
      FROM user_videos v
      LEFT JOIN users u ON v.user_id = u.id
      WHERE (u.username LIKE ? OR u.name LIKE ? OR v.caption LIKE ?)
      ORDER BY v.id DESC
      LIMIT ? OFFSET ?`,
      [search, search, search, limit, offset]
    );

    res.render("uservideos", {
      videos,
      currentPage: page,
      totalPages,
      search: req.query.search || "",
    });
  } catch (err) {
    console.error("Error fetching user videos:", err);
    res.status(500).send("Database error");
  }
});

// Toggle status (ACTIVE/INACTIVE)
router.patch("/user_videos/:id/status", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const [result] = await pool.query(
      "UPDATE user_videos SET status = ? WHERE id = ?",
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }

    res.json({ success: true, message: "Status updated successfully" });
  } catch (err) {
    console.error("Error updating video status:", err);
    res.status(500).json({ success: false, message: "Failed to update status" });
  }
});

// Delete video
router.get("/deletevideo/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM user_videos WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.json({ success: false, message: "Video not found" });
    }

    res.json({ success: true, message: "Video deleted successfully" });
  } catch (err) {
    console.error("Error deleting video:", err);
    res.status(500).json({ success: false, message: "Failed to delete video" });
  }
});



// 🖼 Get all user images
// router.get("/user_images", async (req, res) => {
//   try {
//     const search = req.query.search || '';
//     const page = parseInt(req.query.page) || 1;
//     const limit = 10; // items per page
//     const offset = (page - 1) * limit;

//     // Base query
//     let baseQuery = "FROM user_images";
//     const params = [];
//     if (search) {
//       baseQuery += " WHERE user_id LIKE ?";
//       params.push(`%${search}%`);
//     }

//     // Get total count for pagination
//     const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total ${baseQuery}`, params);
//     const totalPages = Math.ceil(total / limit);

//     // Get paginated results
//     const [images] = await pool.query(`SELECT * ${baseQuery} ORDER BY id DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);

//     res.render("user_images", {
//       title: "User Images",
//       images,
//       search,
//       currentPage: page,
//       totalPages
//     });
//   } catch (error) {
//     console.error("Error fetching images:", error);
//     res.status(500).send("Internal Server Error");
//   }
// });
// 🖼 Get all user images with user name
router.get("/user_images", async (req, res) => {
  try {
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // items per page
    const offset = (page - 1) * limit;

    // Base query with JOIN
    let baseQuery = `
      FROM user_images ui
      LEFT JOIN users u ON ui.user_id = u.id
    `;
    const params = [];
    if (search) {
      baseQuery += " WHERE ui.user_id LIKE ? OR u.name LIKE ?";
      params.push(`%${search}%`, `%${search}%`);
    }

    // Get total count for pagination
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total ${baseQuery}`, params);
    const totalPages = Math.ceil(total / limit);

    // Get paginated results
    const [images] = await pool.query(
      `SELECT ui.*, u.name ${baseQuery} ORDER BY ui.id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.render("user_images", {
      title: "User Images",
      images,
      search,
      currentPage: page,
      totalPages
    });
  } catch (error) {
    console.error("Error fetching images:", error);
    res.status(500).send("Internal Server Error");
  }
});


// 🟢 Activate or Deactivate Image
router.post("/user_images/status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await pool.query("UPDATE user_images SET status = ? WHERE id = ?", [status, id]);
    res.json({ success: true, message: "Status updated successfully!" });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// ❌ Delete Image
router.post("/user_images/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM user_images WHERE id = ?", [id]);
    res.json({ success: true, message: "Image deleted successfully!" });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});



// GET all games
router.get("/games", requireAdmin, async (req, res) => {
  try {
    const [games] = await pool.query("SELECT * FROM games ORDER BY id DESC");
    res.render("games", { games });
  } catch (err) {
    console.error("Error fetching games:", err.message);
    res.status(500).send("Database error");
  }
});

// Toggle game status
router.post("/games/status-toggle", requireAdmin, async (req, res) => {
  const { id, status } = req.body;
  if (!id || !["active", "inactive"].includes(status)) {
    return res.json({ success: false, message: "Invalid input" });
  }

  try {
    await pool.query("UPDATE games SET status = ? WHERE id = ?", [status, id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Error updating status:", err.message);
    res.status(500).json({ success: false });
  }
});

// Inline field update (title, entry_fee, reward)
router.post("/games/update-field", requireAdmin, async (req, res) => {
  const { id, field, value } = req.body;
  const allowedFields = ["title", "entry_fee", "reward"];
  if (!allowedFields.includes(field)) {
    return res.json({ success: false, message: "Invalid field" });
  }

  try {
    await pool.query(`UPDATE games SET ${field} = ? WHERE id = ?`, [value, id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Update error:", err.message);
    res.status(500).json({ success: false });
  }
});

// DELETE game
router.get("/games/delete/:id", requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM games WHERE id = ?", [req.params.id]);
    res.redirect("/games?deleted=1");
  } catch (err) {
    console.error("Delete error:", err.message);
    res.redirect("/games?error=1");
  }
});

// ADD new game
router.post("/games/add", requireAdmin, async (req, res) => {
  const { title, entry_fee, reward } = req.body;
  if (!title || !entry_fee || !reward) {
    return res.json({ success: false, message: "Missing required fields" });
  }

  try {
    await pool.query(
      `INSERT INTO games (title, entry_fee, reward, status, created_at)
       VALUES (?, ?, ?, 'active', NOW())`,
      [title, entry_fee, reward]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Insert error:", err.message);
    res.status(500).json({ success: false });
  }
});



// 🧾 Get all game history
router.get("/gamehistory", async (req, res) => {
  try {
    const search = req.query.search ? `%${req.query.search}%` : "%%";
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    // --- Get total count
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total 
       FROM game_history gh
       LEFT JOIN users u ON gh.user_id = u.id
       LEFT JOIN games g ON gh.game_id = g.id
       WHERE u.name LIKE ? OR g.title LIKE ?`,
      [search, search]
    );

    const totalPages = Math.ceil(total / limit);

    // --- Fetch paginated data with joins
    const [gameHistory] = await pool.query(
      `SELECT 
          gh.*, 
          u.name AS username, 
          g.title AS game_title
       FROM game_history gh
       LEFT JOIN users u ON gh.user_id = u.id
       LEFT JOIN games g ON gh.game_id = g.id
       WHERE u.name LIKE ? OR g.title LIKE ?
       ORDER BY gh.id DESC
       LIMIT ? OFFSET ?`,
      [search, search, limit, offset]
    );

    // --- Render page
    res.render("gamehistory", {
      title: "Game History",
      gameHistory,
      search: req.query.search || "",
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching game history:", error);
    res.status(500).send("Internal Server Error");
  }
});


// ❌ Delete game record
router.post("/game_history/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM game_history WHERE id = ?", [id]);
    res.json({ success: true, message: "Game record deleted successfully!" });
  } catch (error) {
    console.error("Error deleting game history:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});
//--------------------------------------------------------------------------------------------------------

// 🧩 Add or Edit Banner
router.post('/add-banner', requireAdmin, upload.single('bannerImage'), async (req, res) => {
  const { id, actionLink } = req.body;
  const img_url = req.file ? '/banner/' + req.file.filename : null;

  try {
    if (id) {
      // Edit mode
      const query = `
        UPDATE banner SET ${img_url ? 'img_url = ?, ' : ''} action_link = ? WHERE id = ?
      `;
      const values = img_url ? [img_url, actionLink, id] : [actionLink, id];

      await pool.query(query, values);
      res.redirect('/banner-ui');
    } else {
      // Add mode
      if (!img_url) return res.status(400).send('Image is required!');
      await pool.query(
        'INSERT INTO banner (img_url, action_link, status) VALUES (?, ?, ?)',
        [img_url, actionLink, 'inactive']
      );
      res.redirect('/banner-ui');
    }
  } catch (err) {
    console.error('DB Error:', err);
    res.status(500).send('DB Error');
  }
});

// 🧾 Get banner list for admin UI
router.get('/banner-ui', requireAdmin, async (req, res) => {
  try {
    const response = await axios.get(`https://root.satphere.com/banner1`);
    const banners = response.data.success ? response.data.data : [];
    res.render('banner', { banners });
  } catch (error) {
    console.error('Error fetching banners:', error.message);
    res.render('banner', { banners: [] });
  }
});

// 🔄 Toggle Banner Status
router.post('/toggle-banner-status', requireAdmin, async (req, res) => {
  const { id, status } = req.body;
  if (!id || !status) return res.status(200).send('Missing parameters');

  try {
    const query = 'UPDATE banner SET status = ? WHERE id = ?';
    await pool.query(query, [status, id]);
    res.redirect('/banner-ui');
  } catch (err) {
    console.error('Error updating banner status:', err.message);
    res.status(500).send('DB Error');
  }
});

// 🟢 Public: Get All Banners (Unsecured)
router.get('/banner1', async (req, res) => {
  try {
    const [results] = await pool.query('SELECT * FROM banner');
    if (results.length === 0)
      return res.status(200).json({ success: false, msg: 'No data found', data: [] });

    const updatedResults = results.map(row => ({
      ...row,
      img_url: `${base_url}${row.img_url}`  // ✅ BASE_URL prepend
    }));

    res.status(200).json({ success: true, msg: 'Data get successfully', data: updatedResults });
  } catch (err) {
    res.status(200).json({ success: false, msg: 'DB Error', error: err.message });
  }
});

// ❌ Delete Banner
router.post('/delete-banner', requireAdmin, async (req, res) => {
  const { id } = req.body;
  if (!id) return res.json({ success: false, message: 'Banner ID missing' });

  try {
    await pool.query('DELETE FROM banner WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    res.json({ success: false, message: 'DB error' });
  }
});
//--------------------------------------------Religion List---------------------------------------------------
// =============================
// Religion Routes
// =============================

// Religion List Page
router.get("/religionshow", requireAdmin, async (req, res) => {
  try {
    const [religions] = await pool.query("SELECT * FROM religion ORDER BY id DESC");
    res.render("religions", { religions });
  } catch (err) {
    console.error("Error fetching religions:", err.message);
    res.status(500).send("Database error");
  }
});

// Add Religion
router.post("/religions/add", requireAdmin, async (req, res) => {
  const { religion_name } = req.body;
  if (!religion_name) {
    return res.json({ success: false, message: "Religion name is required" });
  }

  try {
    await pool.query("INSERT INTO religion (religion_name) VALUES (?)", [religion_name]);
    res.json({ success: true });
  } catch (err) {
    console.error("Insert Religion error:", err.message);
    res.json({ success: false, message: "DB error" });
  }
});

// Update Religion
router.post("/religions/update-field", requireAdmin, async (req, res) => {
  const { id, value } = req.body;

  try {
    await pool.query("UPDATE religion SET religion_name = ? WHERE id = ?", [value, id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Update Religion error:", err.message);
    res.json({ success: false, message: "DB error" });
  }
});
//status update
router.post("/religions/status-toggle", requireAdmin, async (req, res) => {
  const { id, status } = req.body;

  try {
    await pool.query("UPDATE religion SET status = ? WHERE id = ?", [status, id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Status update error:", err);
    res.json({ success: false });
  }
});

// Delete Religion
router.get("/religions/delete/:id", requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM religion WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Religion deleted successfully" });
  } catch (err) {
    console.error("Delete Religion error:", err.message);
    res.json({ success: false, message: "Database error" });
  }
});



// =============================
// Sub Religion Routes
// =============================

// List Sub Religions
router.get("/subreligions/:religion_id", requireAdmin, async (req, res) => {
  try {
    const [subReligions] = await pool.query(
      "SELECT * FROM sub_religion WHERE religion_id = ? ORDER BY id DESC",
      [req.params.religion_id]
    );

    res.json({ success: true, data: subReligions });
  } catch (err) {
    console.error("Error fetching sub religions:", err.message);
    res.json({ success: false, message: "DB error" });
  }
});

// Add Sub Religion
router.post("/subreligions/add", requireAdmin, async (req, res) => {
  const { religion_id, name } = req.body;

  if (!religion_id || !name) {
    return res.json({ success: false, message: "Missing required fields" });
  }

  try {
    await pool.query(
      "INSERT INTO sub_religion (religion_id, name, status) VALUES (?, ?, 'active')",
      [religion_id, name]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Insert SubReligion error:", err.message);
    res.json({ success: false, message: "DB error" });
  }
});

// Update Sub Religion
router.post("/subreligions/update-field", requireAdmin, async (req, res) => {
  const { id, value } = req.body;

  try {
    await pool.query("UPDATE sub_religion SET name = ? WHERE id = ?", [value, id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Update SubReligion error:", err.message);
    res.json({ success: false, message: "DB error" });
  }
});

// Toggle Sub Religion Status
router.post("/subreligions/status-toggle", requireAdmin, async (req, res) => {
  const { id, status } = req.body;

  if (!["active", "inactive"].includes(status)) {
    return res.json({ success: false, message: "Invalid status" });
  }

  try {
    await pool.query("UPDATE sub_religion SET status = ? WHERE id = ?", [status, id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Toggle Status error:", err.message);
    res.json({ success: false, message: "DB error" });
  }
});

// Delete Sub Religion
router.get("/subreligions/delete/:id", requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM sub_religion WHERE id = ?", [req.params.id]);
    res.redirect("back");
  } catch (err) {
    console.error("Delete SubReligion error:", err.message);
    res.redirect("back");
  }
});

// STATES & DISTRICTS - backend routes
// Assumes: const pool = require('...'); and requireAdmin middleware present

// States list page
router.get("/stateshow", requireAdmin, async (req, res) => {
  try {
    const [states] = await pool.query("SELECT id, state, status FROM state ORDER BY id DESC");
    // NOTE: selecting only the columns we want to show
    res.render("states", { states });
  } catch (err) {
    console.error("Error fetching states:", err.message);
    res.status(500).send("Database error");
  }
});

// Add State
router.post("/states/add", requireAdmin, async (req, res) => {
  const { state } = req.body;
  if (!state) return res.json({ success: false, message: "State name is required" });

  try {
    await pool.query("INSERT INTO state (state, status) VALUES (?, 'active')", [state]);
    res.json({ success: true });
  } catch (err) {
    console.error("Insert State error:", err.message);
    res.json({ success: false, message: "DB error" });
  }
});

// Update State (inline field)
router.post("/states/update-field", requireAdmin, async (req, res) => {
  const { id, value } = req.body;
  try {
    await pool.query("UPDATE state SET state = ? WHERE id = ?", [value, id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Update State error:", err.message);
    res.json({ success: false, message: "DB error" });
  }
});

// Toggle State Status
router.post("/states/status-toggle", requireAdmin, async (req, res) => {
  const { id, status } = req.body;
  if (!["active", "inactive"].includes(status)) return res.json({ success: false, message: "Invalid status" });

  try {
    await pool.query("UPDATE state SET status = ? WHERE id = ?", [status, id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Toggle State Status error:", err.message);
    res.json({ success: false, message: "DB error" });
  }
});

// Delete State
router.get("/states/delete/:id", requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM state WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "State deleted successfully" });
  } catch (err) {
    console.error("Delete State error:", err.message);
    res.json({ success: false, message: "Database error" });
  }
});


// =============================
// District Routes
// =============================

// List Districts by state_id
router.get("/districts/:state_id", requireAdmin, async (req, res) => {
  try {
    // Select fields: id, district_name, status (exclude state_id from returned UI payload if you want)
    const [districts] = await pool.query(
      "SELECT id, district_name, status FROM district WHERE state_id = ? ORDER BY id DESC",
      [req.params.state_id]
    );
    res.json({ success: true, data: districts });
  } catch (err) {
    console.error("Error fetching districts:", err.message);
    res.json({ success: false, message: "DB error" });
  }
});

// Add District
router.post("/districts/add", requireAdmin, async (req, res) => {
  const { state_id, district_name } = req.body;
  if (!state_id || !district_name) {
    return res.json({ success: false, message: "Missing required fields" });
  }

  try {
    await pool.query("INSERT INTO district (state_id, district_name, status) VALUES (?, ?, 'active')", [state_id, district_name]);
    res.json({ success: true });
  } catch (err) {
    console.error("Insert District error:", err.message);
    res.json({ success: false, message: "DB error" });
  }
});

// Update District (name)
router.post("/districts/update-field", requireAdmin, async (req, res) => {
  const { id, value } = req.body;
  try {
    await pool.query("UPDATE district SET district_name = ? WHERE id = ?", [value, id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Update District error:", err.message);
    res.json({ success: false, message: "DB error" });
  }
});

// Toggle District Status
router.post("/districts/status-toggle", requireAdmin, async (req, res) => {
  const { id, status } = req.body;
  if (!["active", "inactive"].includes(status)) return res.json({ success: false, message: "Invalid status" });

  try {
    await pool.query("UPDATE district SET status = ? WHERE id = ?", [status, id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Toggle District Status error:", err.message);
    res.json({ success: false, message: "DB error" });
  }
});

// Delete District
router.get("/districts/delete/:id", requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM district WHERE id = ?", [req.params.id]);
    // For district deletion we can redirect back (as in your religion code) or return json; I'll return json for consistency
    res.json({ success: true, message: "District deleted successfully" });
  } catch (err) {
    console.error("Delete District error:", err.message);
    res.json({ success: false, message: "Database error" });
  }
});
// SHOW ALL MASTER TABLES
router.get("/tableshow", requireAdmin, async (req, res) => {
  try {
    const tables = {
      years: "Years",
      work_type: "Work Type",
      university: "University",
      skin_tones: "Skin Tones",
      qualification_list: "Qualification List",
      marital_status: "Marital Status",
      income_list: "Income List",
      horoscopes: "Horoscopes",
      height: "Heights",
      disability_types: "Disability Types",
      diet: "Diet Types",
      Course: "Courses",
      child_count: "Child Count",
      blood_groups: "Blood Groups"
    };

    let results = {};

    for (let tbl in tables) {
      const [rows] = await pool.query(`SELECT * FROM ${tbl} ORDER BY id DESC`);
      results[tbl] = rows;
    }

    res.render("table", { results, tables });
  } catch (err) {
    console.error("Error fetching tables:", err);
    res.status(500).send("Database error");
  }
});

// ALL MASTER TABLES - list of allowed tables and the main column name to use for adds
const tables = [
  { table: "years", col: "year" },
  { table: "work_type", col: "name" },
  { table: "university", col: "name" },
  { table: "skin_tones", col: "tone_name" },
  { table: "qualification_list", col: "name" },
  { table: "marital_status", col: "status_name" },
  { table: "income_list", col: "income_range" },
  { table: "horoscopes", col: "name" },
  { table: "height", col: "height_ft" },
  { table: "disability_types", col: "name" },
  { table: "diet", col: "diet_type" },
  { table: "Course", col: "course_name" },
  { table: "child_count", col: "child_count_label" },
  { table: "blood_groups", col: "name" },
];

// helper: find meta for a table
function findTableMeta(tbl) {
  return tables.find(t => t.table === tbl);
}

// SHOW PAGE
router.get("/tableshow", requireAdmin, async (req, res) => {
  try {
    // send an object mapping tableName -> readable title (we simply reuse table name)
    res.render("table", {
      tables: Object.fromEntries(tables.map(t => [t.table, t.table])),
      defaultTable: tables[0].table
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// GET TABLE DATA
router.get("/get-table-data/:table", requireAdmin, async (req, res) => {
  try {
    const tbl = req.params.table;
    const meta = findTableMeta(tbl);
    if (!meta) return res.json({ success: false, message: "Invalid table" });

    // safe: table validated against allowed list
    const [rows] = await pool.query(`SELECT * FROM \`${tbl}\` ORDER BY id DESC`);
    res.json({ success: true, rows });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "DB error" });
  }
});

// ADD RECORD
router.post("/add-record", requireAdmin, async (req, res) => {
  try {
    const { table, fieldValue } = req.body;
    const meta = findTableMeta(table);
    if (!meta) return res.json({ success: false, message: "Invalid table" });

    const column = meta.col;
    if (!fieldValue || String(fieldValue).trim().length === 0) {
      return res.json({ success: false, message: "Empty value" });
    }

    // use prepared statement for value
    await pool.query(
      `INSERT INTO \`${table}\` (${column}, status, created_at, updated_at) VALUES (?, 'active', NOW(), NOW())`,
      [String(fieldValue).trim()]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "DB error" });
  }
});

// UPDATE RECORD - inline edit
router.post("/update-record", requireAdmin, async (req, res) => {
  try {
    const { table, id, field, value } = req.body;
    const meta = findTableMeta(table);
    if (!meta) return res.json({ success: false, message: "Invalid table" });

    // basic validations
    if (!id || !/^\d+$/.test(String(id))) return res.json({ success: false, message: "Invalid id" });
    if (!field || typeof field !== "string") return res.json({ success: false, message: "Invalid field" });

    // disallow changing id field
    if (field === "id") return res.json({ success: false, message: "Cannot update id" });

    // allow only safe column names (letters, numbers, underscore)
    if (!/^[a-zA-Z0-9_]+$/.test(field)) return res.json({ success: false, message: "Invalid field name" });

    // We trust `table` as it's validated earlier; we cannot parametrize column names so we embed them after validation
    await pool.query(
      `UPDATE \`${table}\` SET \`${field}\` = ?, updated_at = NOW() WHERE id = ?`,
      [value, id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "DB error" });
  }
});

// DELETE RECORD
router.post("/delete-record", requireAdmin, async (req, res) => {
  try {
    const { table, id } = req.body;
    const meta = findTableMeta(table);
    if (!meta) return res.json({ success: false, message: "Invalid table" });
    if (!id || !/^\d+$/.test(String(id))) return res.json({ success: false, message: "Invalid id" });

    await pool.query(`DELETE FROM \`${table}\` WHERE id = ?`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "DB error" });
  }
});

// TOGGLE STATUS
router.post("/toggle-status", requireAdmin, async (req, res) => {
  try {
    const { table, id, status } = req.body;
    const meta = findTableMeta(table);
    if (!meta) return res.json({ success: false, message: "Invalid table" });
    if (!id || !/^\d+$/.test(String(id))) return res.json({ success: false, message: "Invalid id" });

    // restrict to only 'active' or 'inactive'
    const newStatus = status === "active" ? "active" : "inactive";

    await pool.query(
      `UPDATE \`${table}\` SET status = ?, updated_at = NOW() WHERE id = ?`,
      [newStatus, id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "DB error" });
  }
});
export default router;




