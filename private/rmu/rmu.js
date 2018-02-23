#!/usr/bin/env node
var nodemiral = require('nodemiral');
var path = require('path');
var cjson = require('cjson');
var fs = require('fs');
var rimraf = require('rimraf');
//var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var uuid = require('uuid');
var util = require('util');
var format = require('util').format;
var async = require('async');
var os = require('os');
var archiver = require('archiver');
var _ = require('underscore');

require('colors');

//HACK FROM FUCKING METEOR DEPLOY
//process.env.TOOL_NODE_FLAGS = "--max-old-space-size=4096";

var SCRIPT_DIR = path.resolve(__dirname, './scripts');
var TEMPLATES_DIR = path.resolve(__dirname, './templates');

function buildApp(appPath, meteorBinary, buildLocaltion, callback) {
    buildMeteorApp(appPath, meteorBinary, buildLocaltion, function (code) {
        if (code == 0) {
            archiveIt(buildLocaltion, callback);
        } else {
            console.log("\n=> Build Error. Check the logs printed above.");
            callback(new Error("build-error"));
        }
    });
}

function buildMeteorApp(appPath, meteorBinary, buildLocaltion, callback) {
    var executable = meteorBinary;
    var args = [
        "build", "--directory", buildLocaltion,
        "--server", "http://localhost:3000",
        "--architecture", "os.linux.x86_64"
    ];

    var isWin = /^win/.test(process.platform);
    if (isWin) {
        // Sometimes cmd.exe not available in the path
        // See: http://goo.gl/ADmzoD
        executable = process.env.comspec || "cmd.exe";
        args = ["/c", "meteor"].concat(args);
    }

    var options = {cwd: appPath};
    console.log(args.join(' '));
    var meteor = spawn(executable, args, options);
    var stdout = "";
    var stderr = "";

    meteor.stdout.pipe(process.stdout, {end: false});
    meteor.stderr.pipe(process.stderr, {end: false});

    meteor.on('close', callback);
}

function archiveIt(buildLocaltion, callback) {
    callback = _.once(callback);
    var bundlePath = path.resolve(buildLocaltion, 'bundle.tar.gz');
    var sourceDir = path.resolve(buildLocaltion, 'bundle');

    var output = fs.createWriteStream(bundlePath);
    var archive = archiver('tar', {
        gzip: true,
        gzipOptions: {
            level: 8 //default = 6
        }
    });

    archive.pipe(output);
    output.once('close', callback);

    archive.once('error', function (err) {
        console.log("=> Archiving failed:", err.message);
        callback(err);
    });

    archive.directory(sourceDir, 'bundle').finalize();
}

function configureStud(taskList, pemFilePath, port) {
    var backend = {host: '127.0.0.1', port: port};

    taskList.copy('Configuring Stud for Upstart', {
        src: path.resolve(TEMPLATES_DIR, 'meteor.service'),
        dest: '/lib/systemd/system/stud.service'
    });

    taskList.executeScript('Add new service to systemctl for stud', {
        script: path.resolve(SCRIPT_DIR, 'systemctl-service-stud.sh')
    });

    taskList.copy('Configuring SSL', {
        src: pemFilePath,
        dest: '/opt/stud/ssl.pem'
    });

    taskList.copy('Configuring Stud', {
        src: path.resolve(TEMPLATES_DIR, 'stud.conf'),
        dest: '/opt/stud/stud.conf',
        vars: {
            backend: util.format('[%s]:%d', backend.host, backend.port)
        }
    });

    taskList.execute('Verifying SSL Configurations (ssl.pem)', {
        command: 'stud --test --config=/opt/stud/stud.conf'
    });

    //restart stud
    taskList.execute('Starting Stud', {
        //command: '(sudo service stud stop || :) && (sudo service stud start || :)'
        command: 'stud --config=/opt/stud/stud.conf &'
    });
}

function Actions(config, cwd) {
    this.cwd = cwd;
    this.config = config;
    this.sessionsMap = this._createSessionsMap(config);

    //get settings.json into env
    var setttingsJsonPath = path.resolve(this.cwd, 'settings.json');
    if (fs.existsSync(setttingsJsonPath)) {
        this.config.env['METEOR_SETTINGS'] = JSON.stringify(require(setttingsJsonPath));
    }
}

