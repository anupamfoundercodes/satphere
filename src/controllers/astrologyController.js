import axios from "axios";

const API_KEY = process.env.ASTRO_API_KEY

export const matchMaking = async (req, res) => {
  try {
    const { female, male, config ,user_id} = req.body;

    if (!female || !male || !config) {
      return res.status(400).json({
        success: false,
        message: "female, male and  config fields is required",
      });
    }

    const apiResponse = await axios.post(
      "https://json.freeastrologyapi.com/match-making/ashtakoot-score",
      {
        female,
        male,
        config,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ASTRO_API_KEY, // <-- इसे .env में रखें
        },
      }
    );

    return res.status(200).json({
      data: apiResponse.data,
    });

  } catch (error) {
    console.log("Match Making API Error:", error);
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};
