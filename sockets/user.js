var UserModel = require('mongoose').model('User');
var BoardModel = require('mongoose').model('Board');
var key = 'user';

exports.addListeners = function (socket, sio){
	var socket = socket;
	var	sio = sio;
	socket.on(key + ':getOwnBoards', function (data, callback) {
		console.log('getOwnerBoards');
        UserModel.findById(data._id, function (err, user) {
            if(user)
            {
                var boards = user.boards;  
                callback(err, boards);
            }else{
              callback(err, user);
            }
        }); 
    });

    socket.on(key + ':getJoinBoards', function (data, callback) {
        console.log(data);
        BoardModel.find({'members._id':data._id, 'owner':{$nin:[data._id]}}, callback);    
    });

    socket.on(key + ':retrieve', function (data, callback) {
    	console.log(data);
    	if(data._id == null)
    	{
    		data._id = socket.handshake.session.user._id;
    	}
    	UserModel.findById(data._id, callback);
    });

};