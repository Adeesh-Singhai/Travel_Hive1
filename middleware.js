const Listing = require("./models/listing");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema } = require("./schema.js");

const { reviewSchema } = require("./schema.js");


module.exports.isLoggedIn=((req,res,next)=>{
    // console.log(req.path,"..",req.originalUrl);
    
    if(!req.isAuthenticated()){
        //redirectURL save
        req.session.redirectURL = req.originalUrl;

        req.flash("error","You must be logged in to create a listing");
        return res.redirect("/login");
      }
      next();
}
) 

module.exports.saveRedirectURL=(req,res,next)=>{
if(req.session.redirectURL){
    res.locals.redirectURL = req.session.redirectURL;
}
next();
}


// module.exports.isOwner=async (req,res,next)=>{
//     const { id } = req.params;
    


//   let listing = await Listing.findById(id);
//   if(!req.user._id.equals(req.params.id)){
//     req.flash("error","You don't have permission to do that");
//     return res.redirect(`/listings/${req.params.id}`);
//   }
//   next();
// }

module.exports.isOwner = async (req, res, next) => {
    const { id } = req.params;
    let listing = await Listing.findById(id);
    // console.log("Listing owner:", listing.owner);
    // console.log("Current user:", req.user._id);
    if (!listing.owner.equals(res.locals.currentUser._id)) {
      req.flash("error", "You don't have permission to do that");
      return res.redirect(`/listings/${id}`);
    }
    next();
  };

module.exports.validateListing = (req, res, next) => {
    const { error } = listingSchema.validate(req.body);
    if (error) {
      // Join all error messages together
      const errMsg = error.details.map((el) => el.message).join(", ");
      throw new ExpressError(400, errMsg);
    } else {
      next();
    }
  }
  
  
  module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
      // Join all error messages together
      const errMsg = error.details.map((el) => el.message).join(", ");
      throw new ExpressError(400, errMsg);
    } else {
      next();
    }
  };