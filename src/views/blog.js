const express = require('express');
const db = require('../config/db');
const router = express.Router();
const jwt = require("jsonwebtoken");
const requireAdmin = require('../middleware/requireAdmin');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const base_url = process.env.BASE_URL;

// const methodOverride = require('method-override');
// router.use(methodOverride('_method'));

const bannerFolder = path.join(__dirname, '../public/banner');

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

router.post('/transactions/update1', async (req, res) => {
  try {
    const { 
      id, day, 
      Filter_Both, Filter_Gender, Filter_Region, 
      No_Ads, Rear_Camra, 
      created_at, expire_at
    } = req.body;

    console.log("🔄 Update Request:", req.body);

    // ⛔ Required
    if (!id) {
      return res.json({ msg: "ID is required" });
    }
    if (!day) {
      return res.json({ msg: "Day is required" });
    }

    // 🕒 Fix datetime format (optional)
    const createdAtFormatted = created_at ? created_at.replace("T", " ") : null;
    const expireAtFormatted  = expire_at  ? expire_at.replace("T", " ") : null;

    // 📝 Update Query
    await db.query(
      `UPDATE payments 
       SET day=?, 
           Filter_Both=?, 
           Filter_Gender=?, 
           Filter_Region=?, 
           No_Ads=?, 
           Rear_Camra=?, 
           created_at=?, 
           expire_at=? 
       WHERE id=?`,
      [
        day || null,
        Filter_Both || null,
        Filter_Gender || null,
        Filter_Region || null,
        No_Ads || null,
        Rear_Camra || null,
        createdAtFormatted,
        expireAtFormatted,
        id
      ]
    );

    return res.json({ msg: "Updated successfully" });

  } catch (err) {
    console.error("Update error:", err);
    return res.json({ msg: err.message || "Error updating" });
  }
});



router.get('/login', (req, res) => {
  if (res.locals.admin) {
    return res.redirect('/');
  }
  res.render('login');
});

// Protected routes
// router.use(requireAdmin);

router.get('/', requireAdmin, (req, res) => {
  const countQuery = `
    SELECT 
      (SELECT COUNT(*) FROM users) AS total_users,
      (SELECT COUNT(*) FROM vendors) AS premium_users,
      (SELECT COUNT(*) FROM users WHERE status = 'active') AS active_users,
      (SELECT COUNT(*) FROM vendors WHERE status = 'active') AS active_vendor,

      -- Payments
      (SELECT IFNULL(SUM(amount), 0) FROM payment WHERE status = 'confirm') AS total_payment,
      (SELECT IFNULL(SUM(amount), 0) FROM payment WHERE status = 'confirm' AND DATE(created_at) = CURDATE()) AS today_payment,

      -- Withdrawals
      (SELECT IFNULL(SUM(amount), 0) FROM transaction_history WHERE payment_status = 'success') AS total_withdrawal,
      (SELECT IFNULL(SUM(amount), 0) FROM transaction_history WHERE payment_status = 'success' AND DATE(transaction_date) = CURDATE()) AS today_withdrawal
  `;

  db.query(countQuery, (err, results) => {
    if (err) {
      console.error('Error fetching user/payment/withdrawal counts:', err);
      return res.status(200).send('Database error');
    }

    const counts = results[0];

    res.render('index', {
      totalUsers: counts.total_users,
      premiumUsers: counts.premium_users,
      activeUsers: counts.active_users,
      activeVendors: counts.active_vendor,

      totalPayment: counts.total_payment,
      todayPayment: counts.today_payment,
      totalWithdrawal: counts.total_withdrawal,
      todayWithdrawal: counts.today_withdrawal
    });
  });
});


router.get('/users', requireAdmin, (req, res) => {
  const query = `
    SELECT *
    FROM users
    WHERE status != 'delete'
  `;
//, YEAR(CURDATE()) - YEAR(date_of_birth) AS age
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(200).send('Database error');
    }
    res.render('users', { users: results });
  });
});

router.get('/deleteprofile/:id',requireAdmin, (req, res) => {
  const userId = req.params.id;
  db.query("UPDATE users SET status = 'delete' WHERE id = ?", [userId], (err, result) => {
    if (err) return res.json({ success: false, message: "Failed to delete user" });
    res.json({ success: true, message: "User deleted successfully" });
  });
});

router.get('/userregister',requireAdmin,(req,res)=>{
  res.render('userregister')
})

router.get('/agent',requireAdmin, (req, res) => {
  db.query(`SELECT * FROM vendors where status != 'delete'`, (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(200).send('Database error');
    }
    res.render('agent', { users: results });
  });
});

