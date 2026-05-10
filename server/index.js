const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

const AVATAR_OPTIONS = ["blue", "purple", "green", "orange", "red", "navy"];

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI in .env file.");
  process.exit(1);
}

if (!JWT_SECRET) {
  console.error("Missing JWT_SECRET in .env file.");
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  })
  .then(() => console.log("DB Connected! 🎉"))
  .catch((err) => console.log("DB Connection Error:", err));

// MongoDB models

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      enum: AVATAR_OPTIONS,
      default: "blue",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", UserSchema, "users");

const ActivityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    details: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const ActivityLog = mongoose.model("ActivityLog", ActivityLogSchema, "user_activities");

const ExpenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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

const Expense = mongoose.model("Expense", ExpenseSchema, "expenses");

const BudgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    month: {
      type: String,
      required: true,
      trim: true,
    },
    limit: {
      type: Number,
      required: true,
      min: 0,
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// A user should only have one budget for the same month
BudgetSchema.index({ userId: 1, month: 1 }, { unique: true });

const Budget = mongoose.model("Budget", BudgetSchema, "budgets");

// Helper functions

const formatUser = (user) => {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    avatar: user.avatar || "blue",
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

const createToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: "2h",
    },
  );
};

const createActivityLog = async (userId, action, details = "") => {
  try {
    await ActivityLog.create({
      userId,
      action,
      details,
    });
  } catch (err) {
    console.error("Failed to create activity log:", err.message);
  }
};

const isValidBudgetMonth = (month) => {
  return /^\d{4}-\d{2}$/.test(month);
};

const isValidAvatar = (avatar) => {
  return AVATAR_OPTIONS.includes(avatar);
};

// Check if the user is logged in

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authentication token is required.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-passwordHash");

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: "Invalid or inactive user.",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      error: "Invalid or expired token.",
    });
  }
};

// Check if the user is an admin

const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      error: "Admin access is required.",
    });
  }

  next();
};

// Test route

app.get("/", (req, res) => {
  res.send("Expense Tracker backend is running.");
});

// Register and login routes

app.post("/auth/register", async (req, res) => {
  try {
    const { username, email, password, avatar } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        error: "Username, email, and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters.",
      });
    }

    if (avatar && !isValidAvatar(avatar)) {
      return res.status(400).json({
        error: "Invalid avatar selected.",
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        error: "Email is already registered.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userCount = await User.countDocuments();

    const newUser = new User({
      username,
      email: email.toLowerCase(),
      passwordHash,
      avatar: avatar || "blue",
      role: userCount === 0 ? "admin" : "user",
    });

    await newUser.save();

    await createActivityLog(newUser._id, "REGISTER", "User registered a new account.");

    const token = createToken(newUser);

    return res.status(201).json({
      message: "Registration successful.",
      token,
      user: formatUser(newUser),
    });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to register user.",
      details: err.message,
    });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password.",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        error: "Invalid email or password.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        error: "Your account has been disabled.",
      });
    }

    const token = createToken(user);

    await createActivityLog(user._id, "LOGIN", "User logged in.");

    return res.json({
      message: "Login successful.",
      token,
      user: formatUser(user),
    });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to login.",
      details: err.message,
    });
  }
});

app.post("/auth/logout", authenticateToken, async (req, res) => {
  try {
    await createActivityLog(req.user._id, "LOGOUT", "User logged out.");

    return res.json({
      message: "Logout recorded successfully.",
    });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to logout.",
      details: err.message,
    });
  }
});

// User profile routes

app.get("/users/me", authenticateToken, async (req, res) => {
  return res.json(req.user);
});

app.put("/users/me", authenticateToken, async (req, res) => {
  try {
    const { username, email, avatar } = req.body;

    if (!username || !email) {
      return res.status(400).json({
        error: "Username and email are required.",
      });
    }

    if (avatar && !isValidAvatar(avatar)) {
      return res.status(400).json({
        error: "Invalid avatar selected.",
      });
    }

    const emailOwner = await User.findOne({
      email: email.toLowerCase(),
      _id: { $ne: req.user._id },
    });

    if (emailOwner) {
      return res.status(409).json({
        error: "Email is already used by another account.",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        username,
        email: email.toLowerCase(),
        avatar: avatar || "blue",
      },
      {
        new: true,
        runValidators: true,
      },
    ).select("-passwordHash");

    await createActivityLog(req.user._id, "UPDATE_PROFILE", "User updated their profile.");

    return res.json(updatedUser);
  } catch (err) {
    return res.status(400).json({
      error: "Failed to update profile.",
      details: err.message,
    });
  }
});

app.delete("/users/me", authenticateToken, async (req, res) => {
  try {
    if (req.user.role === "admin") {
      return res.status(400).json({
        error: "Admin accounts cannot be deactivated from the profile page.",
      });
    }

    await User.findByIdAndUpdate(req.user._id, {
      isActive: false,
    });

    await createActivityLog(
      req.user._id,
      "DEACTIVATE_ACCOUNT",
      "User deactivated their own account.",
    );

    return res.json({
      message: "Account deactivated successfully.",
    });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to deactivate account.",
      details: err.message,
    });
  }
});

