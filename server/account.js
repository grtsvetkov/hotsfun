Accounts.onLogin(function(options) {
   //console.log('onLogin', options) 
});

Accounts.onLogout(function(data) {
    Meteor.users.update({_id: data.user._id}, {$set: {pool : 0}});
});

Accounts.onExternalLogin(function(options, user){
    return options;
});

Accounts.onCreateUser(function(options, user){
    return _.extend(options, user) ;
});

Accounts.oauth.registerService('battlenet');

var BattlenetConfig = {
    service: 'battlenet',
    clientId: BattleNetClientId,
    secret: 'ceWePdTDdysPP6pTxXd7XunWmJ4cGzW7'
};

ServiceConfiguration.configurations.remove({service: 'battlenet'});

ServiceConfiguration.configurations.insert(BattlenetConfig);

Package.oauth.OAuth.registerService('battlenet', 2, null, function (query) {

    let responseContent, parsedResponse;

    try {
        responseContent = HTTP.call('POST',
            'https://eu.battle.net/oauth/token?grant_type=authorization_code' +
            '&code=' + query.code + '&client_id=' + BattlenetConfig.clientId +
            '&client_secret=' + BattlenetConfig.secret +
            "&redirect_uri=" + encodeURIComponent('https://hotsfun.ru/_oauth/battlenet?close')
        ).content;
    } catch (err) {
        throw new Error("Failed to complete OAuth handshake\n\n" + err.message);
    }

    try {
        parsedResponse = JSON.parse(responseContent);
    } catch (e) {
        throw new Error("Failed to complete OAuth handshake" + responseContent);
    }

    if (!parsedResponse.access_token) {
        throw new Error("Failed to complete OAuth handshake\n\ did not receive an oauth token.\n" + responseContent);
    }

    let accessToken = parsedResponse.access_token, expiresAt = (+new Date) + (1000 * parsedResponse.expires_in);

    try {
        responseContent = HTTP.call('GET', 'https://eu.api.battle.net/account/user?access_token=' + accessToken).content;
    } catch (err) {
        throw new Error("Failed to complete OAuth handshake\n\n" + err.message);
    }

    try {
        parsedResponse = JSON.parse(responseContent);
    } catch (e) {
        throw new Error("Failed to complete OAuth handshake" + responseContent);
    }

    let userData = parsedResponse;

    return {
        serviceData: {
            id: userData.id,
            accessToken: accessToken,
            expiresAt: expiresAt
        },
        options:{
            username: userData.battletag
        }
    };
});