router.patch('/agent/:id/status',requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  db.query('UPDATE vendors SET status = ? WHERE id = ?', [status, id], (err) => {
    if (err) {
      console.error('Error updating agent status:', err);
      return res.status(200).json({ success: false, message: 'Failed to update status' });
    }
    res.json({ success: true, message: 'Status updated successfully' });
  });
});

router.patch('/agent/:id/statuspaid',requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  db.query('UPDATE sarthi_user SET status = ? WHERE id = ?', [status, id], (err) => {
    if (err) {
      console.error('Error updating agent status:', err);
      return res.status(200).json({ success: false, message: 'Failed to update status' });
    }
    res.json({ success: true, message: 'Status updated successfully' });
  });
});


router.get('/delete_agent/:id',requireAdmin, (req, res) => {
  const userId = req.params.id;
  const sql = "UPDATE vendors SET status = 'delete' WHERE id = ?";

  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.log("Error soft-deleting user:", err);
      return res.status(200).json({ success: false, message: "Failed to delete user" });
    }

    return res.status(200).json({ success: true, message: "User deleted successfully" });
  });
});


router.get('/agentregister',requireAdmin,(req,res)=>{
  res.render('agentregister')
})

// router.get('/viewagent/:id', (req, res) => {
//   const { id } = req.params;

//   if (!id) {
//     return res.status(200).json({ success: false, message: 'vendors ID is required' });
//   }

//   db.query('SELECT * FROM vendors WHERE id = ?', [id], (err, result) => {
//     if (err) {
//       console.error("Database error:", err);
//       return res.status(200).json({ success: false, message: 'Database error', error: err });
//     }

//     if (result.length === 0) {
//       return res.status(200).json({ success: false, message: 'Agent not found' });
//     }

//     const user = result[0];
//     res.render('viewagent', { user });
//   });
// });

// router.get('/viewagent/:id', (req, res) => {
//   const { id } = req.params;

//   if (!id) {
//     return res.status(400).render('error', { message: 'ID is required' });
//   }

//   // Get vendor (agent) details
//   db.query(`SELECT * FROM vendors WHERE id = ?`, [id], (err, vendorResult) => {
//     if (err) {
//       return res.status(200).render('error', { message: 'Database error while fetching vendor' });
//     }

//     if (vendorResult.length === 0) {
//       return res.status(200).render('error', { message: 'Vendor not found' });
//     }

//     const vendor = vendorResult[0];

//     // Get users referred by this vendor
//     const referralQuery = `SELECT * FROM users WHERE vendor_id = ? ORDER BY created_at DESC`;

//     db.query(referralQuery, [id], (err2, referralUsers) => {
//       if (err2) {
//         return res.status(200).render('error', { message: 'Error fetching referred users' });
//       }

//       res.render('viewagent', {
//         vendor: vendor,
//         referrals: referralUsers
//       });
//     });
//   });
// });


router.get('/editagent/:id',requireAdmin, (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(200).json({ success: false, message: 'vendors ID is required' });
  }

  db.query('SELECT * FROM vendors WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(200).json({ success: false, message: 'Database error', error: err });
    }

    if (result.length === 0) {
      return res.status(200).json({ success: false, message: 'Agent not found' });
    }

    const user = result[0];
    res.render('editagent', { user });
  });
});

router.get('/viewagent/:id',requireAdmin, (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(200).json({ success: false, message: 'vendors ID is required' });
  }

  db.query('SELECT * FROM vendors WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(200).json({ success: false, message: 'Database error', error: err });
    }

    if (result.length === 0) {
      return res.status(200).json({ success: false, message: 'Vendor not found' });
    }

    const user = result[0];
    res.render('viewagent', { user });
  });
});



router.post('/add-banner',requireAdmin, upload.single('bannerImage'), (req, res) => {
  const { id, actionLink } = req.body;
  const img_url = req.file ? '/banner/' + req.file.filename : null;

  if (id) {
    // Edit mode
    const query = `
      UPDATE banner SET ${img_url ? 'img_url = ?, ' : ''} action_link = ? WHERE id = ?
    `;
    const values = img_url ? [img_url, actionLink, id] : [actionLink, id];

    db.query(query, values, (err) => {
      if (err) return res.status(500).send('DB Error');
      res.redirect('/banner-ui');
    });
  } else {
    // Add mode
    if (!img_url) return res.status(400).send('Image is required!');
    db.query('INSERT INTO banner (img_url, action_link, status) VALUES (?, ?, ?)', [img_url, actionLink, 'inactive'], (err) => {
      if (err) return res.status(500).send('DB Error');
      res.redirect('/banner-ui');
    });
  }
});

