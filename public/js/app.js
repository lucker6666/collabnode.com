/**
 * collabApp Module
 *
 * Description
 */
angular.module('collabApp', ['collabApp.services', 'ui','ui.bootstrap']).
	config(function ($routeProvider, $locationProvider) {
		$routeProvider
			.when('/',{
				templateUrl:'/partials/boardlist', controller:boardCtrl
			})
			.when('/board/:boardId',{
				templateUrl:'/partials/cardlist', controller:memberCtrl
			})
      .when('/user/login',{
        templateUrl:'/partials/login', controller:appCtrl
      })
      .when('/user/:id',{
        templateUrl:'/partials/boardlist', controller:userCtrl
      })
			.when('/notification',{
				templateUrl:'/partials/notification', controller:notificationCtrl
			})
			
			// .when('/user/logout',{
			// 	redirectTo: '/user/logout'	
			// })
			.when('/user/register',{
				templateUrl:'/partials/register', controller:appCtrl
			})
			// .when('/card/:cardId',{
			// 	templateUrl:'/partials/carddetail',
			// 	view: 'cardDetail'
			// });
			.otherwise({redirectTo: '/'});
		$locationProvider.html5Mode(true);
		// $stateProvider
  //       .state('card', {
  //           url: "/card/:cardId",
  //           views: {
  //               "cardDetail": {
  //                   templateUrl: "/partials/cardDetail"
  //               }
		// 	}
  //       });
	})
	.service('shareService', function () {
        var currentCard;
        var currentUser;
        var currentBoard;
        return {
            setCurrentCard : function(card) {
                currentCard = card;
            },
            getCurrentCard : function() {
                return currentCard;
            },
            setCurrentUser : function(user) {
                currentUser = user;
            },
            getCurrentUser : function() {
                return currentUser;
            },
            setCurrentBoard : function(board) {
                currentBoard = board;
            },
            getCurrentBoard : function() {
                return currentBoard;
            }
       };
    });