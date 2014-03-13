
// function subscribe ($scope, socket, type, id) {
// 	socket.emit(type+':subscribe',{"_id":id});
	
// };

function appCtrl ($scope, $http, $location, socket, shareService) {
	$scope.logout = function () {
		// $location.path('/user/logout');
		$http.get('/user/logout').then(function () {
			// $location.path("user/login");
			// $scope.$apply(function() {
  				$location.path('/user/login');
			// });
		});
	}
	socket.emit('session:getCurrentUser', {}, function (err, user) {
		$scope.session = {};
		$scope.session.user = user;
		shareService.setCurrentUser(user);
	});
	socket.emit('message:getUnreads',{}, function (err, unreads) {
		$scope.messages = unreads;
	});

	socket.on('message:notification',function (notification) {
		$scope.messages.push(notification)
	});

	socket.on('message:reset',function (notification) {
		$scope.messages = [];
	});
}

function notificationCtrl ($scope, $http, $location, socket, shareService,$rootScope) {

	var msgids = _.pluck($scope.messages, '_id');
	var boards = _.pluck($scope.messages, 'board');
	socket.emit('message:markRead',{'msgids':msgids,'boards':boards});
	//这里$scope.messgaes实际没有变化，child scope不能改变parent.scope的值吗？
	// $scope.messages = [];
	// $scope.parent.messages = [];
	socket.emit('message:list',{}, function (err, msgs) {
		var num2str = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
		msgs = _.map(msgs, function (msg) {
			var datetime = new Date(msg.created_time);
			var month = datetime.getMonth();
			var date = datetime.getDate();
			var hours = datetime.getHours();
			var minutes = datetime.getMinutes();

			msg.created_time_str = num2str[month] + ' ' + date + ' ' + hours + ':' + minutes;
			return msg;
		});
		$scope.msgs = msgs;
	});
}

