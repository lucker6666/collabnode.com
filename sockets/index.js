(function (exports) {

  "use strict";

  var mongoose = require('mongoose')
    , connect = require('express/node_modules/connect')
    , cookie = require('express/node_modules/cookie')
    , url = require('url')
    , redis = require('redis')
    // , Session = connect.middleware.session.Session
   // , crud = require('./crud')
    , _ = require("underscore");

    var RedisStore = require('socket.io/lib/stores/redis');
    if(process.env.REDISTOGO_URL)
    {
        console.log(process.env.REDISTOGO_URL);
        var redisURL = url.parse(process.env.REDISTOGO_URL); 
        console.log(redisURL);
        var pub = require('redis').createClient(redisURL.port, redisURL.hostname)
          , sub = require('redis').createClient(redisURL.port, redisURL.hostname)
          , client = require('redis').createClient(redisURL.port, redisURL.hostname);
          pub.auth(redisURL.auth.split(":")[1]);
          sub.auth(redisURL.auth.split(":")[1]);
          client.auth(redisURL.auth.split(":")[1]);
           
    }else{
      var pub = require('redis').createClient()
        , sub = require('redis').createClient()
        , client = require('redis').createClient();
    }
    pub.on('error', function(err) {
        console.log('pub:', err);
    });
    sub.on('error', function(err) {
        console.log('sub:', err);
    });
    client.on('error', function(err) {
        console.log('client:', err);
    });
   
  // pub.auth(config.redis.password, function(err) { if (err) throw err; });
  // sub.auth(config.redis.password, function(err) { if (err) throw err; });
  // client.auth(config.redis.password, function(err) { if (err) throw err; });

  

  var boardSocket  = require('./board'),
      userSocket = require('./user'),
      sessionSocket = require('./session'),
      cardSocket = require('./card'),
      commentSocket = require('./comment'),
      messageSocket = require('./message');



  /**
   * Generic utility for setting up a Redis subscription and
   * create/read/update/delete/lock/unlock socket message handlers
   * for a model.
   */
  function setUpCrudForModel(modelName, socket, hs) {
    // No point in continuing without the required references
    if (!modelName || !socket || !hs) {
      return;
    }

    // Subscribe to Redis messages on the 'modelName' channel
    sub.subscribe(modelName.toLowerCase());

    // Add socket message handlers for this this model
    crud.addListeners({
      'model': mongoose.model(modelName),
      'rooturl': modelName.toLowerCase(),
      'socket': socket,
      'handshake': hs,
      'pub': pub
    });
  }

  exports.init = function (sio, sessionStore) {
    if(process.env.HEROKU_ENV)
    {
        sio.configure(function () {
            sio.set("transports", ["xhr-polling"]); 
            sio.set("polling duration", 10); 
          }
        );
    }
    sio.configure(function () { 
        sio.set('store', new RedisStore({
        redis: redis,
        redisPub: pub,
        redisSub: sub,
        redisClient: client
      }));
    });

    // ----------------------------------------------------
    // Autherization
    //
    sio.set('authorization', function (data, callback) {
      console.log('authorization');
      // Without a cookie that holds the user's session id
      // the user can not be authorized.
      if (data.headers.cookie) {
        var sessionCookie = cookie.parse(data.headers.cookie);
        console.log(sessionCookie);
        var sessionID = connect.utils.parseSignedCookie(sessionCookie['collabnode.sid'],'collabnode');
        // data.sessionStore = sessionStore;

        // Using the session id found in the cookie, find the
        // session in Redis.  The authorization will fail if the
        // session is not found.
        sessionStore.get(sessionID, function (err, session) {
          if (err || !session) {
            return callback('Error', false);
          } else {
            data.session = session;
            data.sessionID = sessionID;
            console.log(session);
            return callback(null, true);
          }
        });
      }else{
          return callback('No cookie transmitted.', false);    
      }
    });

    // ----------------------------------------------------
    // Connection
    //
    sio.on('connection', function (socket) {
      console.log("LIN::connection");
     // if(socket.handshake.session.user)
     // {
     //   var user = socket.handshake.session.user;
     //   client = { 
     //     '_id': user._id,
     //     'nickname': user.nickname,
     //     'email': user.email,
     //     'socket': socket
     //   };
     //   clients.push(client);
     // }
      var hs = socket.handshake
        , sessionID = hs.sessionID
        , watchedModels = [];

      // Generic message handler to receive all messages
      // published via Redis, convert the message to an object
      // using JSON and emit it through the user's connected
      // socket.  Backbone Sync will receive this object and
      // update the appropriate models based on the 'key'
      // sub.on('message', function (channel, message) {
      //   console.log("LIN::message");
      //   console.log(channel);
      //   // var msg = JSON.parse(message);
      //   // if (msg && msg.key) {
      //   //   console.log(msg.key);
      //   //   console.log(sessionID);
      //   //   socket.emit(msg.key, msg.data);
      //   // }
      // });

      // ----------------------------------------------------
      // Connect
      //
      socket.on('connect', function (data, callback) {
      //   console.log("LIN::connect");
      //   var i, len, d = {};

      //   watchedModels = data;

      //   function fillData(model, count) {
      //     d[model] = { locks: [] };
      //     return function (err, result) {
      //       d[model].locks = result;
      //       // When all of the information has been collected
      //       // send it back to the client through their callback.
      //       if (Object.keys(d).length === count) {
      //         mongoose.model('User').find({},function(err, users){
      //           d['users'] = users;
      //           callback(null, d);
      //         });
      //       }
      //     };
      //   }

      //   // Return to the client an object containing all of
      //   // the locks currently maintained that the client is
      //   // interested in.  The client will use this info to
      //   // initialize the app with locks if any were created
      //   // before they got to the app.
      //   for (i = 0, len = data.length; i < len; i++) {
      //     store.hkeys(data[i], fillData(data[i], len));
      //   }

      });

      // ----------------------------------------------------
      // Disconnect
      //
      socket.on('disconnect', function (data, callback) {
        console.log('disconnect');
        // clients = _.reject(clients, function (item) {
        //   return item.email == user.email;
        // });

      });

      // setUpCrudForModel('Card', socket, hs);
      // setUpCrudForModel('User', socket, hs);
      // setUpCrudForModel('Board', socket, hs);
      // setUpCrudForModel('BoardMember', socket, hs);

      userSocket.addListeners(socket, sio);
      boardSocket.addListeners(socket, sio);
      sessionSocket.addListeners(socket, sio);
      cardSocket.addListeners(socket, sio);
      commentSocket.addListeners(socket, sio);
      messageSocket.addListeners(socket, sio);
      // sub.subscribe('board');
      // sub.subscribe('user');
    });

  };

}(exports));
