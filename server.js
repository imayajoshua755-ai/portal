
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const pg = require("pg");
const PgSession = require("connect-pg-simple")(session);
const path = require("path");

const app = express();

app.set("trust proxy", 1);
app.use(express.json());

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false
});

app.use(session({
  store: new PgSession({
    pool,
    tableName: "user_sessions",
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(express.static(path.join(__dirname, "public")));

async function setupDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

function requireLogin(req, res, next) {
  if (!req.session.studentId) {
    return res.status(401).json({
      message: "Please log in first"
    });
  }
  next();
}

// REGISTER STUDENT
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must have at least 8 characters"
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        message: "Enter a valid email address"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO students (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [name.trim(), cleanEmail, hashedPassword]
    );

    req.session.studentId = result.rows[0].id;

    res.status(201).json({
      message: "Registration successful",
      student: result.rows[0]
    });

  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "This email is already registered"
      });
    }

    console.error(error);
    res.status(500).json({
      message: "Registration failed"
    });
  }
});

// LOGIN STUDENT
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Enter your email and password"
      });
    }

    const result = await pool.query(
      "SELECT * FROM students WHERE email = $1",
      [email.trim().toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Incorrect email or password"
      });
    }

    const student = result.rows[0];

    const validPassword = await bcrypt.compare(
      password,
      student.password
    );

    if (!validPassword) {
      return res.status(401).json({
        message: "Incorrect email or password"
      });
    }

    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({
          message: "Login failed"
        });
      }

      req.session.studentId = student.id;

      res.json({
        message: "Login successful",
        student: {
          id: student.id,
          name: student.name,
          email: student.email
        }
      });
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Something went wrong"
    });
  }
});

// STUDENT DASHBOARD INFORMATION
app.get("/api/me", requireLogin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email FROM students WHERE id = $1",
      [req.session.studentId]
    );

    if (!result.rows.length) {
      return res.status(401).json({
        message: "Student account not found"
      });
    }

    res.json({ student: result.rows[0] });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Unable to load dashboard"
    });
  }
});

// LOGOUT
app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        message: "Logout failed"
      });
    }

    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
});

const PORT = process.env.PORT || 3000;

setupDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Student portal running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database setup failed:", error);
    process.exit(1);
  });
