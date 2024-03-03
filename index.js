const express = require("express");
const path = require("path");
const app = express();
const axios = require("axios");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const userModel = require("./model/user");
const userRoute = require("./router/userRoute");
require("./connection/conn");
const PORT = process.env.PORT;
const auth = require("./middleware/auth");

const staticPath = path.resolve("./public");
const viewsPath = path.resolve("./views");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(auth);
app.use(express.static(staticPath));
app.set("view engine", "ejs");
app.set("views", viewsPath);

app.use("/", userRoute);

app.get("/", (req, res) => {
  res.render("login");
});

app.get("/register", auth, (req, res) => {
  res.render("register");
});

app.get("/booking", auth, (req, res) => {
  res.render("booking");
});

app.get("/routing", auth, (req, res) => {
  res.render("routing");
});

app.get("/contact", (req, res) => {
  res.render("contact");
});

app.get("/reset", (req, res) => {
  res.render("resetPassword");
});

app.get("/profile", auth, async (req, res) => {
  let id = req.user._id;
  const data = await userModel.findOne({ _id: id });
  res.json(data);
});

app.get("/signout", auth, (req, res) => {
  let id = req.user._id;
  res.clearCookie("jwt");
  res.redirect("/");
});

app.get("/current-location", auth, async (req, res) => {
  try {
    const response = await axios.get("http://ipinfo.io/json");
    const locationData = response.data;
    res.json(locationData);
  } catch (error) {
    console.error("Error fetching current location:", error);
    res.status(500).send("Error fetching current location");
  }
});

app.post("/reset", async (req, res) => {
  const email = req.body.email;
  const oldPassword = req.body.opassword;
  const newPassword = req.body.npassword;
  console.log(req.body);
  try {
    const user = await userModel.findOne({ email });

    if (user) {
      console.log("User found:", user);
      console.log("Old Password:", oldPassword);
      console.log("New Password:", newPassword);

      const passwordMatch = await bcrypt.compare(oldPassword, user.password);

      if (passwordMatch) {
        user.password = await bcrypt.hash(newPassword, 10);

        // Save the existing user object with the updated password
        await user.save();
        console.log("Password updated successfully");
        res.status(200).json({ message: "Password updated successfully" });
      } else {
        // No match found
        console.log("Invalid email or old password");
        res.status(401).json({ message: "Invalid email or old password" });
      }
    } else {
      // No user found
      console.log("User not found");
      res.status(401).json({ message: "Invalid email or old password" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/addPatientdata", auth, async (req, res) => {
  try {
    const { location, symptoms } = req.body;
    console.log(location);
    const userId = req.user._id;
    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      {
        $push: {
          "requestData.request.locations": location,
          "requestData.request.symptoms": symptoms,
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error adding patient data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const getNearestHospital = async (lat, lng) => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
      {
        params: {
          location: `${lat},${lng}`,
          radius: 5000,
          keyword: "hospital",
          key: "AIzaSyAgdbAN9IV7CB9kFDCJlZpC-2U0YPLUlbc",
        },
      }
    );

    const hospitals = response.data.results;

    if (!hospitals || hospitals.length === 0) {
      console.log("Could not find any nearby hospitals");
      return null;
    }

    const nearestHospital = hospitals.reduce(
      (min, hospital) => {
        const distance = calculateDistance(
          { lat, lng },
          hospital.geometry.location
        );
        return distance < min.distance ? { hospital, distance } : min;
      },
      { hospital: null, distance: Infinity }
    );

    return nearestHospital.hospital;
  } catch (error) {
    console.error(`Error finding nearest hospital: ${error}`);
    return null;
  }
};

const calculateDistance = (location1, location2) => {
  const rad = Math.PI / 180;
  const lat1 = location1.lat * rad;
  const lon1 = location1.lng * rad;
  const lat2 = location2.lat * rad;
  const lon2 = location2.lng * rad;

  const dlat = lat2 - lat1;
  const dlon = lon2 - lon1;

  const a =
    Math.sin(dlat / 2) * Math.sin(dlat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) * Math.sin(dlon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = 6371 * c;

  return distance;
};

app.get("/get_nearest_hospital", auth, async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);

    const location = { lat, lng };

    const nearestHospitalResult = await getNearestHospital(lat, lng);

    if (!nearestHospitalResult) {
      return res
        .status(404)
        .json({ error: "Could not find a nearby hospital" });
    }

    const hospitalDetails = {
      name: nearestHospitalResult.name,
      address: nearestHospitalResult.vicinity,
      place_id: nearestHospitalResult.place_id,
      rating: nearestHospitalResult.rating || "N/A",
      types: nearestHospitalResult.types || [],
      location: {
        lat: nearestHospitalResult.geometry.location.lat,
        lng: nearestHospitalResult.geometry.location.lng,
      },
    };

    return res.json({ nearest_hospital: hospitalDetails });
  } catch (error) {
    console.error(`Error processing request: ${error}`);
    return res
      .status(400)
      .json({ error: `Error processing request: ${error}` });
  }
});

app.listen(8000, () => {
  console.log(`Server is running on http://localhost:8000`);
});