router.get('/banner-ui',requireAdmin, async (req, res) => {
    try {
        const response = await axios.get(`${process.env.BASE_URL}/banner1`);
        const banners = response.data.success ? response.data.data : [];
        res.render('banner', { banners });
    } catch (error) {
        console.error('Error fetching banners:', error.message);
        res.render('banner', { banners: [] });
    }
});

router.post('/toggle-banner-status',requireAdmin, (req, res) => {
    const { id, status } = req.body;

    if (!id || !status) {
        return res.status(200).send('Missing parameters');
    }

    const query = 'UPDATE banner SET status = ? WHERE id = ?';
    db.query(query, [status, id], (err, result) => {
        if (err) {
            console.error('Error updating banner status:', err.message);
            return res.status(500).send('DB Error');
        }
        res.redirect('/banner-ui');
    });
});
//indono ko secure na karo
router.get('/banner1',(req, res) => {
    db.query('SELECT * FROM banner', (err, results) => {
        if (err) return res.status(200).json({ error: err.message });

        if (results.length === 0) {
            return res.status(200).json({ success: false, msg: 'No data found',data: results });
        }
        res.status(200).json({success:true,msg:'Data get successfully', data: results});
    });
});

router.get('/banner', (req, res) => {

  db.query(`SELECT * FROM banner where status != 'inactive'`, (err, results) => {
    if (err) return res.status(200).json({ success: false, error: err.message });

    if (results.length === 0) {
      return res.status(200).json({ success: false, msg: 'No data found', data: [] });
    }

    // img_url में base URL prepend करें
    const updatedResults = results.map(row => ({
      ...row,
      img_url: `${base_url}${row.img_url}`
    }));

    res.status(200).json({ success: true, msg: 'Data get successfully', data: updatedResults });
  });
});


router.post('/delete-banner',requireAdmin, (req, res) => {
  const { id } = req.body;

  if (!id) return res.json({ success: false, message: 'Banner ID missing' });

  const sql = 'DELETE FROM banner WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Delete error:', err);
      return res.json({ success: false, message: 'DB error' });
    }
    return res.json({ success: true });
  });
});

// banner end
router.get('/manage',requireAdmin,(req,res)=>{
  res.render('manage');
});

router.get('/varification',requireAdmin,(req,res)=>{
  res.render('varification');
});

router.patch('/users/:id/status',requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  db.query('UPDATE users SET status = ? WHERE id = ?', [status, id], (err) => {
    if (err) {
      console.error('Error updating user status:', err);
      return res.status(200).json({ success: false, message: 'Failed to update status' });
    }
    res.json({ success: true, message: 'Status updated successfully' });
  });
});
    
// router.get('/viewprofile/:id', requireAdmin, (req, res) => {
//   const { id } = req.params;

//   if (!id || isNaN(id)) {
//     return res.status(400).json({ success: false, message: 'Valid ID is required' });
//   }

//   const query = `
//     SELECT 
//       u.id, u.first_name, u.middle_name, u.last_name, u.email,
//       u.profile, u.phone, u.gender, u.date_of_birth, u.address,
//       u.city, u.state, u.country, u.pincode, u.img AS image,

//       ud.stay_in, ud.religion, ud.caste, ud.marital_status, ud.child,
//       ud.education, ud.college, ud.course, ud.education1, ud.college1, ud.course1,
//       ud.occupation, ud.work_type, ud.company_name, ud.income,
//       ud.father_name, ud.mother_name, ud.father_details, ud.mother_details,
//       ud.family_income, ud.height_cm, ud.diet, ud.brother, ud.sister,
//       ud.about, ud.skin_tone, ud.status, ud.referral_code
//     FROM users u
//     LEFT JOIN user_details ud ON u.id = ud.user_id
//     WHERE u.id = ?
//   `;

//   db.query(query, [id], (err, results) => {
//     if (err) {
//       console.error('DB Error fetching profile:', err);
//       return res.status(500).json({ success: false, message: 'Database error', error: err });
//     }

//     if (results.length === 0) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }

//     res.render('viewprofile', { user: results[0] });
//   });
// });
router.get('/viewprofile/:id', (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(200).json({ success: false, message: 'ID is required' });
  }

  // Step 1: Get user/agent details
  db.query(`SELECT * FROM users WHERE id = ?`, [id], (err, result) => {
    if (err) {
      return res.status(200).json({ success: false, message: 'Database error', error: err });
    }

    if (result.length === 0) {
      return res.status(200).json({ success: false, message: 'User not found' });
    }

    const agent = result[0];
    const usersWithDetails = [{ ...agent, status: 'active' }];

    // Step 2: Get family members of this user
    const referralQuery = `
      SELECT * FROM family_members
      WHERE user_id = ?
      ORDER BY created_at DESC
    `;

    db.query(referralQuery, [id], (err2, referralUsers) => {
      if (err2) {
        return res.status(200).json({ success: false, message: 'Error fetching family members', error: err2 });
      }

      res.render('viewprofile', {
        users: usersWithDetails,
        referrals: referralUsers
      });
    });
  });
});


