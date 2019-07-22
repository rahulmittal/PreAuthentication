let AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

exports.handler = function (event, context, callback) {
	console.log("Pre-Auth trigger event - " + JSON.stringify(event));
	if (event.callerContext.clientId === "user-pool-app-client-id-to-be-blocked") {
		var error = new Error("Cannot authenticate users from this user pool app client");

		// Return error to Amazon Cognito
		callback(error, event);
	}
	console.log("get attempt count for user :" + event.request.userAttributes.sub);

	if (event.request.userAttributes.sub) {

		let attemptCount = 0;
		ddb.get({
			TableName: 'CognitoUser',
			Key: {
				'userId': event.request.userAttributes.sub
			}
		}).promise().then((data) => {
			console.log("GET Data  :" + JSON.stringify(data));
			if (isEmpty(data)) {
				attemptCount = 0;
			} else {
				attemptCount = data.Item.loginCount;
			}


			if (attemptCount >= 3) {
				throw {
					'errorCode': '101',
					'errorMessage': 'Max attempt exceeded',
					'attemptCount': attemptCount
				};
			}
       
			let user = event.request.userAttributes.sub;
			let count = ++attemptCount;
			event.response.attemptCount = count;
			console.log("attempt count put in db :" + count);

			ddb.put({
				TableName: 'CognitoUser',
				Item: {
					'loginCount': count,
					'userId': user
				}
			}).promise().then((data) => {
				console.log('PUT data :' + JSON.stringify(data));
			}).catch((err) => {
				console.log("ERROR while put: " + JSON.stringify(err));
			});
		}).catch((err) => {
			console.error("ERROR while get :" + JSON.stringify(err));
			//reject(err);
			event.response.error = err;
			callback(null, event);
		});


	}
	event.response.message = "Successfully executed";
	// Return to Amazon Cognito
	callback(null, event);
}