Actions.prototype._createSessionsMap = function (config) {
    var sessionsMap = {};

    config.servers.forEach(function (server) {
        var host = server.host;
        var auth = {username: server.username};

        if (server.pem) {
            auth.pem = fs.readFileSync(path.resolve(server.pem), 'utf8');
        } else {
            auth.password = server.password;
        }

        var nodemiralOptions = {
            ssh: server.sshOptions,
            keepAlive: true
        };

        if (!sessionsMap[server.os]) {
            sessionsMap[server.os] = {
                sessions: [],
                taskListsBuilder: {
                    setup: function (config) {
                        var taskList = nodemiral.taskList('Setup (linux)');

                        // Installation
                        if (config.setupNode) {
                            taskList.executeScript('Installing Node.js', {
                                script: path.resolve(SCRIPT_DIR, 'install-node.sh'),
                                vars: {
                                    nodeVersion: config.nodeVersion
                                }
                            });
                        }

                        if (config.setupPhantom) {
                            taskList.executeScript('Installing PhantomJS', {
                                script: path.resolve(SCRIPT_DIR, 'install-phantomjs.sh')
                            });
                        }

                        taskList.executeScript('Setting up Environment', {
                            script: path.resolve(SCRIPT_DIR, 'setup-env.sh'),
                            vars: {
                                appName: config.appName
                            }
                        });

                        if (config.setupMongo) {
                            taskList.copy('Copying MongoDB configuration', {
                                src: path.resolve(TEMPLATES_DIR, 'mongodb.conf'),
                                dest: '/etc/mongodb.conf'
                            });

                            taskList.executeScript('Installing MongoDB', {
                                script: path.resolve(SCRIPT_DIR, 'install-mongodb.sh')
                            });
                        }

                        if (config.ssl) {
                            taskList.executeScript('Installing Stud', { //installStud
                                script: path.resolve(SCRIPT_DIR, 'install-stud.sh')
                            });
                            
                            configureStud(taskList, config.ssl.pem, config.ssl.backendPort);
                        }

                        taskList.copy('Configuring upstart', {
                            src: path.resolve(TEMPLATES_DIR, 'meteor.service'),
                            dest: '/lib/systemd/system/' + config.appName + '.service',
                            vars: {
                                appName: config.appName
                            }
                        });

                        taskList.executeScript('Add new service to systemctl', {
                            script: path.resolve(SCRIPT_DIR, 'systemctl-service.sh'),
                            vars: {
                                appName: config.appName
                            }
                        });

                        return taskList;
                    },

                    deploy: function (bundlePath, env, deployCheckWaitTime, appName, enableUploadProgressBar) {
                        var taskList = nodemiral.taskList("Развертывание приложения '" + appName + "' (linux)");

                        taskList.copy('Загрузка сборки', {
                            src: bundlePath,
                            dest: '/opt/' + appName + '/tmp/bundle.tar.gz',
                            progressBar: enableUploadProgressBar
                        });

                        taskList.executeScript('Процесс развертывания', {
                            script: path.resolve(TEMPLATES_DIR, 'dep.sh'),
                            vars: {
                                env: env || {},
                                deployCheckWaitTime: deployCheckWaitTime || 10,
                                appName: appName
                            }
                        });

                        return taskList;
                    },

                    reconfig: function (env, appName) {
                        var taskList = nodemiral.taskList("Updating configurations (linux)");

                        taskList.copy('Setting up Environment Variables', {
                            src: path.resolve(TEMPLATES_DIR, 'env.sh'),
                            dest: '/opt/' + appName + '/config/env.sh',
                            vars: {
                                env: env || {},
                                appName: appName
                            }
                        });

                        //restarting
                        taskList.execute('Restarting app', {
                            command: '(sudo service ' + appName + ' stop || :) && (sudo service ' + appName + ' start)'
                        });

                        return taskList;
                    },

                    restart: function (appName) {
                        var taskList = nodemiral.taskList("Restarting Application (linux)");

                        //restarting
                        taskList.execute('Restarting app', {
                            command: '(sudo service ' + appName + ' stop || :) && (sudo service ' + appName + ' start)'
                        });

                        return taskList;
                    },

                    stop: function (appName) {
                        var taskList = nodemiral.taskList("Stopping Application (linux)");

                        //stopping
                        taskList.execute('Stopping app', {
                            command: '(sudo service ' + appName + ' start)'
                        });

                        return taskList;
                    },

                    start: function (appName) {
                        var taskList = nodemiral.taskList("Starting Application (linux)");

                        //starting
                        taskList.execute('Starting app', {
                            command: '(sudo service ' + appName + ' start)'
                        });

                        return taskList;
                    }
                }
            }
        }

        var session = nodemiral.session(host, auth, nodemiralOptions);
        session._serverConfig = server;
        sessionsMap[server.os].sessions.push(session);
    });

    return sessionsMap;
};

