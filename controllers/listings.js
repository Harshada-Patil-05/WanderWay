const Listing = require("../models/listing.js");
const axios = require("axios");

module.exports.index = async (req, res) => {
  const { category, search } = req.query;
  let query = {};
  let noResultsMessage = null;

  if (category) {
    query.category = category;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
      { country: { $regex: search, $options: "i" } }
    ];
  }

  const allListings = await Listing.find(query);

  if (allListings.length === 0 && (category || search)) {
    noResultsMessage = "No results found";
  }

  res.render("listings/index.ejs", {
    allListings,
    noResultsMessage
  });
};


module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};


module.exports.createListing = async (req, res) => {
    try {
        const amenities = req.body.listing.amenities || [];

        // validation: at least 10 amenities
        if (amenities.length < 10) {
            req.flash("error", "Please select at least 10 amenities");
            return res.redirect("/listings/new");
        }

        // Geocode location
        const geoResponse = await axios.get(
            `https://api.maptiler.com/geocoding/${req.body.listing.location}.json`,
            {
                params: {
                    key: process.env.MAPTILER_API_KEY,
                    limit: 1
                }
            }
        );

        if (!geoResponse.data.features.length) {
            req.flash("error", "Location not found");
            return res.redirect("/listings/new");
        }

        const geometry = geoResponse.data.features[0].geometry;

        // Create listing
        const newListing = new Listing(req.body.listing);
        newListing.owner = req.user._id;
        newListing.geometry = geometry;
        newListing.amenities = amenities; // SAVE AMENITIES

        // Image
        if (req.file) {
            newListing.image = {
                url: req.file.path,
                filename: req.file.filename
            };
        }

        await newListing.save();

        req.flash("success", "New Listing Created!");
        res.redirect("/listings");

    } catch (err) {
        console.log(err);
        req.flash("error", "Something went wrong");
        res.redirect("/listings/new");
    }
};


module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author",
            },
        })
        .populate("owner");
    if (!listing) {
        req.flash("error", "Listing does not exist!");
        return res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing });
};


module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing does not exist!");
        return res.redirect("/listings");
    }
    res.render("listings/edit.ejs", { listing });
};

module.exports.updateListing = async (req, res) => {
    try {
        const { id } = req.params;

        let listing = await Listing.findById(id);
        if (!listing) {
            req.flash("error", "Listing not found");
            return res.redirect("/listings");
        }

        // ✅ Correct amenities validation
        const amenities = req.body.listing.amenities || [];
        if (amenities.length < 10) {
            req.flash("error", "Please select at least 10 amenities");
            return res.redirect(`/listings/${id}/edit`);
        }

        // Re-geocode only if location changed
        if (req.body.listing.location !== listing.location) {
            const geoResponse = await axios.get(
                `https://api.maptiler.com/geocoding/${req.body.listing.location}.json`,
                {
                    params: {
                        key: process.env.MAPTILER_API_KEY,
                        limit: 1
                    }
                }
            );

            if (!geoResponse.data.features.length) {
                req.flash("error", "Invalid location");
                return res.redirect(`/listings/${id}/edit`);
            }

            listing.geometry = geoResponse.data.features[0].geometry;
        }

        // Update fields
        listing.title = req.body.listing.title;
        listing.description = req.body.listing.description;
        listing.price = req.body.listing.price;
        listing.country = req.body.listing.country;
        listing.location = req.body.listing.location;
        listing.category = req.body.listing.category;
        listing.amenities = amenities;

        // Update image
        if (req.file) {
            listing.image = {
                url: req.file.path,
                filename: req.file.filename
            };
        }

        await listing.save();

        req.flash("success", "Listing Updated!");
        res.redirect(`/listings/${id}`);

    } catch (err) {
        console.error(err);
        req.flash("error", "Something went wrong");
        res.redirect(`/listings/${req.params.id}/edit`);
    }
};


module.exports.deleteListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};


