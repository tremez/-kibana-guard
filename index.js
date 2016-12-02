var config = require('./config.json');
var users=config.users;
var express = require('express');
var passport = require('passport');

var BasicStrategy = require('passport-http').BasicStrategy;
passport.use(new BasicStrategy(
	function(username, password, done) {
		if(username){
			return done(null,{username:username,password:password});
		}else{
			return done(null,false);
		}

	}
));

var http = require('http'),
	connect = require('connect'),
	request = require('request'),
	bodyParser = require('body-parser');


var guardproxy=require('./guardproxy');

var guardProxy=guardproxy.guardProxy;

var app = express();
app.use(bodyParser.text({
		type: function () {
			return true
		}
	}));
app.use(function(req,res,next){
	passport.authenticate('basic', function(err, user, info) {
		req.user=user;
		console.log('aaa',user);
		return next();
	})(req, res, next);
})
app.use(function(req,res,next){
	return next();
})

app.use(guardProxy);


http.createServer(app).listen(config.port, function () {
	console.log('Kibana Guard started on port ' + config.port);
});