Actions.prototype._executePararell = function (actionName, args) {
    var self = this;
    var sessionInfoList = _.values(self.sessionsMap);
    async.map(
        sessionInfoList,
        function (sessionsInfo, callback) {
            var taskList = sessionsInfo.taskListsBuilder[actionName]
                .apply(sessionsInfo.taskListsBuilder, args);
            taskList.run(sessionsInfo.sessions, function (summaryMap) {
                callback(null, summaryMap);
            });
        },
        whenAfterCompleted
    );
};

Actions.prototype.setup = function () {
    this._executePararell("setup", [this.config]);
};

Actions.prototype.deploy = function () {
    var self = this;

    var buildLocation = path.resolve(os.tmpdir(), uuid.v4());
    var bundlePath = path.resolve(buildLocation, 'bundle.tar.gz');

    // spawn inherits env vars from process.env
    // so we can simply set them like this
    process.env.BUILD_LOCATION = buildLocation;

    var deployCheckWaitTime = this.config.deployCheckWaitTime;
    var appName = this.config.appName;
    var appPath = this.config.app;
    var enableUploadProgressBar = this.config.enableUploadProgressBar;
    var meteorBinary = this.config.meteorBinary;

    console.log('Building Started: ' + this.config.app);
    buildApp(appPath, meteorBinary, buildLocation, function (err) {
        if (err) {
            process.exit(1);
        } else {
            var sessionsData = [];
            _.forEach(self.sessionsMap, function (sessionsInfo) {
                var taskListsBuilder = sessionsInfo.taskListsBuilder;
                _.forEach(sessionsInfo.sessions, function (session) {
                    sessionsData.push({
                        taskListsBuilder: taskListsBuilder,
                        session: session
                    });
                });
            });

            async.mapSeries(
                sessionsData,
                function (sessionData, callback) {
                    var session = sessionData.session;
                    var taskListsBuilder = sessionData.taskListsBuilder;
                    var env = _.extend({}, self.config.env, session._serverConfig.env);
                    var taskList = taskListsBuilder.deploy(
                        bundlePath, env,
                        deployCheckWaitTime, appName, enableUploadProgressBar);
                    taskList.run(session, function (summaryMap) {
                        callback(null, summaryMap);
                    });
                },
                whenAfterDeployed(buildLocation)
            );
        }
    });
};

Actions.prototype.reconfig = function () {
    var self = this;
    var sessionInfoList = [];
    for (var os in self.sessionsMap) {
        var sessionsInfo = self.sessionsMap[os];
        sessionsInfo.sessions.forEach(function (session) {
            var env = _.extend({}, self.config.env, session._serverConfig.env);
            var taskList = sessionsInfo.taskListsBuilder.reconfig(
                env, self.config.appName);
            sessionInfoList.push({
                taskList: taskList,
                session: session
            });
        });
    }

    async.mapSeries(
        sessionInfoList,
        function (sessionInfo, callback) {
            sessionInfo.taskList.run(sessionInfo.session, function (summaryMap) {
                callback(null, summaryMap);
            });
        },
        whenAfterCompleted
    );
};

Actions.prototype.restart = function () {
    this._executePararell("restart", [this.config.appName]);
};

Actions.prototype.stop = function () {
    this._executePararell("stop", [this.config.appName]);
};

Actions.prototype.start = function () {
    this._executePararell("start", [this.config.appName]);
};

Actions.prototype.logs = function () {
    var self = this;
    var tailOptions = process.argv.slice(3).join(" ");

    for (var os in self.sessionsMap) {
        var sessionsInfo = self.sessionsMap[os];
        sessionsInfo.sessions.forEach(function (session) {
            var hostPrefix = '[' + session._host + '] ';
            var options = {
                onStdout: function (data) {
                    process.stdout.write(hostPrefix + data.toString());
                },
                onStderr: function (data) {
                    process.stderr.write(hostPrefix + data.toString());
                }
            };

            var command = 'sudo tail ' + tailOptions + ' /var/log/upstart/' + self.config.appName + '.log';
            session.execute(command, options);
        });
    }

};

function whenAfterDeployed(buildLocation) {
    return function (error, summaryMaps) {
        rimraf.sync(buildLocation);
        whenAfterCompleted(error, summaryMaps);
    };
}

