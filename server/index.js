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

// Helper functions

const formatUser = (user) => {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
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
    const { username, email, password } = req.body;

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

    if (!user || !user.isActive) {
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
    const { username, email } = req.body;

    if (!username || !email) {
      return res.status(400).json({
        error: "Username and email are required.",
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
    await User.findByIdAndUpdate(req.user._id, {
      isActive: false,
    });

    await createActivityLog(req.user._id, "DELETE_ACCOUNT", "User deactivated their own account.");

    return res.json({
      message: "Account deactivated successfully.",
    });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to delete account.",
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
    const users = await User.find().select("-passwordHash").sort({ createdAt: -1 });

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

    if (role && !["user", "admin"].includes(role)) {
      return res.status(400).json({
        error: "Role must be either user or admin.",
      });
    }

    const updateData = {};

    if (role !== undefined) {
      updateData.role = role;
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).select("-passwordHash");

    if (!updatedUser) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    await createActivityLog(
      req.user._id,
      "ADMIN_UPDATE_USER",
      `Admin updated user account: ${updatedUser.email}.`,
    );

    return res.json(updatedUser);
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

    const deletedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        isActive: false,
      },
      {
        new: true,
      },
    ).select("-passwordHash");

    if (!deletedUser) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    await createActivityLog(
      req.user._id,
      "ADMIN_DELETE_USER",
      `Admin deactivated user account: ${deletedUser.email}.`,
    );

    return res.json({
      message: "User deactivated successfully.",
      user: deletedUser,
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
    const activities = await ActivityLog.find()
      .populate("userId", "username email role")
      .sort({ createdAt: -1 });

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

    if (!title || !category || amount === undefined || !date) {
      return res.status(400).json({
        error: "Title, category, amount, and date are required.",
      });
    }

    const newExpense = new Expense({
      userId: req.user._id,
      title,
      category,
      amount,
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
    const updatedExpense = await Expense.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id,
      },
      req.body,
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

// Start server

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});
