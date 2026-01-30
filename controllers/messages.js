const Message = require("../models/messages");
const User = require("../models/user");

module.exports.renderContactForm = async (req, res) => {
  const host = await User.findById(req.params.id);
  res.render("messages/contact.ejs", { host });
};

module.exports.sendMessage = async (req, res) => {
  const { message, listingId } = req.body;

  if (!listingId) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  const newMessage = new Message({
    from: req.user._id,
    to: req.params.id,
    content: message
  });

  await newMessage.save();

  req.flash("success", "Message sent to host!");
  res.redirect(`/listings/${listingId}`);
};


