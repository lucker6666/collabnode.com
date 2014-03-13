var express = require('express')
  , http = require('http')
  , path = require('path')
  , mongoose = require('mongoose')
  , comment = require('./models/comment')
  , user = require('./models/user')
  , card = require('./models/card')
  , board = require('./models/board')
  , message = require('./models/message')
  , routes = require('./routes')
  , config = require('./global').config
  , sockets = require('./sockets')
  , connect = require('express/node_modules/connect')
  , RedisStore = require('connect-redis')(express)
  , opts = require('opts')
  , url = require('url')
  , redis  = require('redis')
  , app = express()
  , sio;

// if(process.env.VCAP_SERVICES){
//   var env = JSON.parse(process.env.VCAP_SERVICES);
//   var mongo = env['mongodb-1.8'][0]['credentials'];
//   var redis = env['redis-2.2'][0]['credentials'];
//   var  sessionStore = new RedisStore(redis);
// }else 
if(process.env.REDISTOGO_URL){
    console.log(process.env.REDISTOGO_URL);
    var redisURL = url.parse(process.env.REDISTOGO_URL);
    console.log(redisURL);
    var client = redis.createClient(redisURL.port, redisURL.hostname);
    if(process.env.NODE_ENV)
    {
      client.auth("nodejitsudb5298121022.redis.irstack.com:f327cfe980c971946e80b8e975fbebb4");  
    }else{
      client.auth(redisURL.auth.split(":")[1]);  
    }
    
    var sessionStore = new RedisStore({client:client});
}else{
  var  sessionStore = new RedisStore();
}

var generate_mongo_url = function(obj){
    obj.hostname = (obj.hostname || 'localhost');
    obj.port = (obj.port || 27017);
    obj.db = (obj.db || 'test');
    if(obj.username && obj.password){
        return "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port + "/" + obj.db;
    }
    else{
        return "mongodb://" + obj.hostname + ":" + obj.port + "/" + obj.db;
    }
}

// var initModel = function () {
//   console.log('initModel');
//   var card = require('./models/card')
//     , user = require('./models/user')
//     , board = require('./models/board')
//     , comment = require('./models/comment');
//   card.init();
//   user.init();
//   board.init();
//   comment.init();
// };

opts.parse([{ short: 'p', long: 'port', description: 'server listen port.', value: true }]);

app.configure(function () {
  app.set('port', opts.get('port') || process.env.PORT || 5000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.compress());
  app.use(require('stylus').middleware({ src: __dirname + '/public' }));  
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.cookieParser('collabnode'));
  app.use(express.session({
    secret: 'collabnode',
    key: 'collabnode.sid',
    store: sessionStore
  }));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
});

//app.dynamicHelpers
app.use(function(req, res, next){
  console.log("req.session");
  console.log(req.session);
  res.locals.session = req.session;
  next();
});
app.use(app.router);
app.configure('development', function () {
  app.use(express.errorHandler());
});
routes(app);

console.log('ready to init model');

if(process.env.MONGOHQ_URL)
{
  mongoose.connect(process.env.MONGOHQ_URL);
}else{
    var mongo = {
    "hostname":"localhost",
    "port":27017,
    "username":"",
    "password":"",
    "name":"collabnode",
    "db":"collab"
    }
  var mongourl = generate_mongo_url(mongo);    
  mongoose.connect(mongourl);
}



var server = http.createServer(app);
server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

sio = require('socket.io').listen(server);
sockets.init(sio, sessionStore);
