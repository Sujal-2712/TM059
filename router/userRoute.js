const express = require("express");
const userModel = require("../model/user");
const hospitalModel = require("../model/hospital");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const auth=require('./../middleware/auth');


router.get("/userDashboard",auth,(req,res)=>{
  res.render("userIndex");
})


router.get("/hospitalDashboard",(req,res)=>{
  res.render("hospitalIndex");
})

router.get("/registerHospital", async (req, res) => {
  res.render("registerHospital");
});


router.post("/login", async (req, res) => {
  const role = req.body.role;

  if (role === "user") {
    await userLogin(req, res);
  } else {
    await hospitalLogin(req, res);
  }
});

router.post("/register", async (req, res) => {
  console.log(req.body);
  const { name, email, phone, password, cpassword } = req.body;

  // Validate and sanitize input data
  if (!name || !email || !phone || !password || !cpassword) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (password !== cpassword) {
    return res
      .status(400)
      .json({ message: "The passwords you entered do not match." });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = new userModel({
      name,
      email,
      phone,
      password: hashedPassword,
      
    });

    const data = await user.save();
    res.redirect("/");
  } catch (error) {
    res.status(500).json({ message: error.message, error: 1 });
  }
});


router.post("/registerHospital", async (req, res) => {
  console.log(req.body);
  try {
    const { name, address, hospitalID, hospitalEmail, password } = req.body;

    if (!name || !address || !hospitalID || !hospitalEmail || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const existingHospital = await hospitalModel.findOne({
      $or: [{ hospitalID: hospitalID }, { hospitalEmail: hospitalEmail }],
    });

    if (existingHospital) {
      return res
        .status(400)
        .json({ message: "Hospital ID or Email already exists." });
    }

    // Create a new hospital instance
    const hospital = new hospitalModel({
      name,
      address,
      hospitalID,
      hospitalEmail,
      password: hashedPassword,
      isAdmin: true,
    });

    //
    const savedHospital = await hospital.save();

    res.status(201).json({
      message: "Hospital created successfully.",
      hospital: savedHospital,
    });
  } catch (error) {
    console.error("Error during hospital creation:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

async function userLogin(req, res) {
  const email = req.body.email;
  const password = req.body.password;
  console.log(req.body);
  try {
    const data = await userModel.findOne({ email: email });
    if (!data) {
      return res.json({ message: "Invalid ID or Password", error: 1 });
    }
    const match = await bcrypt.compare(password, data.password);
    console.log("Password Match:", match);

    console.log(data.password);

    if (match) {
      const token = jwt.sign({ _id: data._id.toString() }, "sujalhellowolrdon");

      console.log("Generated Token:", token);

      res.cookie("jwt", token);
      res.redirect("/userDashboard");
    } else {
      res.json({ message: "Invaild ID or Password", error: 1 });
    }
  } catch (e) {
    console.error("Error during login:", e);
    res.json({ message: "Invaild ID or Password", error: 1 });
  }
}

async function hospitalLogin(req, res) {
  const email = req.body.email;
  const password = req.body.password;
  console.log(req.body);
  try {
    const data = await hospitalModel.findOne({ hospitalEmail: email });
    console.log(data);
    if (!data) {
      return res.json({ message: "Invalid ID or Password", error: 1 });
    }
    const match = await bcrypt.compare(password, data.password);
    console.log("Password Match:", match);

    console.log(data.password);

    if (match) {
      const token = jwt.sign({ _id: data._id.toString() }, "sujalhellowolrdon");

      console.log("Generated Token:", token);

      res.cookie("jwt", token);
      res.redirect("/hospitalDashboard");
    } else {
      res.json({ message: "Invaild ID or Password", error: 1 });
    }
  } catch (e) {
    console.error("Error during login:", e);
    res.json({ message: "Invaild ID or Password", error: 1 });
  }
}

module.exports = router;