function memberCtrl ($scope, socket, $routeParams, $http, shareService) {
	// alert($routeParams.boardId);
	// $scope.users = [
	// 	{id:1, nickname:"yaoyi"},
	// 	{id:2, nickname:"lance"}
	// ];
	socket.emit('board:subscribe', {"_id":$routeParams.boardId});
	socket.emit('board:retrieve', {"_id":$routeParams.boardId},function (err, board) {
		shareService.setCurrentBoard(board);
	});
	socket.emit('board:getMembers',{"_id":$routeParams.boardId},function (err, members) {
		$scope.members = members;
	});
	
	socket.on("board:addMember", function (member) {
		$scope.members.push(member);
	});
	socket.on("board:removeMember", function (memberId) {
		$scope.members = _.reject($scope.members, function (item) {
			return item._id == memberId;
		});
	});

	socket.on("board:quit",function (memberId) {
		$scope.members = _.reject($scope.members, function (item) {
			return item._id == memberId;
		});
	});

	$scope.search = function($viewValue) {  
		// alert($viewValue);
    	return $http({
    		method: 'GET', 
    		url: '/api/search/users', 
    		params:{q: $viewValue, boardId: $routeParams.boardId}
    	}).
    	then(function(data, status, headers, config) {
    		$scope.results = data.data.users;
            return data.data.users;
    	});
	};

	$scope.search_with_socket_A = function() {  
    	socket.emit('user:search', {'q':$scope.username}, function (err, data) {
    		$scope.results = data;
    	});
	};

	$scope.search_with_socket_B = function($viewValue) {  
    	return socket.emit('user:search', {'q':$viewValue}, function (err, data) {
    		return data;
    	});
	};

	$scope.addMember = function () {
		var member = _.find($scope.results, function (result) {
			return result.email == $scope.email;
		});
		$scope.email = '';
		socket.emit('board:addMember', {'member':member, '_id':$routeParams.boardId});
	};

	$scope.removeMember = function () {
		var member = $scope.members[this.$index];
		socket.emit('board:removeMember', {'member':member, 'boardId':$routeParams.boardId});
	};



	// socket.on('board:addMember', function (member) {
	// 	$scope.members.push(member);
	// });
	
	// $scope.states = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Dakota', 'North Carolina', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'];


};
function cardItemDialogCtrl ($scope, $location, $rootScope, shareService, dialog, $routeParams, socket) {
	

	$scope.dbChooser = $("#db-chooser"),
	$scope.isAttachCollapsed = true;
	$scope.isCollapsed = true;
	$scope.isDescCollapsed = true;
	$scope.isDisabled = true;
 	$scope.card = shareService.getCurrentCard();
 	$scope.user = shareService.getCurrentUser();
 	$scope.board = shareService.getCurrentBoard();


 	socket.emit('card:retrieve', {'cardId':$scope.card._id}, function (err, card) {
 		$scope.card = card;
 	});
 	socket.on('card:addAttachment', function (attachment) {
 		$scope.card.attachments.push(attachment);
 	});

 	$scope.deleteCard = function () {
 		if($scope.user._id != $scope.card.owner._id && $scope.user._id != $scope.card.createdby)
 		{
 			alert('permission denied');
 		}else{
 			dialog.close(); 
 			socket.emit('card:delete',{'cardId':$scope.card._id, 'boardId':$routeParams.boardId})		
 		}
 		$scope.cardname = '';
 		
 	};

 	$scope.addDesc = function () {
 		socket.emit('card:addDesc',
 				{
 					'cardId':$scope.card._id,
 					'description': $scope.description,
 					'boardId':$routeParams.boardId,
 				});
 		$scope.card.description = $scope.description;
 		$scope.description = '';
 		$scope.isDescCollapsed = true;
 	}
 	
 	$scope.chooseFromDropbox = function () {
		
		dropbox_options = {
    	linkType: "preview",
                // "preview" (default) is a preview link to the document for sharing,
                // "direct" is an expiring link to download the contents of the file.
                // For more information about link types, see <a href="#link-types">Link types</a>
    	multiselect: false,
                // false (default) limits selection to a single file,
                // true enables multiple file selection.
    	success: function(files) {
                // Required. Called when a user selects an item in the Chooser
                var attachment = {};
                attachment.name = files[0].name;
                attachment.link = files[0].link;
                // $scope.card.attachments.push(attachment);
                // $scope.$apply();
                socket.emit('card:addAttachment',
                	{
                		'cardId':$scope.card._id,
                		'boardId':$routeParams.boardId,
                		'attachment': attachment,
                	}
                );
                // alert("Here's the file link:" + files[0].link)
        },
    	cancel:  function() {
                // Called when the user closes the dialog
                // without selecting a file and does not include any parameters.
        	}
		};
		// dropboxChooserService.choose(dropbox_options);
		Dropbox.choose(dropbox_options);
 	};
}

function cardItemCtrl ($scope, $location, $rootScope, shareService, $dialog) {
	$scope.openCardEditDialog = function($event){
		// $event.preventDefault();
		// $location.path("/card/"+$scope.card._id);
		shareService.setCurrentCard($scope.card);
		// $('#cardDetailModal').modal();
		
		$scope.opts = {
		    backdrop: true,
		    keyboard: true,
		    backdropClick: true,
		    templateUrl:  '/partials/carddetail', // OR: templateUrl: 'path/to/view.html',
		    controller: 'cardItemDialogCtrl',
		    dialogClass: 'modal card-detail-modal'
  		};
    	var d = $dialog.dialog($scope.opts);
    	d.open().then(function(result){
      		if(result)
      		{
        		alert('dialog closed with result: ' + result);
      		}
    	});
    };
	// $scope.close = function(result){
 //    	dialog.close(result);
 //  	};
}

