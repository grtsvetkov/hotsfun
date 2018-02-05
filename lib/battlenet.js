BattleNetClientId = 'tr2ht26wpw45qh92edwnvyux9ma32dqd';

if (Meteor.isClient) {

    Meteor.loginWithBattlenet = function () {

        let credentialToken = encodeURIComponent(Random.id());

        let left = (typeof window.screenX !== 'undefined' ? window.screenX : window.screenLeft)
            + (((typeof window.outerWidth !== 'undefined' ? window.outerWidth : document.body.clientWidth) - 800) / 2);

        let top =  (typeof window.screenY !== 'undefined' ? window.screenY : window.screenTop)
            + (((typeof window.outerHeight !== 'undefined' ? window.outerHeight : document.body.clientHeight - 22) - 600) / 2);

        var popup = window.open(
            'https://eu.battle.net/oauth/authorize?response_type=code&client_id=' + BattleNetClientId +
            '&redirect_uri=' + encodeURIComponent('https://hotsfun.ru/_oauth/battlenet?close') +
            '&state=' + Package.base64.Base64.encode(JSON.stringify({
                loginStyle: 'popup',
                credentialToken: credentialToken,
                isCordova: Meteor.isCordova
            })),
            
            'Login', ('width=' + 800 + ',height=' + 600 + ',left=' + left + ',top=' + top + ',scrollbars=yes')
        );

        if (typeof popup === 'undefined') {
            // blocked by a popup blocker maybe?
            let err = new Error("The login popup was blocked by the browser");
            err.attemptedUrl = url;
            throw err;
        }

        if (popup.focus) {
            popup.focus();
        }

        var checkPopupOpen = setInterval(function() {
            try {
                var popupClosed = popup.closed || popup.closed === undefined;
            } catch (e) {
                return;
            }

            if (popupClosed) {
                clearInterval(checkPopupOpen);
                _.bind(Accounts.oauth.credentialRequestCompleteHandler(), null, credentialToken)();
            }
        }, 100);
    };
}