router.get('/editprofile/:id',requireAdmin, (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(200).json({ success: false, message: 'ID is required' });
  }

  // Logging the id to check if it's being passed correctly
  console.log(`Request received for user ID: ${id}`);

  db.query(`
    SELECT  *
    FROM 
      users 
    WHERE id = ?
  `, [id], (err, result) => { 
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, message: 'Database error', error: err });
    }

    // Logging the result to debug if the user data is being returned correctly
    console.log("Query result:", result);

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const usersWithdetails = result.map(user => ({
      ...user,
      status: user.status || 'active' 
    }));

    res.render('editprofile', { users: usersWithdetails });
  });
});

router.get('/adminprofile',requireAdmin, (req, res) => {
  const adminId = 1; // or get from session: req.session.adminId

  db.query('SELECT * FROM admin WHERE id = ?', [adminId], (err, result) => {
    if (err) return res.status(500).send('Database error');

    if (result.length === 0) {
      return res.render('adminprofile', { admin: null });
    }

    res.render('adminprofile', { admin: result[0] });
  });
});

router.get('/upgradepremium',requireAdmin, (req, res) => {
  db.query(`SELECT * FROM premium where status = '1'`, (err, results) => {
    if (err) {
      console.error('Error fetching premium plans:', err);
      return res.status(200).send('Database error');
    }
    res.render('upgradepremium', { premiumPlans: results });
  });
});

router.get('/plans',requireAdmin, (req, res) => {
  db.query('SELECT * FROM upgrade_premium', (err, results) => {
    if (err) {
      console.error('Error fetching plans:', err);
      return res.status(200).send('Database error');
    }
    res.render('plans', { plans: results });
  });
});
router.post('/plans/status-toggle',requireAdmin, (req, res) => {
  const { id, status } = req.body;
  const sql = 'UPDATE upgrade_premium SET status = ? WHERE id = ?';

  db.query(sql, [status, id], (err, result) => {
    if (err) {
      console.error('Error updating status:', err);
      return res.status(200).json({ success: false });
    }
    res.json({ success: true });
  });
});

// UPDATE FIELD (inline edit)
router.post('/plans/update-field',requireAdmin, (req, res) => {
  const { id, field, value } = req.body;
  const allowedFields = ['name', 'month', 'prize', 'per_month_prize', 'description'];
  if (!allowedFields.includes(field)) {
    return res.status(200).json({ success: false, message: 'Invalid field' });
  }

  const sql = `UPDATE upgrade_premium SET ${field} = ? WHERE id = ?`;
  db.query(sql, [value, id], (err) => {
    if (err) {
      console.error('Update error:', err);
      return res.status(200).json({ success: false });
    }
    res.json({ success: true });
  });
});

// DELETE PLAN
router.get('/plans/delete/:id', requireAdmin,(req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM upgrade_premium WHERE id = ?', [id], (err) => {
    if (err) {
      console.error('Delete error:', err);
      return res.redirect('/plans?error=1');
    }
    res.redirect('/plans?deleted=1');
  });
});

// ADD PLAN (new row save)
router.post('/plans/add',requireAdmin, (req, res) => {
  const { name, month, prize, per_month_prize, description } = req.body;

  if (!name || !month || !prize || !per_month_prize) {
    return res.json({ success: false, message: 'Missing fields' });
  }

  const sql = `
    INSERT INTO upgrade_premium (name, month, prize, per_month_prize, description, status, created_at)
    VALUES (?, ?, ?, ?, ?, '1', NOW())
  `;
  db.query(sql, [name, month, prize, per_month_prize, description || ''], (err, result) => {
    if (err) {
      console.error('Insert error:', err);
      return res.json({ success: false });
    }
    res.json({ success: true });
  });
});



