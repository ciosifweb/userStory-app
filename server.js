var express = require("express");
var bodyParser = require("body-parser");
var morgan = require("morgan");
var mongoose = require("mongoose");
var config = require("./config");

var app = express();

//connect to database
mongoose.connect(config.database, function(err) {
	if (err) {
		console.log(err);
	} else {
		console.log("Connected to db");
	}
})

//middleware for parsing urls, json, and for logging requests to the console
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(morgan('dev'));

app.use(express.static(__dirname + '/public'));

var api = require('./app/routes/api')(app, express);
app.use('/api', api);

app.get('*', function(req, res) {
	res.sendFile(__dirname + '/public/app/views/index.html');
});

app.listen(config.port, function(err) {

	if (err) {
		console.log(err);
	} else
	{
		console.log("Listening on port 3000...")
	}
});