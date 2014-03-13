var nodemailer = require("nodemailer");
var BoardModel = require('mongoose').model('Board');
var UserModel = require('mongoose').model('User');
var CardModel = require('mongoose').model('Card');
var CommentModel = require('mongoose').model('Comment');
var MessageModel = require('mongoose').model('Message');
var util = require('../libs/util');
var _ = require('underscore');
var key = 'board';

var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: "linyaoyi011@gmail.com",
        pass: "34731902lyy"
    }
});

exports.addListeners = function (socket, sio) {
  // console.log('what is socket');
  // console.log(socket);
	var socket = socket;
  var sio = sio;

	socket.on(key+':addMember', function (data, callback) {
		console.log(key + ':addMember');
		console.log(data);
		BoardModel.findOne({'_id':data._id, 'members':{$nin:[data.member]}}, function (err, board) {
			if (err) {
                callback(err, board);
            }else
			{
				console.log(board);
				console.log(board.members);

				// var member = {};
				// member.name  = data.email;
				var member = data.member;
        if(member.email == null)
        {
          return;
        }
        member.md5 = util.md5(member.email);
				console.log(member);
				board.members.push(member);
				console.log(board.members);
				board.save(function (err) {
					console.log('add board member');
          clients = sio.sockets.clients(board._id);
          console.log(clients);
					sio.sockets.in(board._id).emit('board:addMember', member);
          var mailOptions = {
            from: "CollabNode  <linyaoyi011@gmail.com>", // sender address
            to: member.email, // list of receivers
            subject: socket.handshake.session.user.nickname + " has added you to board " + board.name, // Subject line
            html: socket.handshake.session.user.nickname + " has added you to board " + board.name
             + "visit <a>http://localhost:5000/board/"+board._id+"<a> to check it" // html body
				  };
          smtpTransport.sendMail(mailOptions, function(error, response){
            if(error){
              console.log(error);
            }else{
              console.log("Message sent: " + response.message);
            } 
          });
			   });
		    }
	   });
    });

  socket.on(key+':removeMember', function (data, callback) {
    console.log('board:removeMember');
    console.log(data);
    BoardModel.find({"_id":data.boardId},{"members":{$elemMatch:{"_id":data.member._id}}},function (err, result) {
        console.log(result);
        var cards = result[0].members[0].cards;
        _.each(cards, function (card) {
            console.log(card._id);
            CardModel.remove(card._id, function (err) {
            });
        });
        
        BoardModel.update({"_id":data.boardId},{$pull:{"members":{"_id":data.member._id}}},function (err, result) {
          sio.sockets.in(data.boardId).emit('board:removeMember', data.member._id);
          BoardModel.findById(data.boardId, function (err, board) {
            var mailOptions = {
              from: "CollabNode  <linyaoyi011@gmail.com>", // sender address
              to: data.member.email, // list of receivers
              subject: socket.handshake.session.user.nickname + " has removed you from board " + board.name, // Subject line
              html: socket.handshake.session.user.nickname + " has removed you from board " + board.name,
            };
            smtpTransport.sendMail(mailOptions, function(error, response){
              if(error){
                console.log(error);
              }else{
                console.log("Message sent: " + response.message);
              } 
            });
          });
        });
    });
  });

	socket.on(key+':getMembers', function (data, callback) {
    console.log('board:getMembers');
		BoardModel.findById(data._id, function (err, board) {
			callback(err, board.members);
		});
	});
    socket.on(key + ':getOwnBoards', function (data, callback) {
        UserModel.findById(socket.handshake.session.user._id, function (err, user) {
          console.log('getOwnerBoards');
            if(user)
            {
              console.log('getOwnerBoards1');
                var boards = user.boards;
                _.each(boards, function (board) {
                    socket.join(board._id);
                }); 
                callback(err, boards);
            }else{
              callback(err, user);
            }
        }); 
    });

    socket.on(key + ':getJoinBoards', function (data, callback) {
        console.log(socket.handshake.session.user);
        id = socket.handshake.session.user._id;
        BoardModel.find({'members._id':id, 'owner':{$nin:[id]}}, function (err, boards) {
            _.each(boards, function (board) {
                socket.join(board._id);
            }); 
            callback(err, boards);
        });    
    });

    socket.on(key + ':subscribe', function (data, callback) {
    	console.log('subscribe'+data._id);
      socket.handshake.session.rooms = [];
      socket.handshake.session.rooms.push(data._id);
    	socket.join(data._id);
    });

    socket.on(key + ':unsubscribe', function (data, callback) {
      if(data._id != null)
    	{
        console.log('unsubscribe'+data._id);
    	 socket.leave(data._id);
      }else{
        console.log(socket.handshake.session.rooms);
      }
    });

    // ---------------
    // Create
    //
    socket.on(key + ':create', function (data, callback) {
        console.log('board:create');
      	var board = new BoardModel();
        board.name = data.name;
        board.owner = socket.handshake.session.user._id;
        var member = {
          'email': socket.handshake.session.user.email,
          'nickname': socket.handshake.session.user.nickname,
          'md5': socket.handshake.session.user.md5,
          '_id': board.owner
        };
        board.members.push(member);
      	board.save(function (err, board) {
          socket.join(board._id);
          UserModel.findOne({"_id":socket.handshake.session.user._id, "boards._id":{$nin:[board._id]}}, function (err, user) {
            console.info('get users');
            console.log(user);
            if(user)
            {
              user.boards.push(board);
              user.save(function (err) {
                console.log('socket emit board:create');
                socket.emit(key + ':create', board);    
              });
            }else{
              socket.emit(key + ':create', board);  
            }
          });
      	});
    });


	// ---------------
    // Delete
    //
    socket.on(key + ':delete', function (data, callback) {
      // var clients = sio.sockets.clients(data._id);
      // if(clients.length != 0)
      // {
      //     var result = {};
      //     result.code = -1;
      //     var users = [];
      //     _.each(clients, function (client) {
      //       name = client.manager.handshaken[client.id].session.user.nickname;
      //       users.push(name);
      //     });
      //     result.users = users;
      //     socket.emit('board:delete', result);
      //     return;
      // }
      
      var field, name;
      console.log('board delete');
      if (data && data._id) {
        field = data._id;
        name = key + ':delete';
        console.log(data);
        BoardModel.findById(data._id, function (err, result) {
          socket.leave(data._id);
          if (err) {
            callback(err, data);
          } else {
            if (result) {
              if(result.members.length > 1)
              {

                var result = {};
                result.code = -1;
                socket.emit('board:delete', result);
                return ;
              }
              result.remove();
              result.save(function (err) {
                UserModel.update({"_id":socket.handshake.session.user._id},{$pull:{"boards":{"_id":data._id}}},
                  function (err, result) {
                    console.log('update User boards');
                    if(result == 1)
                    {
                      CardModel.remove({'board':data._id}, function (err) {
                        CommentModel.remove({'board':data._id}, function (err) {
                          var result = {};
                          result.code = 0;
                          result._id = data._id;
                          socket.emit('board:delete', result);        
                        });
                      });
                    }
                  });
              });
            }
          }
        });
      }
    });

    socket.on(key + ':quit', function (data, callback) {
      console.log('board quit');
      console.log(data);
      uid = socket.handshake.session.user._id;
      if (data._id) {
        // - TODO: 需要关联删除card, 并发消息或邮件
        BoardModel.update({'_id':data._id},{$pull: {'members':{'_id':uid}}}, function (err, result) {
          socket.leave(data._id);
          // var msg = new MessageModel();
          //   msg.from = socket.handshake.session.user._id;
          //   msg.to = data.owner;
          //   msg.content = socket.handshake.session.user.nickname + 'has leaved the board';
          //   msg.card.title = card.title;
          //   msg.card.owner = card.owner;
          //   msg.board._id = data.boardId;
          //   msg.board.name = data.boardName;
          //   msg.save(function (err) {
          //     var clients = sio.sockets.clients(data.boardId);
          //     var online = false
          //     _.each(clients, function (client) {
          //       var uid = client.manager.handshaken[client.id].session.user._id;
          //       if(uid == msg.to)
          //       {
          //           client.emit('message:notification', msg);
          //           online = true;
          //       }
          //     });
          //     if(!online)
          //     {
          //       var mailOptions = {
          //         from: "CollabNode  <linyaoyi011@gmail.com>", // sender address
          //         to: item.email, // list of receivers
          //         subject: socket.handshake.session.user.nickname + " has commented your card " + card.name + "of board " + data.boardName, // Subject line
          //         html: socket.handshake.session.user.nickname + " has commented you card <b>" + card.name + "<b> of board " + data.boardName
          //               + "visit <a>http://localhost:5000/board/"+data.boardId+"<a> to check it" // html body
          //       };
          //       smtpTransport.sendMail(mailOptions, function(error, response){
          //         if(error){
          //           console.log(error);
          //         }else{
          //           console.log("Message sent: " + response.message);
          //         } 
          //       });
          //     }
          //   });
          // var data = {};
          // var data.uid = socket.handshake.session.user._id;
          // var data.boardId = data._id;
          sio.sockets.in(data._id).emit('board:quit', uid);
          callback(err, result);
          
        });
      }
    });

    socket.on(key + ':retrieve', function (data, callback) {
      console.log('board:retrieve');
      if (data._id) {
        BoardModel.findById(data._id, callback);
      }
    });
};