function whenAfterCompleted(error, summaryMaps) {
    process.exit((error || haveSummaryMapsErrors(summaryMaps) ? 1 : 0));
}

function haveSummaryMapsErrors(summaryMaps) {
    return _.some(summaryMaps, function (summaryMap) {
        return _.some(summaryMap, function (summary) {
            return summary.error;
        });
    });
}

function rewriteHome(location) {
    return (/^win/.test(process.platform)) ? location.replace('~', process.env.USERPROFILE) : location.replace('~', process.env.HOME);
}

function mupErrorLog(message) {
    var errorMessage = 'Invalid mup.json file: ' + message;
    console.error(errorMessage.red.bold);
    process.exit(1);
}

function getCanonicalPath(location) {
    var localDir = path.resolve(__dirname, location);
    if (fs.existsSync(localDir)) {
        return localDir;
    } else {
        return path.resolve(rewriteHome(location));
    }
}

function readConfig() {
    var mupJsonPath = path.resolve('mup.json');

    if (fs.existsSync(mupJsonPath)) {
        var mupJson = cjson.load(mupJsonPath);

        //initialize options
        mupJson.env = mupJson.env || {};

        if (typeof mupJson.setupNode === "undefined") {
            mupJson.setupNode = true;
        }
        if (typeof mupJson.setupPhantom === "undefined") {
            mupJson.setupPhantom = true;
        }
        mupJson.meteorBinary = (mupJson.meteorBinary) ? getCanonicalPath(mupJson.meteorBinary) : 'meteor';
        if (typeof mupJson.appName === "undefined") {
            mupJson.appName = "meteor";
        }
        if (typeof mupJson.enableUploadProgressBar === "undefined") {
            mupJson.enableUploadProgressBar = true;
        }

        //validating servers
        if (!mupJson.servers || mupJson.servers.length == 0) {
            mupErrorLog('Server information does not exist');
        } else {
            mupJson.servers.forEach(function (server) {
                var sshAgentExists = false;
                var sshAgent = process.env.SSH_AUTH_SOCK;
                if (sshAgent) {
                    sshAgentExists = fs.existsSync(sshAgent);
                    server.sshOptions = server.sshOptions || {};
                    server.sshOptions.agent = sshAgent;
                }

                if (!server.host) {
                    mupErrorLog('Server host does not exist');
                } else if (!server.username) {
                    mupErrorLog('Server username does not exist');
                } else if (!server.password && !server.pem && !sshAgentExists) {
                    mupErrorLog('Server password, pem or a ssh agent does not exist');
                } else if (!mupJson.app) {
                    mupErrorLog('Path to app does not exist');
                }

                server.os = "linux";

                if (server.pem) {
                    server.pem = rewriteHome(server.pem);
                }

                server.env = server.env || {};
                server.env['CLUSTER_ENDPOINT_URL'] = server.env['CLUSTER_ENDPOINT_URL'] || format("http://%s:%s", server.host, mupJson.env['PORT'] || 80);
            });
        }

        //rewrite ~ with $HOME
        mupJson.app = rewriteHome(mupJson.app);

        if (mupJson.ssl) {
            mupJson.ssl.backendPort = mupJson.ssl.backendPort || 80;
            mupJson.ssl.pem = path.resolve(rewriteHome(mupJson.ssl.pem));
            if (!fs.existsSync(mupJson.ssl.pem)) {
                mupErrorLog('SSL pem file does not exist');
            }
        }

        return mupJson;
    } else {
        console.error('mup.json file does not exist!'.red.bold);
        process.exit(1);
    }
}


console.log('\nRIM Meteor UP:'.bold.blue);
console.log('------------------------------------------------\n'.bold.blue);

var action = process.argv[2];

var actionsRegistry = new Actions(readConfig(), path.resolve('.'));

if (actionsRegistry[action]) {

    actionsRegistry[action]();

} else {

    if (typeof action !== "undefined") {
        var errorMessage = 'No Such Action Exists: ' + action;
        console.error(errorMessage.bold.red);
    }

    console.error('\nValid Actions');
    console.error('-------------');
    console.error('setup         - Setup the server');
    console.error('');
    console.error('deploy        - Deploy app to server');
    console.error('reconfig      - Reconfigure the server and restart');
    console.error('');
    console.error('logs [-f -n]  - Access logs');
    console.error('');
    console.error('start         - Start your app instances');
    console.error('stop          - Stop your app instances');
    console.error('restart       - Restart your app instances');
}