router.get('/connections',requireAdmin, (req, res) => {
  const sql = `
    SELECT 
      m.id,
      m.user1_id,
      m.user2_id,
      m.matched_at,
      m.status, 
      u1.first_name AS user1_name,
      u1.img AS user1_img,
      u2.first_name AS user2_name,
      u2.img AS user2_img
    FROM matches m
    LEFT JOIN users u1 ON m.user1_id = u1.id
    LEFT JOIN users u2 ON m.user2_id = u2.id
    ORDER BY m.matched_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching matches:', err);
      return res.status(200).send('Database error');
    }
    res.render('connections', { connections: results });
  });
});

// PATCH: Update connection status
// PATCH: Update connection status
router.patch('/connections/:id/status',requireAdmin, (req, res) => {
  const connectionId = req.params.id;
  const { status } = req.body;

  const sql = 'UPDATE matches SET status = ? WHERE id = ?';
  db.query(sql, [status, connectionId], (err, result) => {
    if (err) {
      console.error('Error updating connection status:', err);
      return res.status(200).json({ message: 'Database error' });
    }

    if (result.affectedRows === 0) {
      return res.status(200).json({ message: 'Connection not found' });
    }

    return res.status(200).json({ message: 'Status updated successfully' });
  });
});

router.get('/request',requireAdmin, (req, res) => {
  const sql = `
    SELECT 
      s.id,
      s.swiper_id,
      s.swiped_id,
      s.direction,
      s.created_at,
      s.status,
      u1.first_name AS swiper_name,
      u1.img AS swiper_img,
      u2.first_name AS swiped_name,
      u2.img AS swiped_img
    FROM swipes s
    LEFT JOIN users u1 ON s.swiper_id = u1.id
    LEFT JOIN users u2 ON s.swiped_id = u2.id
    ORDER BY s.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching swipes:', err);
      return res.status(200).send('Database error');
    }
    res.render('request', { swipes: results });
  });
});

// PATCH route to update swipe status
router.patch('/request/:id/status',requireAdmin, (req, res) => {
  const swipeId = req.params.id;
  const newStatus = req.body.status;

  const sql = 'UPDATE swipes SET status = ? WHERE id = ?';

  db.query(sql, [newStatus, swipeId], (err, result) => {
    if (err) {
      console.error('Failed to update status:', err);
      return res.status(200).json({ error: 'Database error' });
    }

    res.json({ success: true, message: 'Status updated' });
  });
});

router.get('/termcondition',requireAdmin, (req, res) => {
  db.query('SELECT * FROM terms_conditions ORDER BY id DESC LIMIT 1', (err, rows) => {
    if (err) {
      console.error('Error fetching terms:', err);
      return res.render('termcondition', { term: {} });
    }
    const term = rows.length > 0 ? rows[0] : {};
    res.render('termcondition', { term });
  });
});

router.post('/termsave',requireAdmin, (req, res) =>      {
  const { id, title, description, status } = req.body;
  const query = id
    ? 'UPDATE terms_conditions SET title = ?, description = ?, status = ?, updated_at = NOW() WHERE id = ?'
    : 'INSERT INTO terms_conditions (title, description, status, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())';

  const params = id ? [title, description, status, id] : [title, description, status];

  db.query(query, params, (err) => {
    if (err) {
      console.error(err);
      return res.json({ success: false, msg: 'Failed to save terms.' });
    }
    res.json({ success: true, msg: 'Terms & Conditions saved successfully.' });
  });
});
//Appoinment History
router.get('/slotcreate', requireAdmin,(req, res) => {
  db.query(`SELECT vs.*, v.name AS vendor_name
FROM vendor_slots vs
JOIN vendors v ON vs.vendor_id = v.id
WHERE vs.status != 'delete'
ORDER BY vs.created_at DESC;`, (err, results) => {
    if (err) {
      console.error(err);
      return res.render('slotcreate', { users: [] });
    }
    res.render('slotcreate', { users: results });
  });
});

router.get('/slotcreatedelete/:id', requireAdmin,(req, res) => {
  const userId = req.params.id;
  db.query("UPDATE vendor_slots SET status = 'delete' WHERE id = ?", [userId], (err, result) => {
    if (err) return res.json({ success: false, message: "Failed to delete Slots" });
    res.json({ success: true, message: "Slot deleted successfully" });
  });
});

router.patch('/slotcreate/:id/status',requireAdmin, (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  console.log(req.body);

  db.query('UPDATE vendor_slots SET status = ? WHERE id = ?', [status, id], (err) => {
    if (err) {
      console.error(err);
      return res.status(200).json({ success: false, msg: 'Failed to update status.' });
    }
    res.json({ success: true });
  });
});

