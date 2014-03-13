var UserModel = require('mongoose').model('User');
var BoardModel = require('mongoose').model('Board');
var _ = require('underscore');
exports.users = function (req, res) {
	console.log('search user');
	// console.log(res);
	BoardModel.findById(req.query.boardId, function (err, board) {
		var members = board.members;
		var ids = _.pluck(members, '_id');
		console.log(ids);
		UserModel.find({'email': new RegExp(req.query.q, "i"),'_id': {$nin: ids}}, 'email nickname').limit(10).exec(function (err, users) {
			res.json({'users':users});	
		});
	});
	
};

exports.members = function (req, res) {
	console.log('search member');
	console.log(req.query.boardId);
	BoardModel.findById(req.query.boardId, function (err, board) {
		console.log('find the board');
		console.log(res.locals.session.user._id);
		var members = board.members;
		var ids = _.pluck(members, '_id');
		console.log(ids);
		ids = _.reject(ids, function (id) {
			return id.toString() == res.locals.session.user._id;
		}); 
		console.log(ids);
		//could be enhanced by $or
		UserModel.find({'nickname': new RegExp(req.query.q, "i"),'_id': {$in: ids}}, '_id email nickname md5').limit(10).exec(function (err, users) {
			console.log('find users');
			res.json({'members':users});	
		});
	});
	
};