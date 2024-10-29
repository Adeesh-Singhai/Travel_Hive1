// controllers/listing.js
const Listing = require("../models/listing");
const { cloudinary } = require("../cloudConfig");

module.exports.index = async (req, res, next) => {
  try {
    const allListings = await Listing.find({});
    res.render("listings/index", { allListings });
  } catch (err) {
    console.error("Error fetching listings:", err);
    next(err);
  }
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.createListing = async (req, res, next) => {
  try {
    const listingData = req.body.listing;
    
    // Process uploaded files
    if (req.files && req.files.length > 0) {
      listingData.images = req.files.map(file => ({
        url: file.path,
        filename: file.filename
      }));
    }
    
    const newListing = new Listing(listingData);
    newListing.owner = req.user._id;
    await newListing.save();
    
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
  } catch (err) {
    console.error("Error creating listing:", err);
    next(err);
  }
};

module.exports.showListing = async (req, res, next) => {
  try {
    let { id } = req.params;
    const listing = await Listing.findById(id)
      .populate({ path: "reviews", populate: { path: "author" } })
      .populate("owner");
    
    if (!listing) {
      req.flash("error", "Listing you requested does not exist");
      return res.redirect("/listings");
    }
    
    res.render("listings/show.ejs", { listing });
  } catch (err) {
    console.error("Error fetching listing:", err);
    next(err);
  }
};

module.exports.editListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    
    if (!listing) {
      req.flash("error", "Listing you requested does not exist");
      return res.redirect("/listings");
    }
    
    res.render("listings/edit.ejs", { listing });
  } catch (err) {
    console.error("Error fetching listing for edit:", err);
    next(err);
  }
};

module.exports.updateListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const listingData = req.body.listing;
    
    // Find the listing first
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing not found");
      return res.redirect("/listings");
    }

    // Handle image deletions if any images were marked for deletion
    if (req.body.deleteImages && req.body.deleteImages.length > 0) {
      // Delete images from cloudinary
      for (let filename of req.body.deleteImages) {
        await cloudinary.uploader.destroy(filename);
      }
      // Remove deleted images from the listing
      await listing.updateOne({
        $pull: { images: { filename: { $in: req.body.deleteImages } } }
      });
    }

    // Add new images if any were uploaded
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        url: file.path,
        filename: file.filename
      }));
      listing.images.push(...newImages);
    }

    // Update other listing fields
    listing.title = listingData.title;
    listing.description = listingData.description;
    listing.price = listingData.price;
    listing.location = listingData.location;
    listing.country = listingData.country;

    await listing.save();
    
    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
  } catch (error) {
    console.error("Error updating listing:", error);
    req.flash("error", "Error updating listing");
    res.redirect(`/listings/${id}/edit`);
  }
};

module.exports.deleteListing = async (req, res, next) => {
  const { id } = req.params;
  
  try {
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing not found");
      return res.redirect("/listings");
    }

    // Delete images from cloudinary
    for (let image of listing.images) {
      await cloudinary.uploader.destroy(image.filename);
    }

    // Delete the listing
    await Listing.findByIdAndDelete(id);
    
    req.flash("success", "Listing and associated reviews successfully deleted!");
    res.redirect("/listings");
  } catch (err) {
    console.error("Error deleting listing:", err);
    req.flash("error", "Error deleting listing");
    res.redirect("/listings");
  }
};