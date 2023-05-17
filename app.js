require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

app.use(
    session({secret: "this is our secret hshh.", resave: false, saveUninitialized: false})
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://"+process.env.Admin+":"+process.env.Password+"@cluster0.wqcnvwr.mongodb.net/userDB");

const userSchema = new mongoose.Schema({
     username:String,
     email: String,
     password: String,
     googleId: String,
     secret:Array
    });



userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());


passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.callbackUrl,
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
}, function (accessToken, refreshToken, profile, cb) {
    User.findOrCreate({
        username: profile.displayName,
        googleId: profile.id
    }, function (err, user) {
        return cb(err, user);
    });
}));

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/auth/google", function (req, res) {
    passport.authenticate("google", {scope: ["profile"]})(req, res);
});

app.get("/auth/google/secrets",passport.authenticate('google', {failureRedirect: "/login"}),
    function (req, res) {
        res.redirect('/secrets');
    }
);



app.get("/login", (req, res) => {
    res.render("login");
});
app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/secrets", async function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect("/login"); } 
   await User.find({"secret":{$ne:null}})
   .then(foundUser =>{res.render("secrets",{usersWithSecrets:foundUser})})
   .catch(err => {console.log(err); res.redirect("/secrets");})
});

app.get("/submit", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("submit")
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", function (req, res) {
    req.logout(function(err){
        if(err){
            console.log(err);
            res.redirect("/");
        }
        res.redirect("/");
    });
})


app.post("/register", async (req, res) => {


    User.register({
        username: req.body.username
    }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.render("register");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            })
        }
    })

})

app.post("/login", async (req, res) => {

    const user = new User(
        {username: req.body.username, password: req.body.password}
    );

    req.login(user, function (err) {
            if (err) {
                console.log(err);
                res.redirect("/login");
            } else {
                passport.authenticate("local")(req, res, function () {
                    res.redirect("/secrets");
                });
            }
        
    });

});


app.post("/submit",async function(req,res){
    const submittedSecret = req.body.secret;
    await User.findById(req.user.id)
    .then( (foundUser) => {
        
        if (foundUser){
            foundUser.secret.push(submittedSecret);
             foundUser.save()
            .then(()=>res.redirect("/secrets"))
            .catch((err) => {console.log(err);res.redirect("/secrets")})
        }else{
            res.redirect("/login");
        }
    })
    .catch(err => {console.log(err); res.redirect("/login");})
});

app.listen(process.env.PORT || 3000, function () {
    console.log("Server started successfully.");
});