const express = require("express");
const colors = require("colors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const connectDB = require("./config/db");

// env config
const envPath = fs.existsSync(path.join(__dirname, ".env"))
  ? path.join(__dirname, ".env")
  : path.join(__dirname, "../.env");
dotenv.config({ path: envPath });

connectDB();

const app = express();

app.use(express.json());
app.use(morgan("dev"));
app.use(cors({ origin: "*" }));

app.get("/", (req, res) => {
  res.send("<h1>Doctor-Appointment-Application System Server</h1>");
});

app.use("/api/v1/user", require("./routes/userRoutes"));
app.use("/api/v1/admin", require("./routes/adminRoutes"));
app.use("/api/v1/doctor", require("./routes/doctorRoutes"));

// Serve frontend build when deployed together (optional - for monolithic deployment)
const clientBuildPath = path.join(__dirname, "../client/build");
if (process.env.NODE_ENV === "production" && fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
}

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(
    `Server Running in ${process.env.NODE_ENV || "development"} Mode on port ${port}`.bgCyan.white
  );
});
