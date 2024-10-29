const User = require("../models/user");



module.exports.renderSignupForm =
(req, res) => {
    res.render("users/signup.ejs");
  }
module.exports.signupForm=async (req, res) => {
    try {
      let { username, email, password } = req.body;
      const newUser = new User({ email, username });
      const registeredUser = await User.register(newUser, password);
      req.login(registeredUser, (err) => {
        if (err) {
          return next(err);
        }
        // console.log(registeredUser);
      req.flash("success", "Welcome to TravelHive! Unlock Your Perfect Stay for Every Adventure!");
      res.redirect("/listings");
        
        
      })
      
    } catch (e) {
      req.flash("error", e.message);
      res.redirect("/signup");
    }
  }

  module.exports.renderLoginForm= (req,res)=>{
    res.render("users/login.ejs");
}

module.exports.loginForm =  async(req,res)=>{
    req.flash("success","Welcome to TravelHive! You are logged in!");
    let redirectURL = req.session.redirectURL || "/listings";

    res.redirect(redirectURL);

}


module.exports.logout = (req,res,next)=>{
    req.logout((err)=>{
  
      if(err){
        return next(err);
      }
      
      req.flash("success","Goodbye! You are now logged out! ");
      res.redirect("/listings");
  
    });
  
    
  }