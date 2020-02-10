var mongoose=require("mongoose");
var Comment=require("./comment.js");
var campgroundsSchema= new mongoose.Schema({
	name: String,
	image:  String,
	description: String,
	author:{
		id:{
			type:mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String
	},
	comment: [
		{
		type: mongoose.Schema.Types.ObjectId,
		ref: "Comment"
}
	]
 });
module.exports=mongoose.model("Campground",campgroundsSchema);