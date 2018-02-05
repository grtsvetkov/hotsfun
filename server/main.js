let isPrivateAddress = function (address) {
    return ((/^\s*(127\.0\.0\.1|::1)\s*$/.test(address)) || (/^\s*(192\.168\.\d+\.\d+)\s*$/.test(address))) ? true : false;
};

let oldHttpServerListeners = WebApp.httpServer.listeners("request").slice(0),
    url = Npm.require("url");

WebApp.httpServer.removeAllListeners("request");

WebApp.httpServer.addListener("request", function (req, res) {
    let args = arguments,

        remoteAddress = req.connection.remoteAddress || req.socket.remoteAddress,

        isPrivate = isPrivateAddress(remoteAddress) && (!req.headers["x-forwarded-for"] || _.all(req.headers["x-forwarded-for"].split(","), function (x) {
                return isPrivateAddress(x);
            })),

        isSsl = req.connection.pair || (req.headers["x-forwarded-proto"] && req.headers["x-forwarded-proto"].indexOf("https") !== -1);


    if (!isPrivate && !isSsl) {
        let host = url.parse(Meteor.absoluteUrl()).hostname.replace(/:\d+$/, "");

        res.writeHead(302, {Location: "https://" + host + req.url});
        res.end();
        return;
    }

    _.each(oldHttpServerListeners, function (oldListener) {
        oldListener.apply(WebApp.httpServer, args);
    });
});

WebApp.rawConnectHandlers.use(function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return next();
});