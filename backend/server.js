const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const hederaRoutes = require("./routes/hederaRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/hedera", hederaRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Backend running on port"));