app.get("/users/me/activities", authenticateToken, async (req, res) => {
  try {
    const activities = await ActivityLog.find({
      userId: req.user._id,
    }).sort({
      createdAt: -1,
    });

    return res.json(activities);
  } catch (err) {
    return res.status(500).json({
      error: "Failed to fetch user activities.",
      details: err.message,
    });
  }
});

// Admin routes

app.get("/admin/users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-passwordHash").sort({
      createdAt: -1,
    });

    return res.json(users);
  } catch (err) {
    return res.status(500).json({
      error: "Failed to fetch users.",
      details: err.message,
    });
  }
});

app.put("/admin/users/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role, isActive } = req.body;

    if (role !== undefined) {
      return res.status(400).json({
        error: "User role cannot be changed from the admin panel.",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        error: "Active status is required.",
      });
    }

    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        error: "Admin cannot change their own account status here.",
      });
    }

    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    if (targetUser.role !== "user") {
      return res.status(400).json({
        error: "Only normal user accounts can be enabled or disabled.",
      });
    }

    targetUser.isActive = isActive;
    await targetUser.save();

    await createActivityLog(
      req.user._id,
      "ADMIN_UPDATE_USER_STATUS",
      `Admin ${isActive ? "enabled" : "disabled"} user account: ${targetUser.email}.`,
    );

    return res.json(targetUser);
  } catch (err) {
    return res.status(400).json({
      error: "Failed to update user.",
      details: err.message,
    });
  }
});

app.delete("/admin/users/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        error: "Admin cannot deactivate their own account here.",
      });
    }

    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    if (targetUser.role !== "user") {
      return res.status(400).json({
        error: "Only normal user accounts can be deactivated.",
      });
    }

    targetUser.isActive = false;
    await targetUser.save();

    await createActivityLog(
      req.user._id,
      "ADMIN_DELETE_USER",
      `Admin deactivated user account: ${targetUser.email}.`,
    );

    return res.json({
      message: "User deactivated successfully.",
      user: targetUser,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to delete user.",
      details: err.message,
    });
  }
});

app.get("/admin/activities", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const activities = await ActivityLog.find().populate("userId", "username email role").sort({
      createdAt: -1,
    });

    return res.json(activities);
  } catch (err) {
    return res.status(500).json({
      error: "Failed to fetch activity logs.",
      details: err.message,
    });
  }
});

// Expense routes

app.get("/expenses", authenticateToken, async (req, res) => {
  try {
    const expenses = await Expense.find({
      userId: req.user._id,
    }).sort({
      createdAt: -1,
    });

    return res.json(expenses);
  } catch (err) {
    return res.status(500).json({
      error: "Failed to fetch expenses.",
      details: err.message,
    });
  }
});

app.post("/expenses", authenticateToken, async (req, res) => {
  try {
    const { title, category, amount, date, description } = req.body;

    if (!title || !category || amount === undefined || amount === "" || !date) {
      return res.status(400).json({
        error: "Title, category, amount, and date are required.",
      });
    }

    const expenseAmount = Number(amount);

    if (!Number.isFinite(expenseAmount) || expenseAmount <= 0) {
      return res.status(400).json({
        error: "Amount must be greater than 0.",
      });
    }

    const newExpense = new Expense({
      userId: req.user._id,
      title,
      category,
      amount: expenseAmount,
      date,
      description,
    });

    await newExpense.save();

    await createActivityLog(req.user._id, "CREATE_EXPENSE", `Created expense: ${title}.`);

    return res.status(201).json(newExpense);
  } catch (err) {
    return res.status(400).json({
      error: "Failed to create expense.",
      details: err.message,
    });
  }
});