function cardCtrl ($scope,socket, $routeParams, $location) {
	// console.log($scope.member._id);
	if($scope.member)
	{
		socket.emit('card:list', {
			'boardId':$routeParams.boardId,
			'userId':$scope.member._id
		}, function (err, cards) {
			$scope.cards = cards;
		});	
	}
	
	socket.on('card:create', function (card) {
		if(card.owner == $scope.member._id)
		{
			$scope.cards.push(card);	
		}
	});

	socket.on('card:delete', function (cardId) {
 		$scope.cards = _.reject($scope.cards, function (item) {
			return item._id == cardId;
		});
 	});

 	socket.on('card:addDesc', function (data) {
 		$scope.cards = _.map($scope.cards, function (card) {
 			if(card._id == data._id)
 			{
 				card.description = data.description;
 			}
			return card;
		});
 	});

	$scope.createCard = function createCard ($event) {
		console.log($scope.members[this.$index]);
		var owner = $scope.members[this.$index];
		socket.emit('card:create', {
			'title': $scope.card_title, 
			'boardId': $routeParams.boardId,
			'owner': owner,
		});
		$scope.card_title = '';
	};

	$scope.filterByOwner = function(card){
    	return (card.owner == $scope.member._id);
	};

};

function boardCtrl ($scope, socket) {

	socket.emit('user:retrieve', {}, function (err, data) {
		$scope.user = data;
	});
	socket.emit('board:getOwnBoards', {}, function (err, data) {
		$scope.boards = data;
	});

	socket.emit('board:getJoinBoards', {}, function (err, data) {
		if (data.length) 
		{
			$scope.joinboards = data;
			$scope.joinboard_flag = true;
		}else{
			$scope.joinboard_flag = false;
		}
	});

	socket.on('board:create', function (board) {
		$('#createBoardModal').modal('hide');
		$scope.boards.push(board);
	});

	socket.on('board:delete', function (result) {
		// $scope.boards = _.without($scope.boards, board);
		if(result.code == 0)
		{
			$scope.boards = _.reject($scope.boards, function (item) {
				return item._id == result._id;
			});
			console.log($scope.boards);	
		}else{
			alert('please remove the board members first');
		}
		
	});

	$scope.createBoard = function () {
		// alert($scope.boards);
		socket.emit('board:create', {
			'name':$scope.board_name,
			}, function (err, board) {
				// $('#createBoardModal').modal('hide');
				// $scope.boards.push(board);
				// 因为createBoard和np-repeat boards不在一个scope里，所以server直接调用callback会有问题
			}
		);	
		$scope.board_name = '';
	};

	$scope.deleteBoard = function (data) {
		// $event.preventDefault(); //angular.js这个没有效果
		// $('.board-operation-menu').toggle();
		socket.emit('board:delete', {'_id': data})
	};

	$scope.quitBoard = function () {
		var board = $scope.joinboards[this.$index];
		socket.emit('board:quit', {'_id': board._id,'owner': board.owner,'name':board.name}, function (err, result) {
			if(result == 1)
			{
				$scope.joinboards = _.reject($scope.joinboards, function (item) {
					return item._id == board._id;
				});
				if($scope.joinboards.length == 0)
				{
					$scope.joinboard_flag = false;
				}
			}
		});

	};
};