router.get('/slotbook',requireAdmin, (req, res) => {
  db.query(`SELECT 
  slots.*, 
  users.name AS user_name,
  vendors.name AS vendor_name,
  vendors.state AS v_state ,
  vendors.district AS district
FROM slots
LEFT JOIN users ON slots.user_id = users.id
LEFT JOIN vendors ON slots.vendor_id = vendors.id
ORDER BY slots.created_at DESC`, (err, results) => {
    if (err) {
      console.error(err);
      return res.render('slotbook', { rations: [] });
    }
    res.render('slotbook', { rations: results });
  });
});

router.patch('/slotcbook/:id/status',requireAdmin, (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  console.log(req.body);

  db.query('UPDATE slots SET ration_status = ? WHERE id = ?', [status, id], (err) => {
    if (err) {
      console.error(err);
      return res.status(200).json({ success: false, msg: 'Failed to update status.' });
    }
    console.log("Status Change")
    res.json({ success: true });
  });
});

router.get('/viewslot/:id', requireAdmin, (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(200).json({ success: false, message: 'Valid ID is required' });
  }

  const query = `
SELECT 
  s.id AS slot_id,
  s.user_id,
  s.vendor_id,
  s.profile,
  s.amount,
  s.state,
  s.date,
  s.time,
  s.card_no,
  s.created_at,
  s.updated_at,
  s.ration_status,
  s.type,
  
  CASE 
    WHEN s.profile = 'others' THEN uc.name 
    ELSE u.name 
  END AS user_name,
  
  CASE 
    WHEN s.profile = 'others' THEN uc.card_no 
    ELSE u.card_no 
  END AS user_card_no,
  
  CASE 
    WHEN s.profile = 'others' THEN uc.phone 
    ELSE u.phone 
  END AS user_phone,
  
  CASE 
    WHEN s.profile = 'others' THEN uc.email 
    ELSE u.email 
  END AS user_email,
  
  CASE 
    WHEN s.profile = 'others' THEN uc.state 
    ELSE u.state 
  END AS user_state,
  
  CASE 
    WHEN s.profile = 'others' THEN uc.district 
    ELSE u.district 
  END AS user_district,
  
  CASE 
    WHEN s.profile = 'others' THEN uc.town 
    ELSE u.town 
  END AS user_town,
  
  CASE 
    WHEN s.profile = 'others' THEN uc.city 
    ELSE u.city 
  END AS user_city,
  
  CASE 
    WHEN s.profile = 'others' THEN uc.aadhar_no 
    ELSE u.aadhar_no 
  END AS user_aadhar_no,
  
  CASE 
    WHEN s.profile = 'others' THEN uc.scheme 
    ELSE u.scheme 
  END AS user_scheme

FROM slots s
LEFT JOIN users u ON s.user_id = u.id
LEFT JOIN users_copy uc ON s.card_no = uc.card_no
WHERE s.id = ?;

  `;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('DB Error fetching profile:', err);
      return res.status(200).json({ success: false, message: 'Database error', error: err });
    }

    if (results.length === 0) {
      return res.status(200).json({ success: false, message: 'Payment not found' });
    }
//   console.log(results);
    res.render('viewslot', {
  user: results[0],
  base_url
});

  });
});

// GET transactions page
router.get('/transactions',requireAdmin, (req, res) => {
  db.query(`
    SELECT p.*, v.name AS vendor_name
    FROM payment p
    LEFT JOIN vendors v ON p.vendor_id = v.id
    ORDER BY p.created_at DESC
  `, (err, results) => {
    if (err) {
      console.error(err);
      return res.render('transaction', { users: [] });
    }
    res.render('transaction', { users: results });
  });
});

router.patch('/transactions/:id/status',requireAdmin, (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  console.log(req.body);

  db.query('UPDATE payment SET status = ? WHERE id = ?', [status, id], (err) => {
    if (err) {
      console.error(err);
      return res.status(200).json({ success: false, msg: 'Failed to update status.' });
    }
    res.json({ success: true });
  });
});


router.get('/viewpayment/:id', requireAdmin, (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(200).json({ success: false, message: 'Valid ID is required' });
  }

  const query = `
    SELECT *
    FROM payment 
    WHERE id = ?
  `;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('DB Error fetching profile:', err);
      return res.status(200).json({ success: false, message: 'Database error', error: err });
    }

    if (results.length === 0) {
      return res.status(200).json({ success: false, message: 'Payment not found' });
    }
//   console.log(results);
    res.render('viewpayment', {
  user: results[0],
  base_url
});

  });
});

// withdrall history page
router.get('/withdrawtransaction',requireAdmin, (req, res) => {
  db.query(`
    SELECT t.*, v.name AS vendor_name,
    v.email, v.phone,
    DATE_FORMAT(t.transaction_date, '%a %b %d %Y %H:%i:%s') AS transaction_date
    FROM transaction_history t
    LEFT JOIN vendors v ON t.vendor_id = v.id
    ORDER BY t.transaction_date DESC
  `, (err, results) => {
    if (err) {
      console.error(err);
      return res.render('Withdrawtransaction', { users: [] });
    }
    res.render('Withdrawtransaction', { users: results });
  });
});

