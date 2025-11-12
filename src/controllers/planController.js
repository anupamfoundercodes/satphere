import { pool } from "../config/db.js";



export const planlist = async (req, res) => {
  try {
    const { type } = req.body;

    if (!type) {
      return res.status(200).json({ 
        success: false, 
        message: "type is required", 
        data: [] 
      });
    }
    if (!["1", 1].includes(type)) {
      return res.status(200).json({
        success: false,
        message: "Type must be 1 plans",
        data: []
      });
    }
    const query = `SELECT * FROM plans`;
    const [rows] = await pool.query(query);

    if (rows.length === 0) {
      return res.status(200).json({
        success: false,
        message: `No plans found for type ${type}`,
        data: []
      });
    }

    // Parse perks JSON & group by name
    const groupedPlans = {};
rows.forEach((plan) => {
  try {
    plan.perks = JSON.parse(plan.perks);
  } catch (e) {
    plan.perks = {};
  }

  // ✅ Convert description string to array
  if (plan.description) {
    // split by newlines or commas, ya agar tumhare DB me '\n' se separate hai to use
    plan.description = plan.description
      .split(/\r?\n/)       // newlines ke liye
      .map(d => d.trim())   // extra spaces remove
      .filter(d => d);      // empty strings remove
  } else {
    plan.description = [];
  }

  if (!groupedPlans[plan.name]) {
    groupedPlans[plan.name] = [];
  }

  groupedPlans[plan.name].push(plan);
});



// Flatten all plans into a single array
const plansArray = [];
Object.values(groupedPlans).forEach(plans => {
  plansArray.push(...plans);
});

return res.status(200).json({
  success: true,
  message: "Plan list fetched successfully",
  data: plansArray
});


   } catch (err) {
    console.error("Plan List API Error:", err);
    return res.status(200).json({ 
      success: false, 
      message: "Server error", 
      data: [] 
    });
  }
};


// export const userPayments = async (req, res) => {
//   try {
//     const { user_id } = req.body;

//     // ---- Validation ----
//     if (!user_id) {
//       return res.status(200).json({
//         success: false,
//         message: "user_id is required",
//         data: []
//       });
//     }

//     // ---- Query ----
//     const [rows] = await pool.query(
//       `SELECT *
//       FROM payments
//       WHERE user_id = ?
//          AND status = 'success'
//          AND expire_at >= NOW()
//       ORDER BY created_at DESC`,
//       [user_id]
//     );

//     // ---- Response ----
//     return res.status(200).json({
//       success: true,
//       message: "Active payments fetched successfully",
//       data: rows
//     });

//   } catch (error) {
//     console.error("DB Error:", error);
//     return res.status(200).json({
//       success: false,
//       message: "Internal server error",
//       data: []
//     });
//   }
// };

export const userPayments = async (req, res) => {
  try {
    const { user_id } = req.body;

    // ---- Validation ----
    if (!user_id) {
      return res.status(200).json({
        success: false,
        message: "user_id is required",
        data: []
      });
    }

    // ---- Query user active payments ----
    let [rows] = await pool.query(
      `SELECT *
       FROM payments
       WHERE user_id = ?
         AND status = 'success'
         AND expire_at >= NOW()
       ORDER BY created_at DESC`,
      [user_id]
    );

    if (rows.length === 0) {
      // User ke paas active payment nahi → fetch plan id = 5
      const [planRows] = await pool.query(
        `SELECT *
         FROM plans
         WHERE id = 5
         LIMIT 1`
      );

      if (planRows.length) {
        const plan = planRows[0];

        // perks ko JSON.parse karke alag fields me dal do
        let perks = {};
        try {
          perks = JSON.parse(plan.perks);
        } catch (e) {
          perks = {};
        }

        // free/default payment object
        rows = [{
          id: 0,
          user_id,
          plan_id: plan.id,
          order_id: null,
          payment_id: null,
          signature: null,
          amount: plan.price,
          currency: "INR",
          status: "success",
          gateway_type: "manual",
          created_at: new Date(),
          expire_at: new Date(new Date().setDate(new Date().getDate() + plan.days)),
          day: plan.days,
          Filter_Both: perks["Filter-Both"]?.toString() || "false",
          Filter_Gender: perks["Filter-Gender"]?.toString() || "false",
          Filter_Region: perks["Filter-Region"]?.toString() || "false",
          No_Ads: perks["No Ads"]?.toString() || "false",
          Rear_Camra: perks["Rear Camra"]?.toString() || "false"
        }];
      }
    }

    // ---- Response ----
    return res.status(200).json({
      success: true,
      message: "Active payments fetched successfully",
      data: rows
    });

  } catch (error) {
    console.error("DB Error:", error);
    return res.status(200).json({
      success: false,
      message: "Internal server error",
      data: []
    });
  }
};


