require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();


app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));


mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
    email:String,
    password:String
}); 


userSchema.plugin(encrypt,{secret:process.env.SECRET_KEY ,encryptedFields:["password"]});

const User = new mongoose.model("User",userSchema); 

app.get("/",(req,res)=>{
    res.render("home");
});

app.get("/login",(req,res)=>{
    res.render("login");
});
app.get("/register",(req,res)=>{
    res.render("register");
});


app.post("/register",async (req,res)=>{
    const newUser = new User({
        email:req.body.username,
        password:req.body.password
    });

    await newUser.save()
    .then(user => {
        if(user){
            res.render("secrets");
        }else{
            console.log(user);
        }
    })
    .catch(err => {
        console.log(err);
    })
})


app.post("/login",async (req,res)=>{
const username = req.body.username;
const password = req.body.password;
  

    await User.findOne({email:username})
    .then(foundUser => {
        if(foundUser){
            if(foundUser.password === password){
                res.render("secrets");
            }else{
                res.send("not found or wrong password");
            }
        }else{
            console.log(user);
        }
    })
    .catch(err => {
        console.log(err);
    })
})






app.listen(3000,()=>{
    console.log("server started on port 3000");
})