router.get('/wallet',requireAdmin, (req, res) => {
  db.query(`SELECT vw.*, v.name AS vendor_name
FROM vendor_wallet vw
JOIN vendors v ON v.id = vw.vendor_id
ORDER BY vw.updated_at DESC;
`, (err, results) => {
    if (err) {
      console.error('Error fetching wallet data:', err);
      return res.render('wallet', { wallets: [] });
    }
    res.render('wallet', { wallets: results });
  });
});

router.patch('/wallet/:id/status',requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  db.query('UPDATE vendor_wallet SET status = ? WHERE id = ?', [status, id], (err) => {
    if (err) {
      console.error('Status update failed:', err);
      return res.status(500).json({ success: false, message: 'Failed to update status' });
    }
    res.json({ success: true, message: 'Status updated successfully' });
  });
});

router.get('/home',requireAdmin,(req,res)=>{
  res.render('home');
});

router.get('/tables',requireAdmin,(req,res)=>{
  res.render('tables');
});

router.get('/blank-page',requireAdmin,(req,res)=>{
  res.render('blank-page');
});

router.get('/error-404',requireAdmin,(req,res)=>{
  res.render('error-404');
});

router.get('/register',requireAdmin,(req,res)=>{
  res.render('register');
});

router.get('/signin',(req,res)=>{
  res.render('login');
});

router.get('/500',requireAdmin,(req,res)=>{
  res.render('500');
});

router.get('/basic_elements',requireAdmin,(req,res)=>{
  res.render('basic_elements');
});

router.get('/charts',requireAdmin,(req,res)=>{
  res.render('charts');
});

router.get('/font_awesome',requireAdmin,(req,res)=>{
  res.render('font_awesome');
});

router.get('/typography',requireAdmin,(req,res)=>{
  res.render('typography');
});

router.get('/buttons',requireAdmin,(req,res)=>{
  res.render('buttons');
});

router.get('/dropdowns',requireAdmin,(req,res)=>{
  res.render('dropdowns');
});

router.get('/interests',requireAdmin,(req,res)=>{
  res.render('interests');
});

router.get('/ignore',requireAdmin,(req,res)=>{
  res.render('ignore');
});

router.get('/reports',requireAdmin,(req,res)=>{
  res.render('reports');
});

router.get('/religion',requireAdmin,(req,res)=>{
  res.render('religion');
});

router.get('/blood',requireAdmin,(req,res)=>{
  res.render('blood');
});

router.get('/marital',requireAdmin,(req,res)=>{
  res.render('marital');
});

router.get('/profile',requireAdmin,(req,res)=>{
  res.render('profile');
});

router.get('/pro',requireAdmin,(req,res)=>{
  res.render('pro');
});

router.get('/height2',requireAdmin,(req,res)=>{
  res.render('height2');
});

router.get('/sendnotification', requireAdmin, (req, res) => {
  const query = `SELECT token, img, first_name AS name FROM users`;

  db.query(query, (err, users) => {
    if (err) {
      console.log('Error fetching users for notification:', err);
      return res.status(200).send('Database error');
    }

    res.render('sendnotification', { users });
  });
});

// router.get("/text-slider", (req, res) => {
//   const userQuery = `SELECT * FROM text_slider WHERE id = 1 ORDER BY created_at DESC`;
//   const vendorQuery = `SELECT * FROM text_slider WHERE id = 2 ORDER BY created_at DESC`;

//   db.query(userQuery, (err1, userResults) => {
//     if (err1) {
//       return res.status(200).json({ success: false, msg: "Error fetching user text", error: err1 });
//     }

//     db.query(vendorQuery, (err2, vendorResults) => {
//       if (err2) {
//         return res.status(200).json({ success: false, msg: "Error fetching vendor text", error: err2 });
//       }

//       res.render("text", {
//         userText: userResults,
//         vendorText: vendorResults
//       });
//     });
//   });
// });

router.get("/text-slider", requireAdmin,(req, res) => {
  const userQuery = `SELECT * FROM text_slider WHERE id = 1`;
  const vendorQuery = `SELECT * FROM text_slider WHERE id = 2`;

  db.query(userQuery, (err1, userResults) => {
    if (err1) {
      return res.status(200).json({ success: false, msg: "Error fetching user text", error: err1 });
    }

    db.query(vendorQuery, (err2, vendorResults) => {
      if (err2) {
        return res.status(200).json({ success: false, msg: "Error fetching vendor text", error: err2 });
      }

      res.render("text", {
        userText: userResults[0] || { id: 1, message: "", status: "active" },
        vendorText: vendorResults[0] || { id: 2, message: "", status: "active" }
      });
    });
  });
});

