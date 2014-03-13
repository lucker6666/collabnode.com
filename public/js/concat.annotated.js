/**
 * collabApp Module
 *
 * Description
 */
angular.module('collabApp', [
  'collabApp.services',
  'ui',
  'ui.bootstrap'
]).config([
  '$routeProvider',
  '$locationProvider',
  function ($routeProvider, $locationProvider) {
    $routeProvider.when('/', {
      templateUrl: '/partials/boardlist',
      controller: boardCtrl
    }).when('/board/:boardId', {
      templateUrl: '/partials/cardlist',
      controller: memberCtrl
    }).when('/user/login', {
      templateUrl: '/partials/login',
      controller: appCtrl
    }).when('/user/:id', {
      templateUrl: '/partials/boardlist',
      controller: userCtrl
    }).when('/notification', {
      templateUrl: '/partials/notification',
      controller: notificationCtrl
    }).when('/user/register', {
      templateUrl: '/partials/register',
      controller: appCtrl
    }).otherwise({ redirectTo: '/' });
    $locationProvider.html5Mode(true);  // $stateProvider
                                        //       .state('card', {
                                        //           url: "/card/:cardId",
                                        //           views: {
                                        //               "cardDetail": {
                                        //                   templateUrl: "/partials/cardDetail"
                                        //               }
                                        // 	}
                                        //       });
  }
]).service('shareService', function () {
  var currentCard;
  var currentUser;
  var currentBoard;
  return {
    setCurrentCard: function (card) {
      currentCard = card;
    },
    getCurrentCard: function () {
      return currentCard;
    },
    setCurrentUser: function (user) {
      currentUser = user;
    },
    getCurrentUser: function () {
      return currentUser;
    },
    setCurrentBoard: function (board) {
      currentBoard = board;
    },
    getCurrentBoard: function () {
      return currentBoard;
    }
  };
});
// function subscribe ($scope, socket, type, id) {
// 	socket.emit(type+':subscribe',{"_id":id});
// };
function appCtrl($scope, $http, $location, socket, shareService) {
  $scope.logout = function () {
    // $location.path('/user/logout');
    $http.get('/user/logout').then(function () {
      // $location.path("user/login");
      // $scope.$apply(function() {
      $location.path('/user/login');  // });
    });
  };
  socket.emit('session:getCurrentUser', {}, function (err, user) {
    $scope.session = {};
    $scope.session.user = user;
    shareService.setCurrentUser(user);
  });
  socket.emit('message:getUnreads', {}, function (err, unreads) {
    $scope.messages = unreads;
  });
  socket.on('message:notification', function (notification) {
    $scope.messages.push(notification);
  });
  socket.on('message:reset', function (notification) {
    $scope.messages = [];
  });
}
function notificationCtrl($scope, $http, $location, socket, shareService, $rootScope) {
  var msgids = _.pluck($scope.messages, '_id');
  var boards = _.pluck($scope.messages, 'board');
  socket.emit('message:markRead', {
    'msgids': msgids,
    'boards': boards
  });
  //这里$scope.messgaes实际没有变化，child scope不能改变parent.scope的值吗？
  // $scope.messages = [];
  // $scope.parent.messages = [];
  socket.emit('message:list', {}, function (err, msgs) {
    var num2str = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
      ];
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
function memberCtrl($scope, socket, $routeParams, $http, shareService) {
  // alert($routeParams.boardId);
  // $scope.users = [
  // 	{id:1, nickname:"yaoyi"},
  // 	{id:2, nickname:"lance"}
  // ];
  socket.emit('board:subscribe', { '_id': $routeParams.boardId });
  socket.emit('board:retrieve', { '_id': $routeParams.boardId }, function (err, board) {
    shareService.setCurrentBoard(board);
  });
  socket.emit('board:getMembers', { '_id': $routeParams.boardId }, function (err, members) {
    $scope.members = members;
  });
  socket.on('board:addMember', function (member) {
    $scope.members.push(member);
  });
  socket.on('board:removeMember', function (memberId) {
    $scope.members = _.reject($scope.members, function (item) {
      return item._id == memberId;
    });
  });
  socket.on('board:quit', function (memberId) {
    $scope.members = _.reject($scope.members, function (item) {
      return item._id == memberId;
    });
  });
  $scope.search = function ($viewValue) {
    // alert($viewValue);
    return $http({
      method: 'GET',
      url: '/api/search/users',
      params: {
        q: $viewValue,
        boardId: $routeParams.boardId
      }
    }).then(function (data, status, headers, config) {
      $scope.results = data.data.users;
      return data.data.users;
    });
  };
  $scope.search_with_socket_A = function () {
    socket.emit('user:search', { 'q': $scope.username }, function (err, data) {
      $scope.results = data;
    });
  };
  $scope.search_with_socket_B = function ($viewValue) {
    return socket.emit('user:search', { 'q': $viewValue }, function (err, data) {
      return data;
    });
  };
  $scope.addMember = function () {
    var member = _.find($scope.results, function (result) {
        return result.email == $scope.email;
      });
    $scope.email = '';
    socket.emit('board:addMember', {
      'member': member,
      '_id': $routeParams.boardId
    });
  };
  $scope.removeMember = function () {
    var member = $scope.members[this.$index];
    socket.emit('board:removeMember', {
      'member': member,
      'boardId': $routeParams.boardId
    });
  };  // socket.on('board:addMember', function (member) {
      // 	$scope.members.push(member);
      // });
      // $scope.states = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Dakota', 'North Carolina', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'];
}
;
function cardItemDialogCtrl($scope, $location, $rootScope, shareService, dialog, $routeParams, socket) {
  $scope.dbChooser = $('#db-chooser'), $scope.isAttachCollapsed = true;
  $scope.isCollapsed = true;
  $scope.isDescCollapsed = true;
  $scope.isDisabled = true;
  $scope.card = shareService.getCurrentCard();
  $scope.user = shareService.getCurrentUser();
  $scope.board = shareService.getCurrentBoard();
  socket.emit('card:retrieve', { 'cardId': $scope.card._id }, function (err, card) {
    $scope.card = card;
  });
  socket.on('card:addAttachment', function (attachment) {
    $scope.card.attachments.push(attachment);
  });
  $scope.deleteCard = function () {
    if ($scope.user._id != $scope.card.owner._id && $scope.user._id != $scope.card.createdby) {
      alert('permission denied');
    } else {
      dialog.close();
      socket.emit('card:delete', {
        'cardId': $scope.card._id,
        'boardId': $routeParams.boardId
      });
    }
    $scope.cardname = '';
  };
  $scope.addDesc = function () {
    socket.emit('card:addDesc', {
      'cardId': $scope.card._id,
      'description': $scope.description,
      'boardId': $routeParams.boardId
    });
    $scope.card.description = $scope.description;
    $scope.description = '';
    $scope.isDescCollapsed = true;
  };
  $scope.chooseFromDropbox = function () {
    dropbox_options = {
      linkType: 'preview',
      multiselect: false,
      success: function (files) {
        // Required. Called when a user selects an item in the Chooser
        var attachment = {};
        attachment.name = files[0].name;
        attachment.link = files[0].link;
        // $scope.card.attachments.push(attachment);
        // $scope.$apply();
        socket.emit('card:addAttachment', {
          'cardId': $scope.card._id,
          'boardId': $routeParams.boardId,
          'attachment': attachment
        });  // alert("Here's the file link:" + files[0].link)
      },
      cancel: function () {
      }
    };
    // dropboxChooserService.choose(dropbox_options);
    Dropbox.choose(dropbox_options);
  };
}
function cardItemCtrl($scope, $location, $rootScope, shareService, $dialog) {
  $scope.openCardEditDialog = function ($event) {
    // $event.preventDefault();
    // $location.path("/card/"+$scope.card._id);
    shareService.setCurrentCard($scope.card);
    // $('#cardDetailModal').modal();
    $scope.opts = {
      backdrop: true,
      keyboard: true,
      backdropClick: true,
      templateUrl: '/partials/carddetail',
      controller: 'cardItemDialogCtrl',
      dialogClass: 'modal card-detail-modal'
    };
    var d = $dialog.dialog($scope.opts);
    d.open().then(function (result) {
      if (result) {
        alert('dialog closed with result: ' + result);
      }
    });
  };  // $scope.close = function(result){
      //    	dialog.close(result);
      //  	};
}
function cardCtrl($scope, socket, $routeParams, $location) {
  // console.log($scope.member._id);
  if ($scope.member) {
    socket.emit('card:list', {
      'boardId': $routeParams.boardId,
      'userId': $scope.member._id
    }, function (err, cards) {
      $scope.cards = cards;
    });
  }
  socket.on('card:create', function (card) {
    if (card.owner == $scope.member._id) {
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
      if (card._id == data._id) {
        card.description = data.description;
      }
      return card;
    });
  });
  $scope.createCard = function createCard($event) {
    console.log($scope.members[this.$index]);
    var owner = $scope.members[this.$index];
    socket.emit('card:create', {
      'title': $scope.card_title,
      'boardId': $routeParams.boardId,
      'owner': owner
    });
    $scope.card_title = '';
  };
  $scope.filterByOwner = function (card) {
    return card.owner == $scope.member._id;
  };
}
;
function boardCtrl($scope, socket) {
  socket.emit('user:retrieve', {}, function (err, data) {
    $scope.user = data;
  });
  socket.emit('board:getOwnBoards', {}, function (err, data) {
    $scope.boards = data;
  });
  socket.emit('board:getJoinBoards', {}, function (err, data) {
    if (data.length) {
      $scope.joinboards = data;
      $scope.joinboard_flag = true;
    } else {
      $scope.joinboard_flag = false;
    }
  });
  socket.on('board:create', function (board) {
    $('#createBoardModal').modal('hide');
    $scope.boards.push(board);
  });
  socket.on('board:delete', function (result) {
    // $scope.boards = _.without($scope.boards, board);
    if (result.code == 0) {
      $scope.boards = _.reject($scope.boards, function (item) {
        return item._id == result._id;
      });
      console.log($scope.boards);
    } else {
      alert('please remove the board members first');
    }
  });
  $scope.createBoard = function () {
    // alert($scope.boards);
    socket.emit('board:create', { 'name': $scope.board_name }, function (err, board) {
    });
    $scope.board_name = '';
  };
  $scope.deleteBoard = function (data) {
    // $event.preventDefault(); //angular.js这个没有效果
    // $('.board-operation-menu').toggle();
    socket.emit('board:delete', { '_id': data });
  };
  $scope.quitBoard = function () {
    var board = $scope.joinboards[this.$index];
    socket.emit('board:quit', {
      '_id': board._id,
      'owner': board.owner,
      'name': board.name
    }, function (err, result) {
      if (result == 1) {
        $scope.joinboards = _.reject($scope.joinboards, function (item) {
          return item._id == board._id;
        });
        if ($scope.joinboards.length == 0) {
          $scope.joinboard_flag = false;
        }
      }
    });
  };
}
;
function commentCtrl($scope, socket, $routeParams, $http) {
  $scope.isCollapsedNewReply = true;
  $scope.isDisabled = true;
  socket.on('comment:create', function (comment) {
    var num2str = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
      ];
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
  socket.emit('comment:list', { 'cardId': $scope.card._id }, function (err, comments) {
    var num2str = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
      ];
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
    if ($scope.user._id != $scope.card.owner._id) {
      var token = {};
      token._id = $scope.card.owner._id;
      token.nickname = $scope.card.owner.nickname;
      token.email = $scope.card.owner.email;
      token.md5 = $scope.card.owner.md5;
      var isContained = _.some($scope.tokens, function (item) {
          return item._id == token._id;
        });
      if (!isContained) {
        $scope.tokens.push(token);
      }
    }
    socket.emit('comment:create', {
      'cardId': $scope.card._id,
      'content': $scope.newcomment,
      'boardId': $routeParams.boardId,
      'boardName': $scope.board.name,
      'at': $scope.tokens
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
    if ($scope.newcomment == '') {
      $scope.isDisabled = true;
      return;
    }
    $scope.isDisabled = false;
    var at_pos = $scope.newcomment.indexOf('@');
    console.log(at_pos);
    var index = $scope.newcomment.length - 1;
    console.log(index);
    console.log($event.keyCode);
    var isSearchable;
    if (index >= at_pos && at_pos >= 0 && $event.keyCode != 32 && $event.keyCode != 8 && $event.keyCode != 50 && $event.keyCode != 16 && $event.keyCode != 17 && $event.keyCode != 18) {
      isSearchable = true;
    } else {
      isSearchable = false;
      $scope.showresult = false;
    }
    if (isSearchable) {
      var query = $scope.newcomment.substr(at_pos + 1, index);
      $http({
        method: 'GET',
        url: '/api/search/members',
        params: {
          q: query,
          boardId: $routeParams.boardId
        }
      }).success(function (data, status, headers, config) {
        var results = _.reject(data.members, function (member) {
            return _.some($scope.tokens, function (token) {
              return token._id == member._id;
            });
          });
        if (results.length != 0) {
          $scope.showresult = true;
        } else {
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
    if (at_pos >= 0) {
      $scope.newcomment = $scope.newcomment.substr(0, at_pos);
      ;
    }
    if ($scope.newcomment == '') {
      $scope.isDisabled = true;
    }
    $scope.showresult = false;
  };
  $scope.removeToken = function () {
    $scope.tokens.splice(this.$index, 1);
  };  // $scope.openReplyInput = function () {
      // 	this.isCollapsedNewReply = !this.isCollapsedNewReply; 
      // 	$scope.tokens = [this.comment.author];	
      // };
}
;
function userCtrl($scope, $routeParams, socket) {
  socket.emit('user:retrieve', { '_id': $routeParams.id }, function (err, data) {
    $scope.user = data;
  });
  socket.emit('user:getOwnerBoards', { '_id': $routeParams.id }, function (err, data) {
    $scope.boards = data;
  });
  socket.emit('user:getJoinBoards', { '_id': $routeParams.id }, function (err, data) {
    if (data.length) {
      $scope.joinboards = data;
      $scope.joinboard_flag = true;
    } else {
      $scope.joinboard_flag = false;
    }
  });
}
;
angular.module('collabApp.directives', []).directive('autoComplete', [
  '$timeout',
  function ($timeout) {
    return function (scope, iElement, iAttrs) {
      iElement.autocomplete({
        source: scope[iAttrs.uiItems],
        select: function () {
          $timeout(function () {
            iElement.trigger('input');
          }, 0);
        }
      });
    };
  }
]);
'use strict';
/**
  * dropboxChooserModule
  *
  * @author Kevin Kirchner
  **/
var dropboxChooserModule = angular.module('dropboxChooserModule', []);
/**
  * dropboxChooserModule constant
  *
  * @note: Add your API key in this constant
  * @author: Kevin Kirchner
  **/
dropboxChooserModule.constant('DROPBOX_CONFIG', {
  BASE_URL: 'https://www.dropbox.com',
  API_KEY: 'bu9otnx7trxsblk'
});
/**
  * dropboxChooserModule service
  *
  * Access the dropboxChooserService from other controllers if you need to
  * @author Kevin Kirchner
  **/
dropboxChooserModule.factory('dropboxChooserService', [
  'DROPBOX_CONFIG',
  function (DROPBOX_CONFIG) {
    var Dropbox = { appKey: DROPBOX_CONFIG.API_KEY };
    Dropbox.addListener = function (obj, event, handler) {
      if (obj.addEventListener) {
        obj.addEventListener(event, handler, false);
      } else {
        obj.attachEvent('on' + event, handler);
      }
    };
    Dropbox.removeListener = function (obj, event, handler) {
      if (obj.removeEventListener) {
        obj.removeEventListener(event, handler, false);
      } else {
        obj.detachEvent('on' + event, handler);
      }
    };
    Dropbox._chooserUrl = function (options) {
      var linkType = options.linkType == 'direct' ? 'direct' : 'preview';
      var triggerSrc = options._trigger || 'js';
      //used for logging.  default is 'js'
      return DROPBOX_CONFIG.BASE_URL + '/chooser?origin=' + encodeURIComponent(window.location.protocol + '//' + window.location.host) + '&app_key=' + encodeURIComponent(this.appKey) + '&link_type=' + linkType + '&trigger=' + triggerSrc;
    };
    Dropbox._createWidgetElement = function (options) {
      var widget = document.createElement('iframe');
      widget.src = Dropbox._chooserUrl(options);
      widget.style.display = 'block';
      widget.style.width = '660px';
      widget.style.height = '440px';
      widget.style.backgroundColor = 'white';
      widget.style.border = 'none';
      return widget;
    };
    Dropbox._handleMessageEvent = function (evt, closefn, success, cancel) {
      var data = JSON.parse(evt.data);
      if (data.method == 'files_selected') {
        if (closefn)
          closefn();
        if (success)
          success([data.params]);
      } else if (data.method == 'close_dialog') {
        if (closefn)
          closefn();
        if (cancel)
          cancel();
      }
    };
    Dropbox.createWidget = function (options) {
      var widget = Dropbox._createWidgetElement(options);
      widget._handler = function (evt) {
        if (evt.source == widget.contentWindow) {
          Dropbox._handleMessageEvent(evt, null, options.success, options.cancel);
        }
      };
      Dropbox.addListener(window, 'message', widget._handler);
      return widget;
    };
    Dropbox.cleanupWidget = function (widget) {
      if (!widget._handler)
        throw 'Invalid widget!';
      Dropbox.removeListener(window, 'message', widget._handler);
      delete widget._handler;
    };
    Dropbox.choose = function (options) {
      if (typeof options == 'undefined') {
        throw 'You must pass in options';
      }
      if (options.iframe) {
        var widget = Dropbox._createWidgetElement(options);
        var outer = document.createElement('div');
        outer.style.position = 'fixed';
        outer.style.left = outer.style.right = outer.style.top = outer.style.bottom = '0px';
        outer.style.zIndex = '1000';
        var bg = document.createElement('div');
        bg.style.position = 'absolute';
        bg.style.left = bg.style.right = bg.style.top = bg.style.bottom = '0px';
        bg.style.backgroundColor = 'rgb(160, 160, 160)';
        bg.style.opacity = '0.2';
        bg.style.filter = 'progid:DXImageTransform.Microsoft.Alpha(Opacity=20)';
        // IE8.
        var inner = document.createElement('div');
        inner.style.position = 'relative';
        inner.style.width = '660px';
        inner.style.margin = '125px auto 0px auto';
        inner.style.border = '1px solid #ACACAC';
        inner.style.boxShadow = 'rgba(0, 0, 0, .2) 0px 4px 16px';
        inner.appendChild(widget);
        outer.appendChild(bg);
        outer.appendChild(inner);
        document.body.appendChild(outer);
        var handler = function (evt) {
          if (evt.source == widget.contentWindow) {
            Dropbox._handleMessageEvent(evt, function () {
              document.body.removeChild(outer);
              Dropbox.removeListener(window, 'message', handler);
            }, options.success, options.cancel);
          }
        };
        Dropbox.addListener(window, 'message', handler);
      } else {
        var w = 660;
        var h = 440;
        var left = (window.screenX || window.screenLeft) + ((window.outerWidth || document.documentElement.offsetWidth) - w) / 2;
        var top = (window.screenY || window.screenTop) + ((window.outerHeight || document.documentElement.offsetHeight) - h) / 2;
        var popup = window.open(Dropbox._chooserUrl(options), 'dropbox', 'width=' + w + ',height=' + h + ',left=' + left + ',top=' + top + ',resizable=yes,location=yes');
        popup.focus();
        var handler = function (evt) {
          if (evt.source == popup || evt.source == Dropbox._ieframe.contentWindow) {
            Dropbox._handleMessageEvent(evt, function () {
              popup.close();
              Dropbox.removeListener(window, 'message', handler);
            }, options.success, options.cancel);
          }
        };
        Dropbox.addListener(window, 'message', handler);
      }
    };
    return Dropbox;
  }
]);
/**
  * dropboxChooserModule run
  *
  * Initialize dropbox chooser by adding some css to the page and preparing an iframe for IE
  * @author Kevin Kirchner
  **/
dropboxChooserModule.run([
  'dropboxChooserService',
  'DROPBOX_CONFIG',
  function (dropboxChooserService, DROPBOX_CONFIG) {
    // Inject CSS
    var css = document.createElement('style');
    css.type = 'text/css';
    var cssText = '.dropbox-chooser { width: 152px; height: 25px; cursor: pointer;' + ' background: url(\'' + DROPBOX_CONFIG.BASE_URL + '/static/images/widgets/chooser-button-sprites.png\') 0 0}' + '.dropbox-chooser:hover { background-position: 0 -25px}' + '.dropbox-chooser:active { background-position: 0 -50px}' + '.dropbox-chooser-used { background-position: 152px 0 }' + '.dropbox-chooser-used:hover { background-position: 152px -25px}' + '.dropbox-chooser-used:active { background-position: 152px -50px}';
    if (css.styleSheet) {
      // IE
      css.styleSheet.cssText = cssText;
    } else {
      css.textContent = cssText;
    }
    document.getElementsByTagName('head')[0].appendChild(css);
    // Inject ieFrame on DOM load
    (function () {
      var ieframe = document.createElement('iframe');
      ieframe.setAttribute('id', 'dropbox_xcomm');
      ieframe.setAttribute('src', DROPBOX_CONFIG.BASE_URL + '/fp/xcomm');
      ieframe.style.display = 'none';
      document.getElementsByTagName('body')[0].appendChild(ieframe);
      dropboxChooserService._ieframe = ieframe;
    });
  }
]);
/**
  * dropboxChooserModule directive
  *
  * a dropboxchooser element to use in your markup
  * Use this markup: <dropbox-chooser local-model="yourLocalModel"></dropbox-chooser>
  * @author Kevin Kirchner
  **/
dropboxChooserModule.directive('dropboxChooser', [
  'dropboxChooserService',
  function (dropboxChooserService) {
    return {
      priority: 1,
      restrict: 'E',
      transclude: true,
      scope: { localModel: '=' },
      template: '<div class="dropbox-chooser"><input type="dropbox-chooser" name="selected-file" style="visibility: hidden;" ng-show="false" /></div>',
      controller: 'DropboxChooserCtrl',
      link: function postLink($scope, $element, $attrs) {
        $scope.inputEl = $element.find('input')[0];
        $scope.btnEl = $element[0];
        $element.bind('click', function () {
          dropboxChooserService.choose({
            success: function (files) {
              $scope.files = files;
              $scope.inputEl.value = $scope.files[0].url;
              // Send off success event
              $scope.$emit('DbxChooserSuccess');
              $scope.btnEl.className = 'dropbox-chooser dropbox-chooser-used';
            },
            cancel: function () {
              // Send off cancel event
              $scope.$emit('DbxChooserCancel');
            },
            linkType: $scope.inputEl.getAttribute('data-link-type') ? $scope.inputEl.getAttribute('data-link-type') : 'preview',
            _trigger: 'button'
          });
        });
      },
      replace: true
    };
  }
]);
/**
  * dropboxChooserModule controller
  *
  * a controller for the dropboxchooser directive
  * @author Kevin Kirchner
  **/
dropboxChooserModule.controller('DropboxChooserCtrl', [
  '$scope',
  function ($scope) {
    $scope.$on('DbxChooserSuccess', function (event) {
      var localModel = event.targetScope.localModel;
      var files = event.targetScope.files;
      var fileUrl = files[0].url;
      // update the local model with the files
      localModel.fileUrl = fileUrl;
      // then run $scope.$digest() to update it anywhere you have {{localModel.fileUrl}}
      $scope.$digest();
    });
    $scope.$on('DbxChooserCancel', function (event) {
      console.log('fail');
    });
  }
]);
'use strict';
/* Services */
// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('collabApp.services', ['ngResource']).value('version', '0.1').factory('socket', [
  '$rootScope',
  function ($rootScope) {
    var socket = io.connect();
    return {
      on: function (eventName, callback) {
        socket.on(eventName, function () {
          var args = arguments;
          $rootScope.$apply(function () {
            callback.apply(socket, args);
          });
        });
      },
      emit: function (eventName, data, callback) {
        socket.emit(eventName, data, function () {
          var args = arguments;
          $rootScope.$apply(function () {
            if (callback) {
              callback.apply(socket, args);
            }
          });
        });
      }
    };
  }
]);
$(function ($, _, Backbone, io) {
  'use strict';
  var Todo, TodoList, Todos, TodoView, AppView, App, socket;
  socket = io.connect();
  // Todo Model
  // ----------
  // Our basic **Todo** model has `title`, `order`, and `done` attributes.
  Todo = Backbone.Model.extend({
    idAttribute: '_id',
    noIoBind: false,
    socket: socket,
    url: function () {
      return '/todo' + (this.id ? '/' + this.id : '');
    },
    defaults: function () {
      return {
        title: 'empty todo...',
        order: Todos.nextOrder(),
        done: false
      };
    },
    initialize: function () {
      if (!this.get('title')) {
        this.set({ 'title': this.defaults.title });
      }
      this.on('serverChange', this.serverChange, this);
      this.on('serverDelete', this.serverDelete, this);
      this.on('modelCleanup', this.modelCleanup, this);
      if (!this.noIoBind) {
        this.ioBind('update', this.serverChange, this);
        this.ioBind('delete', this.serverDelete, this);
        this.ioBind('lock', this.serverLock, this);
        this.ioBind('unlock', this.serverUnlock, this);
      }
    },
    toggle: function () {
      this.save({ done: !this.get('done') });
    },
    clear: function (options) {
      this.destroy(options);
      this.modelCleanup();
    },
    serverChange: function (data) {
      data.fromServer = true;
      this.set(data);
    },
    serverDelete: function (data) {
      if (typeof this.collection === 'object') {
        this.collection.remove(this);
      } else {
        this.trigger('remove', this);
      }
    },
    serverLock: function (success) {
      if (success) {
        this.locked = true;  //this.trigger('lock', this);
      }
    },
    serverUnlock: function (success) {
      if (success) {
        this.locked = false;
      }
    },
    modelCleanup: function () {
      this.ioUnbindAll();
      return this;
    },
    locked: false,
    lock: function (options) {
      if (!this._locked) {
        options = options ? _.clone(options) : {};
        var model = this, success = options.success;
        options.success = function (resp, status, xhr) {
          model.locked = true;
          if (success) {
            success(model, resp);
          } else {
            model.trigger('lock', model, resp, options);
          }
        };
        options.error = Backbone.wrapError(options.error, model, options);
        return (this.sync || Backbone.sync).call(this, 'lock', this, options);
      }
    },
    unlock: function (options) {
      if (this.locked) {
        options = options ? _.clone(options) : {};
        var model = this, success = options.success;
        options.success = function (resp, status, xhr) {
          model._locked = false;
          if (success) {
            success(model, resp);
          } else {
            model.trigger('unlock', model, resp, options);
          }
        };
        options.error = Backbone.wrapError(options.error, model, options);
        return (this.sync || Backbone.sync).call(this, 'unlock', this, options);
      }
    }
  });
  // Todo Collection
  // ---------------
  TodoList = Backbone.Collection.extend({
    model: Todo,
    socket: socket,
    url: function () {
      return '/todo' + (this.id ? '/' + this.id : '');
    },
    initialize: function () {
      this.on('collectionCleanup', this.collectionCleanup, this);
      socket.on('/todo:create', this.serverCreate, this);
    },
    serverCreate: function (data) {
      if (data) {
        // make sure no duplicates, just in case
        var todo = Todos.get(data._id);
        if (typeof todo === 'undefined') {
          Todos.add(data);
        } else {
          data.fromServer = true;
          todo.set(data);
        }
      }
    },
    collectionCleanup: function (callback) {
      this.ioUnbindAll();
      this.each(function (model) {
        model.modelCleanup();
      });
      return this;
    },
    done: function () {
      return this.filter(function (todo) {
        return todo.get('done');
      });
    },
    remaining: function () {
      return this.without.apply(this, this.done());
    },
    filterbyOwner: function (uid, data) {
      return _.intersection(this.where({ 'owner': uid }), data);
    },
    nextOrder: function () {
      if (!this.length) {
        return 1;
      }
      return this.last().get('order') + 1;
    },
    comparator: function (todo) {
      return todo.get('order');
    }
  });
  // Create our global collection of **Todos**.
  Todos = new TodoList();
  // Todo Item View
  // --------------
  // The DOM element for a todo item...
  TodoView = Backbone.View.extend({
    tagName: 'li',
    template: _.template($('#item-template').html()),
    events: {
      'click .toggle': 'toggleDone',
      'dblclick .view': 'edit',
      'click a.destroy': 'clear',
      'keypress .edit': 'updateOnEnter',
      'blur .edit': 'close'
    },
    initialize: function () {
      this.model.on('change', this.render, this);
      this.model.on('lock', this.serverLock, this);
      this.model.on('unlock', this.serverUnlock, this);
      Todos.on('remove', this.serverDelete, this);
    },
    render: function () {
      this.$el.html(this.template(this.model.toJSON()));
      this.$el.toggleClass('done', this.model.get('done'));
      this.input = this.$('.edit');
      return this;
    },
    toggleDone: function () {
      this.model.toggle();
    },
    edit: function () {
      if (!this.model.locked) {
        this.$el.addClass('editing');
        this.input.focus();
        this.model.lock();
      }
    },
    close: function () {
      var value = this.input.val();
      if (!value) {
        this.clear();
      }
      this.model.save({ title: value });
      this.$el.removeClass('editing');
      this.model.unlock();
    },
    updateOnEnter: function (e) {
      if (e.keyCode === 13) {
        this.close();
      }
    },
    clear: function () {
      if (!this.model.locked) {
        this.model.clear();
      }
    },
    serverDelete: function (data) {
      if (data.id === this.model.id) {
        this.model.clear({ silent: true });
        this.$el.remove();
      }
    },
    serverLock: function () {
      if (!this.$el.hasClass('editing') && this.model.locked) {
        this.$el.addClass('locked');
        this.$('.toggle').attr('disabled', true);
      }
    },
    serverUnlock: function () {
      this.$el.removeClass('locked');
      this.$('.toggle').attr('disabled', false);
    }
  });
  // The Application
  // ---------------
  // Our overall **AppView** is the top-level piece of UI.
  AppView = Backbone.View.extend({
    uids: [],
    inputs: [],
    el: $('#card-container'),
    statsTemplate: _.template($('#stats-template').html()),
    events: {
      'click #clear-completed': 'clearCompleted',
      'click #toggle-all': 'toggleAllComplete'
    },
    initialize: function (initalData) {
      var user, eid, eventKey, uid;
      for (user in initalData['users']) {
        uid = initalData['users'][user]._id;
        eid = 'new-todo-' + uid;
        this.uids[eid] = uid;
        eventKey = 'keypress #' + eid;
        this.events[eventKey] = 'createOnEnter';
      }
      this.delegateEvents();
      // this.allCheckbox = this.$("#toggle-all")[0];
      Todos.on('add', this.addOne, this);
      Todos.on('reset', this.addAll, this);
      Todos.on('all', this.render, this);
      Todos.fetch({
        success: function (todos, models) {
          var data = initalData.todo, locks = data && data.locks ? data.locks : [], model;
          _.each(locks, function (lock) {
            model = todos.get(lock);
            if (model) {
              model.lock();
            }
          });
        }
      });
    },
    render: function () {
      var footcontent = [];
      for (var i in this.uids) {
        var uid = this.uids[i];
        var done = Todos.filterbyOwner(uid, Todos.done()).length, remaining = Todos.filterbyOwner(uid, Todos.remaining()).length;
        footcontent[uid] = this.statsTemplate({
          done: done,
          remaining: remaining
        });
        this.$('#main-' + uid).hide();
        this.$('#footer-' + uid).hide();
      }
      if (Todos.length) {
        Todos.each(function (todo) {
          var id = todo.get('owner');
          $('#main-' + id).show();
          $('#footer-' + id).show();
          $('#footer-' + id).html(footcontent[id]);
        });
      }  // this.allCheckbox.checked = !remaining;
    },
    addOne: function (todo) {
      var view = new TodoView({ model: todo });
      $('#todo-list-' + todo.get('owner')).append(view.render().el);
    },
    addAll: function () {
      Todos.each(this.addOne);
    },
    createOnEnter: function (e) {
      if (e.keyCode !== 13) {
        return;
      }
      var id = e.target.id;
      if (!$('#' + id).val()) {
        return;
      }
      var str = $('#' + id).val();
      var reg = /\d{1,2}:\d{2}([ap]m)/;
      var validTime = str.match(reg);
      validTime = validTime == null ? '' : validTime[0] + ' ';
      var validDate = str.match(/[Mm]onday|[Tt]uesday|[Ww]ensday|[Tt]hursday|[Ff]riday|[Ss]aturday|[Ss]unday/);
      validDate = validDate == null ? '' : validDate;
      var t = new Todo({
          title: $('#' + id).val(),
          owner: this.uids[id],
          deadline: validTime + validDate
        });
      t.save();
      //Todos.create({title: this.input.val()});
      $('#' + id).val('');
    },
    clearCompleted: function () {
      _.each(Todos.done(), function (todo) {
        todo.clear();
      });
      return false;
    },
    toggleAllComplete: function () {
      var done = this.allCheckbox.checked;
      Todos.each(function (todo) {
        todo.save({ 'done': done });
      });
    }
  });
  // Finally, we kick things off by creating the **App** on successful socket connection
  socket.emit('connect', ['todo'], function (err, data) {
    if (err) {
      console.log('Unable to connect.');
    } else {
      App = new AppView(data);
    }
  });
}(jQuery, _, Backbone, io));