angular.module('iwx').service('userService', function ($rootScope, $q, $http, httpinterceptor, $state, eventType) {
    // For now, we will always load user object, even if we just need parts of it.
    // If bandwidth is the problem, we can improve it.
    // 修改提示信息方式为modal弹出窗体
    var that = this;
    this.user = null;

    this.login = function(user, next) {
        $http.post('/api/auth/admin/login', user).success(function(response) {
            httpinterceptor.setAuthToken(response.auth_token);
            that.user = response.user;
            $rootScope.$emit(eventType.LOGIN, that.user);
            $state.go(next);
        });
    };

    this.logout = function() {
        $http.post('/api/auth/admin/logout').success(function() {
            that.user = null;
            httpinterceptor.setAuthToken(null);
            $rootScope.$emit(eventType.LOGOUT);
            $state.go('welcome');
        });
    };

    this.load = function(noLogin) {
        // console.log(this.user);
        if (this.user) {
            return $q.when(this.user);
        }
        var deferred = $q.defer();
        $http.get('/api/auth/refreshtoken').success(function(response) {
            that.user = response.user;
            // console.log(response.auth_token);
            httpinterceptor.setAuthToken(response.auth_token);
            deferred.resolve(that.user);
        }).error(function(e) {
            $rootScope.$emit(eventType.NOTIFICATION, null);
            if (noLogin) {
                $state.go('welcome');
            }
        });
        return deferred.promise;
    };

    this.resetPassword = function(email) {
        $rootScope.$emit(eventType.NOTIFICATION, {
            'type': 'LONG_INFO',
            'message': '加载中...'
        });
        $http.post('/api/auth/reset', {'email': email}).success(function() {
            $rootScope.$emit(eventType.NOTIFICATION, {
                // 'type': 'INFO',
                'type': 'POPMSG',
                'title': '消息',
                'message': '已发送邮件到' + email + '， 请根据指示找回密码.'
            });
        });
    };
    this.changePassword = function(data) {
        /*$rootScope.$emit(eventType.NOTIFICATION, {
            'type': 'LONG_INFO',
            'message': '加载中...'
        });*/
        $http.post('/api/auth/change', data).success(function(result) {
            if (result.response.errors) {
                var errors = result.response.errors;
                $rootScope.$emit(eventType.NOTIFICATION, {
                    // 'type': 'ERROR',
                    'type': 'POPMSG',
                    'title': '警告',
                    'message': errors[_.keys(errors)[0]][0]
                });
            } else {
                $rootScope.$emit(eventType.NOTIFICATION, {
                    // 'type': 'INFO',
                    'type': 'POPMSG',
                    'title': '消息',
                    'message': '密码修改成功，请重新登录。'
                });
                that.user = null;
                httpinterceptor.setAuthToken(null);
                $rootScope.$emit(eventType.LOGOUT);
                $state.go('welcome');
            }
        });
    };
    this.update = function (data) {
        $http.put('/api/iwx_un/update/me', data, {
            transformRequest: angular.identity,
            headers: {
                'Content-Type': undefined
            }
        }).success(function (result) {
            $rootScope.$emit(eventType.NOTIFICATION, {
                // 'type': 'INFO',
                'type': 'POPMSG',
                'title': '消息',
                'message': '信息修改成功，请重新登录。'
            });
            $http.post('/api/auth/admin/logout').success(function() {
                that.user = null;
                httpinterceptor.setAuthToken(null);
                $rootScope.$emit(eventType.LOGOUT);
                $state.go('welcome');
            });
        });
    };
    this.update_password = function (data) {
        $http.post('/api/iwx_un/change_password', data, {
           headers: {
                'Content-Type': 'application/json'
            } 
        }).success(function (data) {
            $rootScope.$emit(eventType.NOTIFICATION, {
                // 'type': 'INFO',
                'type': 'POPMSG',
                'title': '消息',
                'message': '密码修改成功，请重新登录。'
            });
            that.user = null;
            httpinterceptor.setAuthToken(null);
            $rootScope.$emit(eventType.LOGOUT);
            $state.go('welcome');
        });
    };
});