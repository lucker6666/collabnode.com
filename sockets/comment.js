var nodemailer = require("nodemailer");
var CardModel = require('mongoose').model('Card');
var BoardModel = require('mongoose').model('Board');
var CommentModel = require('mongoose').model('Comment');
var MessageModel = require('mongoose').model('Message');
var key = 'comment';
var _  = require('underscore');
var util = require('../libs/util')


var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: "linyaoyi011@gmail.com",
        pass: "34731902lyy"
    }
});

exports.addListeners = function (socket, sio){
	var socket = socket;
	var	sio = sio;
	socket.on(key + ':create', function (data, callback) {
    console.log('comment:create');
    console.log(data);
	   	CardModel.findById(data.cardId, function (err, card) {
        console.log('find a card');
        console.log(card);
        var comment = new CommentModel();
        comment.content = data.content;
        comment.author._id = socket.handshake.session.user._id;
        comment.author.email = socket.handshake.session.user.email;
        comment.author.nickname = socket.handshake.session.user.nickname;
        comment.author.md5 = socket.handshake.session.user.md5;
        comment.at = data.at;
        comment.card = card._id;
        comment.board = data.boardId;
        var msgids = [];
        _.each(comment.at, function (item) {
            var msg = new MessageModel();
            msg.from = socket.handshake.session.user._id;
            msg.to = item._id;
            msg.content = comment.content;
            msg.card._id = data.cardId;
            msg.card.title = card.title;
            msg.card.owner = card.owner;
            msg.board._id = data.boardId;
            msg.board.name = data.boardName;
            msg.save(function (err) {
              var clients = sio.sockets.clients(data.boardId);
              var online = false
              _.each(clients, function (client) {
                var uid = client.manager.handshaken[client.id].session.user._id;
                if(uid == msg.to)
                {
                    client.emit('message:notification', msg);
                    online = true;
                }
              });
              if(!online)
              {
                var mailOptions = {
                  from: "CollabNode  <linyaoyi011@gmail.com>", // sender address
                  to: item.email, // list of receivers
                  subject: socket.handshake.session.user.nickname + " has commented your card " + card.name + "of board " + data.boardName, // Subject line
                  html: socket.handshake.session.user.nickname + " has commented you card <b>" + card.name + "<b> of board " + data.boardName
                        + "visit <a>http://localhost:5000/board/"+data.boardId+"<a> to check it" // html body
                };
                smtpTransport.sendMail(mailOptions, function(error, response){
                  if(error){
                    console.log(error);
                  }else{
                    console.log("Message sent: " + response.message);
                  } 
                });
              }
            });

        });
        comment.created_time = util.getUTC8Time();
        comment.save(function (err) {
          console.log('save comment');
          card.comments.push(comment._id);
          card.save(function (err) {
        //     // BoardModel.update({'_id':data.boardId, 'members.id':card.owner, 'members.id'}, {$inc:{'members.$.cards.'}, function (err, board) {
        //     //   msgids
        //     // });
            console.log('save comment to card');
            sio.sockets.in(data.boardId).emit('comment:create', comment);
          });
        });
      });
  });
  socket.on(key + ':list', function (data, callback) {
    console.log('comment:list1');
    CardModel.findById(data.cardId).populate('comments').exec(function (err, card) {
      var comments = card.comments;
      callback(err, comments);
    });
  });

  // socket.on(key + ':addReply', function (data, callback) {
  //   console.log('comment:addReply');
  //   var reply = new CommentModel();
  //   reply.content = data.content;
  //   reply.author._id = socket.handshake.session.user._id;
  //   reply.author.email = socket.handshake.session.user.email;
  //   reply.author.nickname = socket.handshake.session.user.nickname;
  //   reply.author.md5 = socket.handshake.session.user.md5;
  //   reply.created_time = util.getUTC8Time();
  //   reply.save(function (err) {
  //     CommentModel.findById(data.commentId,function (err, comment) {
  //     comment.replies.push(reply);
  //     sio.sockets.in(data.boardId).emit('comment:addReply', reply);
  //   });  
  //   });
    
  // });



};