const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { saveRedirectUrl  , isLoggedIn} = require("../middleware.js");
const messageController = require("../controllers/messages.js");


const userController = require("../controllers/users.js");
console.log("userController =", userController);

router.route("/signup")
    .get( userController.renderSignupForm)
    .post( wrapAsync(userController.signup));


router.route("/login")
    .get( userController.renderLoginForm)
    .post( saveRedirectUrl,
    passport.authenticate("local", { failureRedirect: "/login", failureFlash: true }), 
    userController.login);


router.get("/logout" , userController.logout);


// show contact host page
router.get("/users/:id/contact", isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { listingId } = req.query;

    const host = await User.findById(id);

    if (!host) {
        req.flash("error", "Host not found");
        return res.redirect("/listings");
    }

    res.render("messages/contact.ejs", { host, listingId });
}));

// send message to host
router.post(
  "/users/:id/contact",
  isLoggedIn,
  wrapAsync(messageController.sendMessage)
);

module.exports = router;