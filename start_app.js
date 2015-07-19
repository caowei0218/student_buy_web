'use strict';

//dependencies
var config = require('./config'),
    express = require('express'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    mongoStore = require('connect-mongo')(session),
    http = require('http'),
    path = require('path'),
    passport = require('passport'),
    mongoose = require('mongoose'),
    helmet = require('helmet'),
    csrf = require('csurf'),
    moment = require('moment'),
    constants = require('./common/constants');

//create express app
var app = express();

// env
app.set('env', config.workEnv);

//constants
app.constants = constants;

//moment.js
app.moment = moment;

//keep reference to config
app.config = config;

//setup the web server
app.server = http.createServer(app);

//setup mongoose
app.db = mongoose.createConnection(config.mongodb.uri);
app.db.on('error', console.error.bind(console, 'mongoose connection error: '));
app.db.once('open', function () {
    //and... we have a data store
});

//config data models
require('./models')(app, mongoose);

//settings
app.disable('x-powered-by');
app.set('port', config.port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//middleware
app.use(require('morgan')('dev'));
app.set('trust proxy', true);

app.use(require('compression')());
app.use(require('serve-static')(path.join(__dirname, 'public')));
app.use(require('method-override')());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser(config.cryptoKey));
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: config.cryptoKey,
    store: new mongoStore({url: config.mongodb.uri})
}));
app.use(passport.initialize());
app.use(passport.session());
//app.use(csrf({cookie: {signed: true}}));
helmet(app);

//require('./middleware/systemLog')(app);

//response locals
app.use(function (req, res, next) {
    //res.cookie('_csrfToken', req.csrfToken());
    res.locals.ip = req.ip;
    res.locals.user = {};
    res.locals.user.defaultReturnUrl = req.user && req.user.defaultReturnUrl();
    res.locals.user.username = req.user && req.user.username;
    res.locals.user.nickname = req.user && req.user.nickname;
    res.locals.user.description = req.user && req.user.description;
    res.locals.user.email = req.user && req.user.email;
    next();
});

//global locals
app.locals.projectName = app.config.projectName;
app.locals.copyrightYear = new Date().getFullYear();
app.locals.copyrightName = app.config.companyName;
app.locals.cacheBreaker = 'br34k-01';

//setup passport
require('./passport')(app, passport);

//setup routes
require('./routes')(app, passport);

app.use(require('./views/error/error').http500);

//setup utilities
app.utility = {};
app.utility.sendmail = require('./utils/sendmail/sendmail');
app.utility.slugify = require('./utils/slugify/slugify');
app.utility.workflow = require('./utils/workflow/workflow');

//listen up
app.server.listen(app.config.port, function () {
    console.log('app.config.port: ' + app.config.port);
});