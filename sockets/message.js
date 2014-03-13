var MessageModel = require('mongoose').model('Message');
var key = 'message';
var _  = require('underscore');

exports.addListeners = function (socket, sio){
	var socket = socket;
	var	sio = sio;
	socket.on(key + ':getUnreads', function (data, callback) {
        console.log('message:getUnreads');
        console.log(socket.handshake.session.user._id);
		MessageModel.find({'to':socket.handshake.session.user._id, 'flag':false}, function (err, msgs) {
			console.log(msgs);
			callback(err, msgs);
		});
    });

    socket.on(key + ':markRead', function (data, callback) {
    	console.log(key+":markRead");
    	console.log(data);
    	MessageModel.update({'_id':{$in:data.msgids}},{$set:{'flag':true}}, function (err, result) {
    		_.each(data.boards, function (board) {
    			socket.emit('message:reset',{});
    		});
    	});
    });


    socket.on(key + ':list', function (data, callback) {
    	console.log(key+":list");
    	console.log(data);
    	MessageModel.find({'to':socket.handshake.session.user._id}).populate('from').exec(callback);
    });
};