//mbmr
router.get('/sendnotificationto', requireAdmin, (req, res) => {
  const query = `SELECT id as token, phone, name FROM users`;

  db.query(query, (err, users) => {
    if (err) {
      console.log('Error fetching users for notification:', err);
      return res.status(200).send('Database error');
    }

    res.render('sendnotificationto', { users });
  });
});

router.get('/shownotification', requireAdmin, (req, res) => {

const query = `
  SELECT 
    n.id,
    n.user_id,
    n.title,
    n.message,
    n.is_read,
    n.created_at,
    n.senderid,
    n.is_read_vendors,
    u.name AS user_name,
    v.name AS vendor_name
  FROM notifications n
  LEFT JOIN users u ON n.user_id = u.id
  LEFT JOIN vendors v ON n.senderid = v.id
  ORDER BY n.id DESC
`;


  
//     const query = `
//     SELECT 
//       *
//     FROM notifications 
//   `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching notifications:', err);
      return res.status(200).send('Database error');
    }
    res.render('shownotification', { users: results });
  });
});

router.get('/showlikes', requireAdmin, (req, res) => {
  const query = `
 SELECT
  l.id,
  l.liker_id,
  l.liked_id,
  l.reaction,
  u1.img,
  u1.first_name AS liker_name,
  u2.first_name AS liked_name,
  DATE(l.created_at) AS created_date
FROM
  likes l
JOIN users u1 ON l.liker_id = u1.id
JOIN users u2 ON l.liked_id = u2.id;

  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching notifications:', err);
      return res.status(200).send('Database error');
    }
    res.render('showlikes', { users: results });
  });
});

router.get('/block', requireAdmin, (req, res) => {
  const sql = `
    SELECT 
      b.id,
      b.blocker_id,
      b.blocked_id,
      b.reaction,
      b.status, 
      b.created_at,
      b.updated_at,
      u1.first_name AS blocker_name,
      u1.img AS blocker_img,
      u2.first_name AS blocked_name,
      u2.img AS blocked_img
    FROM block b
    LEFT JOIN users u1 ON b.blocker_id = u1.id
    LEFT JOIN users u2 ON b.blocked_id = u2.id
    ORDER BY b.updated_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching block list:', err);
      return res.status(500).send('Database error');
    }
    res.render('block', { connections: results });
  });
});

router.patch('/block/:id/status',requireAdmin, (req, res) => {
  const connectionId = req.params.id;
  const { status } = req.body;

  const sql = 'UPDATE block SET status = ? WHERE id = ?';
  db.query(sql, [status, connectionId], (err, result) => {
    if (err) {
      console.error('Error updating connection status:', err);
      return res.status(200).json({ message: 'Database error' });
    }

    if (result.affectedRows === 0) {
      return res.status(200).json({ message: 'Blocked not found' });
    }

    return res.status(200).json({ message: 'Status updated successfully' });
  });
});

router.get('/feedback',requireAdmin, (req, res) => {
  db.query('SELECT * FROM Grievance ORDER BY created_at DESC;', (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(200).send('Database error');
    }
    res.render('feedback', { users: results });
  });
});

router.patch('/grievance/:id/status',requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  db.query('UPDATE grievance SET status = ? WHERE id = ?', [status, id], (err) => {
    if (err) {
      console.error('Error updating user status:', err);
      return res.status(500).json({ success: false, message: 'Failed to update status' });
    }
    res.json({ success: true, message: 'Status updated successfully' });
  });
});
router.get('/viewgrievance/:id', requireAdmin, (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(200).json({ success: false, message: 'Valid ID is required' });
  }

  const query = `
   SELECT g.*, v.name AS vendor_name
FROM Grievance g
LEFT JOIN vendors v ON g.vendor_id = v.id
WHERE g.id = ?;
  `;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('DB Error fetching profile:', err);
      return res.status(200).json({ success: false, message: 'Database error', error: err });
    }

    if (results.length === 0) {
      return res.status(200).json({ success: false, message: 'Payment not found' });
    }
  console.log(results);
    res.render('viewgrievance', {
  user: results[0],
  base_url
});

  });
});

router.get('/payment-status', (req, res) => {
  const { status, reason } = req.query;
  res.render('payment-status', { status, reason });
});


module.exports = router;