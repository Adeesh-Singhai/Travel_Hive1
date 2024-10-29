if(process.env.NODE_ENV!=='production'){
  require("dotenv").config();

}

 

const express = require("express");
const mongoose = require("mongoose");

const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");



const multer=require("multer");
const upload =multer({dest:'uploads/'});

const ExpressError = require("./utils/ExpressError.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const app = express();
const session=require("express-session"); 
const MongoStore=require("connect-mongo");
const flash=require("connect-flash");

const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user");

const dbUrl = process.env.ATLASDB_URL ;


// Connect to MongoDB
main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect(dbUrl);
  console.log("Connected to DB");
}

// Set up view engine
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));


const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto:{
    secret:process.env.SECRET,
    
  },

  touchAfter:24*3600,  //agar session ke andar koi change nahi hua toh ham apni info ko 24 hrs ke baad update krein 
});

store.on("error", function (e) {
  console.log("SESSION STORE ERROR", e);
})


const sessionOptions={
  store, // ab hamari session info atlaas ke andar store hogi
  secret:process.env.SECRET,
  resave:false,
  saveUninitialized:true,
  cookie:{
    expires:Date.now()+1000*60*60*24*3,
    maxAge:1000*60*60*24*3,
    httponly:true
  }

}
app.get("/", (req, res) => {
  res.redirect("/listings");
});




//Session Middlewares
app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());





app.use((req,res,next)=>{
  res.locals.success=req.flash("success");

  res.locals.error = req.flash("error"); // Add this line
  res.locals.currentUser=req.user;
  
  next();

})


// app.get("/demoUser",async(req,res)=>{
//   let fakeUser=new User({
//     email:"abc@gmail.com",
//     username:"abc",
//   });
//   let registeredUser=await User.register(fakeUser,"abc");
//   res.send(registeredUser);

// })

// Routes


app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

app.all("*", (req, res, next) => {
  next(new ExpressError(404, "PageNotFound"));
});

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "SOMETHING WENT WRONG! :(" } = err;
  res.status(statusCode).render("error.ejs", { message });
});

// Start the server
app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