function commentCtrl ($scope, socket, $routeParams, $http) {
	$scope.isCollapsedNewReply = true;
	$scope.isDisabled = true;
	socket.on('comment:create', function (comment) {
		var num2str = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
		var datetime = new Date(comment.created_time);
		var month = datetime.getMonth();
		var date = datetime.getDate();
		var hours = datetime.getHours();
		var minutes = datetime.getMinutes();

		comment.created_time_str = num2str[month] + ' ' + date + ' ' + hours + ':' + minutes;
		$scope.comments.push(comment);
	});

	// socket.on('comment:addReply', function (reply) {
	// 	var num2str = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
	// 	var datetime = new Date(reply.created_time);
	// 	var month = datetime.getMonth();
	// 	var date = datetime.getDate();
	// 	var hours = datetime.getHours();
	// 	var minutes = datetime.getMinutes();
	// 	reply.created_time = num2str[month] + ' ' + date + ' ' + hours + ':' + minutes;
	// 	$scope.replies.push(reply);
	// });

	socket.emit('comment:list', {'cardId':$scope.card._id}, function (err, comments) {
		var num2str = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
		comments = _.map(comments, function (comment) {
			var datetime = new Date(comment.created_time);
			var month = datetime.getMonth();
			var date = datetime.getDate();
			var hours = datetime.getHours();
			var minutes = datetime.getMinutes();

			comment.created_time_str = num2str[month] + ' ' + date + ' ' + hours + ':' + minutes;
			return comment;
		});
		$scope.comments = comments;
	});

	$scope.createComment = function () {
		if($scope.user._id != $scope.card.owner._id)
		{
			var token = {};
			token._id = $scope.card.owner._id;
			token.nickname = $scope.card.owner.nickname;
			token.email = $scope.card.owner.email;
			token.md5 = $scope.card.owner.md5;
			var isContained = _.some($scope.tokens, function (item) {
				return item._id == token._id;
			});
			if(!isContained)
			{
				$scope.tokens.push(token);
			}
		}

		socket.emit('comment:create',{
			'cardId':$scope.card._id,
			'content':$scope.newcomment,
			'boardId':$routeParams.boardId,
			'boardName': $scope.board.name,
			'at':$scope.tokens
		});	
		$scope.tokens = [];
		$scope.newcomment = '';
	};

	// $scope.addReply = function () {
	// 	socket.emit('comment:create',{
	// 		'cardId':$scope.card._id,
	// 		'content':$scope.newreply,
	// 		'boardId':$routeParams.boardId,
	// 		'at':$scope.tokens
	// 	});	
	// 	$scope.tokens = [];
	// 	this.newreply = '';
	// 	this.isCollapsedNewReply = false;
	// };

	$scope.search = function ($event) {
		if($scope.newcomment == '')
		{
			$scope.isDisabled = true;
			return;
		}
		$scope.isDisabled = false;
		var at_pos = $scope.newcomment.indexOf('@');
		console.log(at_pos);
		var index = $scope.newcomment.length -1 ;
		console.log(index);
		console.log($event.keyCode);
		var isSearchable;
		if(index >= at_pos && at_pos >= 0 && $event.keyCode != 32 && $event.keyCode != 8 && $event.keyCode != 50
			&& $event.keyCode != 16
			&& $event.keyCode != 17
			&& $event.keyCode != 18)
		{
			isSearchable = true;
		}else{
			isSearchable = false;
			$scope.showresult = false;
		}
		if(isSearchable)
		{
			var query = $scope.newcomment.substr(at_pos + 1, index);
			$http({
    			method: 'GET', 
    			url: '/api/search/members', 
    			params:{q: query, boardId: $routeParams.boardId}
    		}).success(function(data, status, headers, config) {
    			var results = _.reject(data.members, function (member) {
    				
    				return _.some($scope.tokens, function (token) {
    					return token._id == member._id;
    				});
    			});
    			if(results.length != 0)
    			{
    				$scope.showresult = true;
    			}else{
    				$scope.showresult = false;
    			}
    			$scope.results = results;
    		});
		}
	};

	$scope.tokens = [];
	$scope.addToken = function (token) {
		$scope.tokens.push(token);
		var at_pos = $scope.newcomment.indexOf('@');	
		if(at_pos>=0)
		{
			$scope.newcomment = $scope.newcomment.substr(0, at_pos);;	
		}
		if($scope.newcomment == '')
		{
			$scope.isDisabled = true;
		}
		$scope.showresult = false;
	}
	$scope.removeToken = function () {
		$scope.tokens.splice(this.$index, 1);
	};

	// $scope.openReplyInput = function () {
	// 	this.isCollapsedNewReply = !this.isCollapsedNewReply; 
	// 	$scope.tokens = [this.comment.author];	
	// };
};

function userCtrl ($scope, $routeParams, socket) {

	socket.emit('user:retrieve', {'_id':$routeParams.id}, function (err, data) {
		$scope.user = data;
	});
	socket.emit('user:getOwnerBoards',{'_id':$routeParams.id}, function (err, data) {
		$scope.boards = data;	
	});

	socket.emit('user:getJoinBoards',{'_id':$routeParams.id}, function (err, data) {
		if (data.length) 
		{
			$scope.joinboards = data;
			$scope.joinboard_flag = true;
		}else{
			$scope.joinboard_flag = false;
		}
	});
};


