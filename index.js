var config = require('./config.json');
var users = config.users;
var express = require('express');
var passport = require('passport');
var session = require('express-session');
var Users=config.users;

var LocalStrategy = require('passport-local').Strategy;
passport.serializeUser(function (user, done) {
	done(null, user);
});

passport.deserializeUser(function (user, done) {
	done(null, user);
});
passport.use(new LocalStrategy({passReqToCallback: true},
	function (req, username, password, done) {
		if (users[username] && users[username]['password']==password) {
			return done(null, users[username]);
		} else {
			return done(null, false);
		}

	}
));


var http = require('http'),
	connect = require('connect'),
	request = require('request'),
	bodyParser = require('body-parser');


var guardproxy = require('./guardproxy');

var guardProxy = guardproxy.guardProxy;

var app = express();
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
app.use('/assets', express.static(__dirname + '/assets'))

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.text({
	type: function () {
		return true
	}
}));
app.use(session({secret: 'simpleExpressMVC', resave: true, saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());

app.post('/login', passport.authenticate('local', {successRedirect: '/', failureRedirect: '/login'}));

app.get('/login', function (req, res, next) {
	return res.render('login.html')
});
app.use(function (req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	} else {
		passport.authenticate('local', function (err, user, info) {
			if (err) {
				return next(err);
			}
			if (!user) {
				return res.redirect('/login');
			}
			req.logIn(user, function (err) {
				if (err) {
					return next(err);
				}
				return res.redirect('/');
			});
		})(req, res, next);
	}
})

app.use(guardProxy);


http.createServer(app).listen(config.port, function () {
	console.log('Kibana Guard started on port ' + config.port);
});
