angular.module('iwx').factory('httpinterceptor', function($q, $rootScope, eventType) {
	var auth_token;
	return {
		'request': function(config) {
			if (config.url.indexOf('api') === -1) {
				return config || $q.when(config);
			}
			// clear notifiation bar
			// $rootScope.$emit(eventType.NOTIFICATION, null);
			// $rootScope.$emit(eventType.NOTIFICATION, {
			// 		'type': 'INFO',
			// 		'message': '加载中...'
			// });
			// console.log(config);
			// console.log(auth_token);
			if (config && auth_token) {
				// console.log(auth_token);
				// console.log(config);
				config.headers['Authentication-Token'] = auth_token;
			}
			return config || $q.when(config);
		},
		'requestError': function(rejection) {
			$rootScope.$emit(eventType.NOTIFICATION, {
				// 'type': 'ERROR',
				'type': 'POPMSG',
				'message': rejection
			});
			return $q.reject(rejection);
		},
		'response': function(response) {
			if (response && response.data && response.data.status === 'error') {
				$rootScope.$emit(eventType.NOTIFICATION, {
					//'type': 'ERROR',//将提示信息的方式修改为modal弹出框的形式
					'type': 'POPMSG',
					'title': '警告',
					'message': response.data.message,
					'payload': response.data.payload
				});
				return $q.reject(response);
			}
			if (response && response.data && response.data.status === 'success') {
				response.data = response.data.data;
				return response;
			}
			return response || $q.when(response);
		},
		'responseError': function(rejection) {
			// Handle Unauthorized error in user service
			if (rejection.status !== 401) {
				$rootScope.$emit(eventType.NOTIFICATION, {
						'type': 'ERROR',
						// 'type': 'POPMSG',
						'title': '警告',
						'message': rejection.statusText ? rejection.statusText : '未知错误'
				});
			}
			return $q.reject(rejection);
		},
		'setAuthToken' : function(token) {
			auth_token = token;
			// console.log(auth_token);
		}
	};
});