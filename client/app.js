angular.module('iwx', ['ui.bootstrap', 'ui.utils', 'ui.router', 'ngAnimate', 'ngTable', 'angular-loading-bar',
  'monospaced.qrcode', 'chart.js', 'treeControl', 'ngSanitize', 'angular-simditor']);

angular.module('iwx').constant('eventType', {
    LOGIN: 'login',
    LOGOUT: 'logout',
    NOTIFICATION: 'notification'
});

angular.module('iwx').constant('notificationType', {
    INFO: {
        name: "INFO",
        timeout: 3000, // in 3 seconds
        class: "info",
        closable: false
    },
    LONG_INFO: {
        name: "LONG_INFO",
        timeout: -1,
        class: "info",
        closable: true
    },
    ERROR: {
        name: "ERROR",
        timeout: 10000, // in 10 seconds
        class: "error",
        closable: true
    },
    POPMSG: {
        name: "POPMSG",
        timeout: 10000,
        class: "info",
        closable: true
    },
});

angular.module('iwx').config(['$httpProvider', function($httpProvider) {
    //initialize get if not there
    if (!$httpProvider.defaults.headers.get) {
        $httpProvider.defaults.headers.get = {};
    }

    //disable IE ajax request caching
    $httpProvider.defaults.headers.get['If-Modified-Since'] = '0';

}]);

angular.module('iwx').config(
    function($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {
       
        $urlRouterProvider.otherwise('/');

        $httpProvider.interceptors.push('httpinterceptor');
    });

angular.module('iwx').run(function($rootScope) {

    $rootScope.safeApply = function(fn) {
        var phase = $rootScope.$$phase;
        if (phase === '$apply' || phase === '$digest') {
            if (fn && (typeof(fn) === 'function')) {
                fn();
            }
        } else {
            this.$apply(fn);
        }
    };

});


angular.module('iwx').controller('MainCtrl', function ($rootScope, $scope, $http, $timeout, $modal, userService, eventType, notificationType, $state) {
   
    $scope.clearNotification = function() {
        if (notificationPromise) {
            $timeout.cancel(notificationPromise);
            notificationPromise = null;
        }
        $scope.notification = null;

        $("#notificationModal").modal('hide');
        $scope.popmsg = null;
    };
    $scope.notificationDetails = function(details) {
        $modal.open({
            template: JSON.stringify(details),
            size: "sm",
        });
    };
    $rootScope.$on(eventType.LOGIN, function(event, user) {
        if (user.role.name === 'ADMIN') {
            $rootScope.message();
            if (!user.managed_community.password_code) {
                //生成社团管理密码
                $http.get('/api/admin/community').success(function (data) {});
            }
        }
        console.log(user);
        $scope.user = user;
    });
    $rootScope.$on(eventType.LOGOUT, function(event, user) {
        $scope.user = null;
    });

    $rootScope.$on(eventType.NOTIFICATION, function(event, n) {
        if (!n) {
            $scope.clearNotification();
            return;
        }

        if(n.type === 'POPMSG'){
            angular.forEach(notificationType, function(type) {
                if (type.name === n.type) {
                    $scope.popmsg = {
                        message: n.message,
                        title: n.title,
                        type: type
                    };
                }
            });

            $("#notificationModal").modal();
        } else {
            angular.forEach(notificationType, function(type) {
                if (type.name === n.type) {
                    $scope.notification = {
                        message: n.message,
                        type: type
                    };
                }

                if (n.payload) {
                    $scope.notification.payload = n.payload;
                }
            });

            if ($scope.notification && $scope.notification.type.timeout > 0) {
                if (notificationPromise) {
                    $timeout.cancel(notificationPromise);
                }
                notificationPromise = $timeout(function() {
                    notificationPromise = null;
                    $scope.notification = null;
                }, $scope.notification.type.timeout);
            }
        }
    });
});
