var express=require("express");
var ejs=require("ejs");
var app=express();
var bodyparser=require("body-parser");
var mongoose=require("mongoose");
var methodOverride=require("method-override");
var User=require("./model/user.js");
var passport=require("passport");
var localStrategy=require("passport-local");
var passportLocalMongoose=require("passport-local-mongoose");
var Campground=require("./model/camp.js");
var seedDB=require("./model/seed.js");
var comment=require("./model/comment.js");
var session=require("express-session");
const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://shivansh:shivansh@cluster0-fpqlm.mongodb.net/test?retryWrites=true&w=majority";
//const client = new MongoClient(uri, { useUnifiedTopology: true });
app.use(methodOverride("_method"));

app.set("view engine", "ejs");

app.use(bodyparser.urlencoded({extended: true}));
//mongoose.connect("mongodb://localhost:27017/yelp_camp", {useUnifiedTopology: true});
mongoose.connect("mongodb+srv://shivansh:shivansh@cluster0-fpqlm.mongodb.net/test?retryWrites=true&w=majority", {useUnifiedTopology: true});

app.use(express.static("public"));
//seedDB();

app.use(require("express-session")({
    secret: "Once again Rusty wins cutest dog!",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use(function(req,res,next){
	res.locals.currentUser=req.user;
	next();
});

		
app.get("/",function(req,res){
	res.render("home.ejs");
});


app.get("/campgrounds",function(req,res){
	Campground.find({},function(err,allCamp){
		if(err)
		console.log(err);
	else
		{
			res.render("index.ejs",{camp: allCamp});
		}
	})
	
});


app.post("/campgrounds",isLoggedIn,function(req,res){
	var name=req.body.name;
	var image=req.body.image;
	var desc=req.body.description;
	
	var camps={name: name,image: image,description: desc,author:{id:req.user._id,username:req.user.username}};
	Campground.create(camps,function(err,newlyCreated){
		if(err)
		console.log(err);
	else
		{
			res.redirect("/campgrounds");
		}
	})
	
});


app.get("/campgrounds/new",isLoggedIn,function(req,res){
	res.render("new.ejs");
});


app.get("/campgrounds/:id",function(req,res){
	Campground.findById(req.params.id).populate("comment").exec(function(err,fcamps){
		if(err)
		console.log(err);
	else
		{
			console.log(fcamps);
			res.render("show.ejs",{desc: fcamps});
		}
	});
})


app.get("/campgrounds/:id/comment/new",isLoggedIn,function(req,res){
	Campground.findById(req.params.id,function(err,campground){
		if(err)
			console.log(err);
		else
			res.render("addcomment.ejs",{campground: campground});
	});
	
	
	app.post("/campgrounds/:id/comment",isLoggedIn,function(req,res){
	Campground.findById(req.params.id,function(err,camp){
		if(err)
		{console.log(err);
		res.redirect("/campgrounds");}
		else
			{
				comment.create(req.body.comment,function(err,comm){
					if(err)
						console.log(err);
					else
							{   
								comm.author.id=req.user._id;
								comm.author.username=req.user.username;
								comm.save();
								camp.comment.push(comm);
								camp.save();
								res.redirect("/campgrounds/" + camp._id);
							}
				});
			}
	});
	});
	
})

//EDIT
app.get("/campgrounds/:id/edit",isAllowed,function(req,res){
	Campground.findById(req.params.id,function(err,camp){
		if(err){
			res.redirect("/campgrounds");
		}
		else{
			res.render("edit.ejs",{camp:camp});
		}
	})
});

//UPDATE
app.put("/campgrounds/:id",isAllowed,function(req,res){
	var name=req.body.name;
	var image=req.body.image;
	var desc=req.body.desc;
	
	var camps={name: name,image: image,description: desc};
	Campground.findByIdAndUpdate(req.params.id,camps,function(err,camp){
		if(err){
			res.redirect("/campgrounds");
		}
		else{
			res.redirect("/campgrounds/" + camp._id);
		}
	})
});
// Destroy
app.delete("/campgrounds/:id",isAllowed,function(req,res){
	Campground.findByIdAndDelete(req.params.id,function(err,camp){
		if(err){
			res.redirect("/campgrounds");
		}
		else{
			res.redirect("/campgrounds/");
		}
	})
});

//AUTH ROUTES
app.get("/register",function(req,res){
	res.render("register.ejs");
});


app.post("/register",function(req,res){
	var newUser=new User({username: req.body.username});
	User.register(newUser,req.body.password,function(err,user){
		if(err)
			{
				console.log(err);
				return res.render("register",{error: err.message});
			}
		passport.authenticate("local")(req,res,function(){
			res.redirect("/campgrounds");
		});
	});
});
app.get("/login",function(req,res){
	res.render("login");
});
app.post("/login",passport.authenticate("local",{
	successRedirect: "/campgrounds",
	failureRedirect: "/login"
}),function(req,res){	
});

app.get("/logout",function(req,res){
	req.logout();
	res.redirect("/login");
});

function isLoggedIn(req,res,next){
	if(req.isAuthenticated())
		{
			return next();
		}
	res.redirect("/login");
}

function isAllowed(req,res,next){
	if(req.isAuthenticated())
	{
		Campground.findById(req.params.id,function(err,camp){
		if(err){
			res.redirect("back");
		}
		else{
			if(camp.author.id.equals(req.user._id))
				next();
			else
			res.redirect("back");
		}	
	})
	}
	else 
		res.redirect("back");
}

app.listen((process.env.PORT || 3000),() =>{
	console.log("The Yelpcamp app has started");
});