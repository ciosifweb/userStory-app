var User = require("../models/user");
var Story = require("../models/story");
var config = require("../../config");
var jsonwebtoken = require("jsonwebtoken");
var secretKey = config.secretKey;

//create login token

function createToken(user) {

	var token = jsonwebtoken.sign({
		id: user._id,
		name: user.name,
		username: user.username
	}, secretKey, {
		expiresInMinute: 1440
	});

	return token;
}

// express module

module.exports = function(app, express) {
	var api = express.Router();

	// signup route

	api.post('/signup', function(req, res) {
		var user = new User({
			name: req.body.name,
			username: req.body.username,
			password: req.body.password
		});

		user.save(function(err) {
			if (err) {
				res.send(err);
				return;
			}

			res.json({message: "User has been created"});
		});
	});

	//display users route

	api.get('/users', function(req, res) {
		User.find({}, function(err, users) {
			if (err) {
				res.send(err);
				return;
			} else {
				res.json(users);
			}
		});
	});

	//login route

	api.post('/login', function(req, res) {

		//find the user according to the username, and get the password from the response
		User.findOne({
			username: req.body.username
		 }).select('password').exec(function(err, user) {

		 	if (err) throw err;

		 	if(!user) {

		 		res.send({message: "User doesn't exist"});
		 	} else if (user) {

		 		var validPassword = user.comparePassword(req.body.password);

		 		if (!validPassword) {
		 			res.send({message: "Invalid password"});
		 		} else {
		 			///////// token
		 			var token = createToken(user);
		 			res.json({
		 				success: true,
		 				message: "Successfully logged in!",
		 				token: token
		 			});

		 		}
		 	}
		 })
	});

	//middleware that checks if the user has logged in

	api.use(function(req, res, next) {
		console.log("Someone just connected to our app!");

		var token = req.body.token || req.param('token') || req.headers['x-access-token'];
		//check if token exits

		if(token) {
			jsonwebtoken.verify(token, secretKey, function(err, decoded) {
				if (err) {
					res.status(403).send({success: false, message: "Failed to authenticate"});

				} else {
					req.decoded = decoded;
					next();
				}
			});
		} else {
			res.status(403).send({success: false, message: "No Token Provided"});
		}
	});

	// after token check middleware

	//post and get user stories on the root path

	api.route('/')
		.post(function(req, res) {
			var story = new Story({
				creator: req.decoded.id,
				content: req.body.content,
			});
			story.save(function(err) {
				if (err) {
					res.send(err);
					return;
				}
				res.json({message: "New story created"});
			});
		})

		.get(function(req, res) {

			Story.find({creator: req.decoded.id}, function(err, story) {
				if (err) {
					res.send(err);
					return;
				}
				res.json(story)
			})
		})

	return api;
};