export const updateUserAdsCount = async (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(200).json({
      success: false,
      message: "User ID is required",
    });
  }

  try {
    // Get user ads_count
    const [userRows] = await pool.query(
      "SELECT ads_count FROM users WHERE id = ?",
      [user_id]
    );

    if (userRows.length === 0) {
      return res.status(200).json({
        success: false,
        message: "User not found",
      });
    }

    let userAds = userRows[0].ads_count;

    // Get admin ads_count (assuming single admin)
    const [adminRows] = await pool.query(
      "SELECT ads_count FROM admin LIMIT 1"
    );
    const adminAds = adminRows[0]?.ads_count || 0;

    let newAdsCount;

    if (userAds >= adminAds) {
      newAdsCount = 0;
    } else {
      newAdsCount = userAds + 1;
    }

    // Update users table
    await pool.query(
      "UPDATE users SET ads_count = ? WHERE id = ?",
      [newAdsCount, user_id]
    );

    return res.status(200).json({
      success: true,
      message: "User ads_count updated",
      ads_count: newAdsCount,
    });
  } catch (err) {
    console.error("User ads_count error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const userPlanUpdate = async (req, res) => {
  try {
    const {
      payment_id,
      Filter_Both,
      Filter_Gender,
      Filter_Region,
      No_Ads,
      Rear_Camra
    } = req.body;

    if (!payment_id) {
      return res.status(200).json({
        success: false,
        message: "payment_id is required",
        affectedRows: 0,
      });
    }

    // ---- Fetch current payment row ----
    const [rows] = await pool.query("SELECT * FROM payments WHERE id = ?", [payment_id]);
    if (!rows.length) {
      return res.status(200).json({
        success: false,
        message: "Payment not found",
        affectedRows: 0,
      });
    }

    const current = rows[0];
    const fields = [];
    const params = [];

    // ---- Helper function for update rules ----
    const processField = (fieldName, value) => {
      if (value !== true) return; // सिर्फ true वाले ही process करो

      let currentValue = current[fieldName];

      // अगर currentValue number है (string number भी चलेगा)
      if (!isNaN(currentValue) && currentValue !== null) {
        currentValue = parseInt(currentValue, 10);

        if (currentValue > 1) {
          fields.push(`${fieldName} = ?`);
          params.push(currentValue - 1);
        } else if (currentValue == 1) {
          // अगर value 1 है → false update करो
          fields.push(`${fieldName} = ?`);
          params.push("false");
        }
      }
      // अगर पहले से boolean true/false है → skip
    };

    processField("Filter_Both", Filter_Both);
    processField("Filter_Gender", Filter_Gender);
    processField("Filter_Region", Filter_Region);
    processField("No_Ads", No_Ads);
    processField("Rear_Camra", Rear_Camra);

    if (fields.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No changes needed",
        affectedRows: 0,
      });
    }

    const query = `UPDATE payments SET ${fields.join(", ")} WHERE id = ?`;
    params.push(payment_id);

    const [result] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      message: "Payment updated successfully",
      affectedRows: result.affectedRows,
    });

  } catch (err) {
    console.error("DB Error userPlanUpdate:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      affectedRows: 0,
    });
  }
};












