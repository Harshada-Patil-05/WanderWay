if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");

const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");

const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

// ------------------ VIEW ENGINE ------------------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

// ------------------ MIDDLEWARE ------------------
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// ------------------ SESSION ------------------
const dbUrl = process.env.ATLASDB_URL;

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
});


store.on("error" , (err)=>{
    console.log("ERROR  in MONGO SESSION STORE" , err );
});

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

app.use(session(sessionOptions));
app.use(flash());

// ------------------ PASSPORT ------------------
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ------------------ LOCALS (VERY IMPORTANT) ------------------
app.use((req, res, next) => {
    res.locals.successMsg = req.flash("success");
    res.locals.errorMsg = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// ------------------ ROUTES ------------------
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/reviews.js");
const userRouter = require("./routes/user.js");
const messageRoutes = require("./routes/messages.js");

// app.get("/", (req, res) => {
//     res.send("Hi, I am root");
// });

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/messages", messageRoutes);
app.use("/", userRouter);

// ------------------ DATABASE ------------------

async function main() {
    await mongoose.connect(dbUrl);
    console.log("Connected successfully!");
    console.log("Connected DB name:", mongoose.connection.name);
}
main().catch(err => console.log(err));

// ------------------ 404 HANDLER ------------------
app.use((req, res, next) => {
    next(new ExpressError(404, "Page not found"));
});

// ------------------ ERROR HANDLER ------------------
app.use((err, req, res, next) => {
    let { status = 500, message = "Something went wrong!" } = err;
    res.status(status).render("listings/error.ejs", { message });
});

// ------------------ SERVER ------------------
app.listen(3000, () => {
    console.log("Server is listening on port 3000");
});
