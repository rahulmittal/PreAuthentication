let AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

exports.handler = function (event, context, callback) {
    console.log("Pre-Auth trigger event - " + JSON.stringify(event));
    if (event.callerContext.clientId === "user-pool-app-client-id-to-be-blocked") {
        var error = new Error("Cannot authenticate users from this user pool app client");

        // Return error to Amazon Cognito
        callback(error, event);
    }
    console.log("putting login attemmpt in DB :");
    let user = "rahulmittal";
    let count = 1;
    ddb.put({
        TableName: 'CognitoUser',
        Item: { 'loginCount': count, 'userId': user }
    }).promise()
        .then((data) => {
            console.log('data :' + JSON.stringify(data));
        })
        .catch((err) => {
            console.log("ERROR : " + JSON.stringify(err));
        });

    // Return to Amazon Cognito
    callback(null, event);
    //callback(null, {"message": "Successfully executed"});
}