// Load module in program
var express=require("express");
var bodyParser=require("body-parser");

const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://thuy:1@cluster0.s2djizz.mongodb.net/user')
var db=mongoose.connection;
db.on('error', console.log.bind(console, "connection error"));
db.once('open', function(callback){
	console.log("connection succeeded");
})

var app=express()


app.use(bodyParser.json());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(express.static(__dirname));

app.post('/sign_up', function(req,res){
	var firstname = req.body.firstname;
    var lastname = req.body.lastname;
	var email =req.body.email;
    var username = req.body.username;
	var pass = req.body.password;

	var data = {
		"firstname": firstname,
        "lastname": lastname,
		"email": email,
        "username": username,
		"password":pass
	}
db.collection('account').insertOne(data,function(err, collection){
		if (err) throw err;
		console.log("Record inserted Successfully");
			
	});
    // return res.redirect('signup_success.html');
})


app.get('/',function(req,res){
res.set({
	'Access-control-Allow-Origin': '*'
	});
return res.redirect('intro.html');
}).listen(5501)

console.log("server listening at port 5501");