app.put("/expenses/:id", authenticateToken, async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (updateData.amount !== undefined) {
      const expenseAmount = Number(updateData.amount);

      if (!Number.isFinite(expenseAmount) || expenseAmount <= 0) {
        return res.status(400).json({
          error: "Amount must be greater than 0.",
        });
      }

      updateData.amount = expenseAmount;
    }

    const updatedExpense = await Expense.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id,
      },
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedExpense) {
      return res.status(404).json({
        error: "Expense not found.",
      });
    }

    await createActivityLog(
      req.user._id,
      "UPDATE_EXPENSE",
      `Updated expense: ${updatedExpense.title}.`,
    );

    return res.json(updatedExpense);
  } catch (err) {
    return res.status(400).json({
      error: "Failed to update expense.",
      details: err.message,
    });
  }
});

app.delete("/expenses/:id", authenticateToken, async (req, res) => {
  try {
    const deletedExpense = await Expense.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!deletedExpense) {
      return res.status(404).json({
        error: "Expense not found.",
      });
    }

    await createActivityLog(
      req.user._id,
      "DELETE_EXPENSE",
      `Deleted expense: ${deletedExpense.title}.`,
    );

    return res.json({
      message: "Deleted successfully.",
      deletedExpense,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to delete expense.",
      details: err.message,
    });
  }
});

// Budget routes

app.get("/budgets", authenticateToken, async (req, res) => {
  try {
    const budgets = await Budget.find({
      userId: req.user._id,
    }).sort({
      month: -1,
    });

    return res.json(budgets);
  } catch (err) {
    return res.status(500).json({
      error: "Failed to fetch budgets.",
      details: err.message,
    });
  }
});

app.post("/budgets", authenticateToken, async (req, res) => {
  try {
    const { month, limit, note } = req.body;

    if (!month || limit === undefined || limit === "") {
      return res.status(400).json({
        error: "Month and budget limit are required.",
      });
    }

    if (!isValidBudgetMonth(month)) {
      return res.status(400).json({
        error: "Month must use YYYY-MM format.",
      });
    }

    const budgetLimit = Number(limit);

    if (!Number.isFinite(budgetLimit) || budgetLimit <= 0) {
      return res.status(400).json({
        error: "Budget limit must be greater than 0.",
      });
    }

    const newBudget = new Budget({
      userId: req.user._id,
      month,
      limit: budgetLimit,
      note,
    });

    await newBudget.save();

    await createActivityLog(req.user._id, "CREATE_BUDGET", `Created budget for ${month}.`);

    return res.status(201).json(newBudget);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        error: "Budget for this month already exists.",
      });
    }

    return res.status(400).json({
      error: "Failed to create budget.",
      details: err.message,
    });
  }
});

app.put("/budgets/:id", authenticateToken, async (req, res) => {
  try {
    const { month, limit, note } = req.body;

    const updateData = {};

    if (month !== undefined) {
      if (!month || !isValidBudgetMonth(month)) {
        return res.status(400).json({
          error: "Month must use YYYY-MM format.",
        });
      }

      updateData.month = month;
    }

    if (limit !== undefined) {
      const budgetLimit = Number(limit);

      if (!Number.isFinite(budgetLimit) || budgetLimit <= 0) {
        return res.status(400).json({
          error: "Budget limit must be greater than 0.",
        });
      }

      updateData.limit = budgetLimit;
    }

    if (note !== undefined) {
      updateData.note = note;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: "No budget data provided.",
      });
    }

    const updatedBudget = await Budget.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id,
      },
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedBudget) {
      return res.status(404).json({
        error: "Budget not found.",
      });
    }

    await createActivityLog(
      req.user._id,
      "UPDATE_BUDGET",
      `Updated budget for ${updatedBudget.month}.`,
    );

    return res.json(updatedBudget);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        error: "Budget for this month already exists.",
      });
    }

    return res.status(400).json({
      error: "Failed to update budget.",
      details: err.message,
    });
  }
});

app.delete("/budgets/:id", authenticateToken, async (req, res) => {
  try {
    const deletedBudget = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!deletedBudget) {
      return res.status(404).json({
        error: "Budget not found.",
      });
    }

    await createActivityLog(
      req.user._id,
      "DELETE_BUDGET",
      `Deleted budget for ${deletedBudget.month}.`,
    );

    return res.json({
      message: "Budget deleted successfully.",
      deletedBudget,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to delete budget.",
      details: err.message,
    });
  }
});

// Start server

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});
