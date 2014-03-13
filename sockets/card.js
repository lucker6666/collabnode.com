var CardModel = require('mongoose').model('Card');
var BoardModel = require('mongoose').model('Board');
var CommentModel = require('mongoose').model('Comment');
var key = 'card';
var _  = require('underscore');

exports.addListeners = function (socket, sio){
	var socket = socket;
	var	sio = sio;
	socket.on(key + ':create', function (data, callback) {
		console.log('card:create');
		card = new CardModel();
		card.title = data.title;
		card.owner = data.owner._id;
		card.board = data.boardId;
    card.createdby = socket.handshake.session.user._id;
      	card.save(function (err) {
          var temp = {};
          temp._id = card._id;
          temp.owner = card.owner;
          temp.title = card.title;
      		BoardModel.update({"_id":card.board, "members._id":{$in:[card.owner]}}, {$push:{"members.$.cards":temp}}, function (err, result) {
      		  if(result == 1)
            {
              sio.sockets.in(data.boardId).emit('card:create',temp);
            }	
      		// BoardModel.findOne({"_id":result.board, "members._id":{$in:[result.owner]}}), function (err, board) {
      		// 	var members = board.members;
      		// 	_.find(members, function (member) {
      		// 		return member._id == result.owner
      		// 	}
      		// });
      		});
    	});
    });
  socket.on(key + ':list', function (data, callback) {
    console.log('card:list');
    console.log(data.boardId);
    console.log(data.userId);
    BoardModel.find({"_id":data.boardId},{"members":{$elemMatch:{"_id":data.userId}}}, function (err, results) {
      var cards = results[0].members[0].cards;
      callback(err, cards);
    });
  });

  socket.on(key + ':retrieve', function (data, callback) {
    console.log('card:retrieve');
    console.log(data);
    CardModel.findById(data.cardId).populate('attachments.attachedBy owner').exec(callback);
  });

  socket.on(key + ':subscribe', function (data, callback) {
      console.log('subscribe'+data._id);
      socket.join(data._id);
    });

  socket.on(key + ':unsubscribe', function (data, callback) {
    console.log('unsubscribe'+data._id);
    socket.leave(data._id);
  });

  socket.on(key + ':addDesc', function (data, callback) {
    CardModel.findById(data.cardId, function (err, card) {
      card.description = data.description;
      card.save(function (err) {
        sio.sockets.in(data.boardId).emit('card:addDesc', data);
      });
    });
  });

  socket.on(key + ':addAttachment', function (data, callback) {
    console.log('card:addAttachment');
    console.log(data);
    CardModel.findById(data.cardId, function (err, card) {
      console.log(card);
      var attachment = data.attachment;
      console.log(attachment);
      attachment.attachedBy = socket.handshake.session.user._id;
      console.log(attachment);
      card.attachments.push(attachment);
      console.log(attachment);
      card.save(function (err) {
        console.log(attachment);
        sio.sockets.in(data.boardId).emit('card:addAttachment', attachment);
      });
    });
  });

  socket.on(key + ':delete', function (data, callback) {
    console.log('delete:'+data.cardId);
    CardModel.findById(data.cardId, function (err, card) {
       var uid = socket.handshake.session.user._id;
       if(card.owner == uid || card.createdby == uid)
       {
            BoardModel.update({"_id":data.boardId, "members._id":card.owner},{$pull:{"members.$.cards":{'_id':data.cardId}}},function (err, result) 
            {
              if(result == 1)
              {
                console.log('update success card');
                card.remove();
                card.save(function (err) 
                {
                  console.log('send card:delete');
                  CommentModel.remove({'card': data.cardId}, function (err) {
                    sio.sockets.in(data.boardId).emit('card:delete', data.cardId);  
                  });
                  
                });
              }else
              {
                console.log('update failed card');
              }
            }); 
        }
    });
  });
};

