const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middleware");
const messages = require("../controllers/messages");

router.get("/users/:id/contact", isLoggedIn, messages.renderContactForm);
router.post("/users/:id/contact", isLoggedIn, messages.sendMessage);

module.exports = router;
