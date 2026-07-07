const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const flash = require("connect-flash");
const path = require("path");
const methodOverride = require("method-override");

const app = express();
const port = 8080;

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Anmol@123",
    database: "ecommerce_db"
});

db.connect((err) => {
    if (err) { console.error("DB connection failed:", err.message); process.exit(1); }
    console.log("Connected to MySQL database.");
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(session({
    secret: "ecommerce_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));
app.use(flash());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currentUser = req.session.user || null;
    next();
});

const isLoggedIn = (req, res, next) => {
    if (!req.session.user) {
        req.flash("error", "Please log in first.");
        return res.redirect("/login");
    }
    next();
};


app.get("/", (req, res) => {
    db.query("SELECT * FROM products", (err, products) => {
        if (err) return res.status(500).send("DB error: " + err.message);
        res.render("home", { products });
    });
});

app.get("/register", (req, res) => res.render("register"));

app.post("/register", async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        req.flash("error", "All fields are required.");
        return res.redirect("/register");
    }
    try {
        const hash = await bcrypt.hash(password, 10);
        db.query(
            "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
            [username, email, hash],
            (err) => {
                if (err) {
                    req.flash("error", err.code === "ER_DUP_ENTRY" ? "Email or username already exists." : "Registration failed.");
                    return res.redirect("/register");
                }
                req.flash("success", "Registered successfully! Please log in.");
                res.redirect("/login");
            }
        );
    } catch (e) {
        req.flash("error", "Something went wrong.");
        res.redirect("/register");
    }
});

app.get("/login", (req, res) => res.render("login"));

app.post("/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        req.flash("error", "All fields are required.");
        return res.redirect("/login");
    }
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
        if (err || results.length === 0) {
            req.flash("error", "Invalid email or password.");
            return res.redirect("/login");
        }
        const user = results[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            req.flash("error", "Invalid email or password.");
            return res.redirect("/login");
        }
        req.session.user = { id: user.id, username: user.username, email: user.email };
        req.flash("success", `Welcome back, ${user.username}!`);
        res.redirect("/");
    });
});


app.post("/logout", (req, res) => {
    req.session.destroy(() => res.redirect("/login"));
});


app.get("/products/:id", (req, res) => {
    db.query("SELECT * FROM products WHERE id = ?", [req.params.id], (err, results) => {
        if (err || results.length === 0) return res.status(404).send("Product not found.");
        res.render("product", { product: results[0] });
    });
});


app.get("/cart", isLoggedIn, (req, res) => {
    const cart = req.session.cart || [];
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    res.render("cart", { cart, total });
});

app.post("/cart/add", isLoggedIn, (req, res) => {
    const { product_id, name, price, quantity } = req.body;
    if (!req.session.cart) req.session.cart = [];
    const cart = req.session.cart;
    const existing = cart.find((i) => i.product_id == product_id);
    if (existing) {
        existing.quantity += parseInt(quantity) || 1;
    } else {
        cart.push({ product_id, name, price: parseFloat(price), quantity: parseInt(quantity) || 1 });
    }
    req.session.save(() => {
        req.flash("success", `${name} added to cart.`);
        res.redirect("/cart");
    });
});

app.post("/cart/remove", isLoggedIn, (req, res) => {
    const { product_id } = req.body;
    req.session.cart = (req.session.cart || []).filter((i) => i.product_id != product_id);
    req.session.save(() => res.redirect("/cart"));
});

app.post("/orders", isLoggedIn, (req, res) => {
    const cart = req.session.cart || [];
    if (cart.length === 0) {
        req.flash("error", "Your cart is empty.");
        return res.redirect("/cart");
    }
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const userId = req.session.user.id;

    db.query(
        "INSERT INTO orders (user_id, total, status) VALUES (?, ?, 'confirmed')",
        [userId, total],
        (err, result) => {
            if (err) { req.flash("error", "Order failed: " + err.message); return res.redirect("/cart"); }
            const orderId = result.insertId;
            const items = cart.map((i) => [orderId, i.product_id, i.quantity, i.price]);
            db.query("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?", [items], (err2) => {
                if (err2) { req.flash("error", "Order failed: " + err2.message); return res.redirect("/cart"); }
                req.session.cart = [];
                req.session.save(() => {
                    req.flash("success", "Order placed successfully!");
                    res.redirect("/orders");
                });
            });
        }
    );
});

app.get("/orders", isLoggedIn, (req, res) => {
    db.query(
        `SELECT o.id, o.total, o.status, o.created_at,
                GROUP_CONCAT(p.name SEPARATOR ', ') AS items
         FROM orders o
         LEFT JOIN order_items oi ON o.id = oi.order_id
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE o.user_id = ?
         GROUP BY o.id ORDER BY o.created_at DESC`,
        [req.session.user.id],
        (err, orders) => {
            if (err) return res.status(500).send("DB error: " + err.message);
            res.render("orders", { orders });
        }
    );
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});