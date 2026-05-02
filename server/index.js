const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI in .env file.");
  process.exit(1);
}

// Connect to MongoDB Atlas
mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  })
  .then(() => console.log("DB Connected! 🎉"))
  .catch((err) => console.log("DB Connection Error: ", err));

// Expense schema definition
const ExpenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const Expense = mongoose.model("Expense", ExpenseSchema);

// Test route
app.get("/", (req, res) => {
  res.send("Expense Tracker backend is running.");
});

// GET /expenses - retrieve all expense records
app.get("/expenses", async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ createdAt: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch expenses.",
      details: err.message,
    });
  }
});

// POST /expenses - create a new expense record
app.post("/expenses", async (req, res) => {
  try {
    const { title, category, amount, date, description } = req.body;

    if (!title || !category || amount === undefined || !date) {
      return res.status(400).json({
        error: "Title, category, amount, and date are required.",
      });
    }

    const newExpense = new Expense({
      title,
      category,
      amount,
      date,
      description,
    });

    await newExpense.save();
    res.status(201).json(newExpense);
  } catch (err) {
    res.status(400).json({
      error: "Failed to create expense.",
      details: err.message,
    });
  }
});

// PUT /expenses/:id - update an existing expense record by ID
app.put("/expenses/:id", async (req, res) => {
  try {
    const updatedExpense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedExpense) {
      return res.status(404).json({
        error: "Expense not found.",
      });
    }

    res.json(updatedExpense);
  } catch (err) {
    res.status(400).json({
      error: "Failed to update expense.",
      details: err.message,
    });
  }
});

// DELETE /expenses/:id - remove an expense record by ID
app.delete("/expenses/:id", async (req, res) => {
  try {
    const deletedExpense = await Expense.findByIdAndDelete(req.params.id);

    if (!deletedExpense) {
      return res.status(404).json({
        error: "Expense not found.",
      });
    }

    res.json({
      message: "Deleted successfully.",
      deletedExpense,
    });
  } catch (err) {
    res.status(500).json({
      error: "Failed to delete expense.",
      details: err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});
