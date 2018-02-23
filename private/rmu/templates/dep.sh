#!/bin/bash
set -v
set -x
set +e

TMP_DIR=/opt/<%= appName %>/tmp
BUNDLE_DIR=${TMP_DIR}/bundle

cd ${TMP_DIR}
rm -rf bundle
tar xvzf bundle.tar.gz > /dev/null
chmod -R +x *
#chown -R ${USER} ${BUNDLE_DIR}

cd bundle/programs/server
npm install --save

cd /opt/<%= appName %>/

forever stopall

if [ -d app ]; then
  sudo rm -rf app
fi

sudo mv tmp/bundle app

##!!!npm install bcrypt
#cd /opt/<%= appName %>/app/programs/server && npm install --unsafe-perm
##!!!cd /opt/<%= appName %>/app/programs/server && npm install

#sudo /usr/bin/pkill -f '/usr/bin/node /opt/call2doc/app/main.js'
#/bin/kill -9 `ps ax | grep '/usr/bin/node /opt/<%= appName %>/app/main.js' | awk '{print $1}'`
#/bin/kill -9 `ps ax | grep /usr/bin/node /opt/call2doc/app/main.js | awk '{print $1}'`

#echo "kill old app"
#/usr/bin/pkill -signal 9 -f '/usr/bin/node /opt/<%= appName %>/app/main.js'

echo "RUN NEW APP"

export PORT=80
export MONGO_URL=mongodb://127.0.0.1/<%= appName %>
export ROOT_URL=http://<%= appName %>

#it is possible to override above env-vars from the user-provided values
<% for(var key in env) { %>
  export <%- key %>=<%- ("" + env[key]).replace(/./ig, '\\$&') %>
<% } %>

forever start -l /opt/<%= appName %>/log.log -o /opt/<%= appName %>/stdout.log -e /opt/<%= appName %>/error.log -a /opt/<%= appName %>/app/main.js

#/usr/bin/node /opt/<%= appName %>/app/main.js >> /var/log/meteor.log &

#/bin/sh /opt/<%= appName %>/config/env.sh
#/bin/sh /opt/call2doc/config/env.sh

echo "Checking is app booted or not?"
#curl localhost:${PORT} || revert_app
curl localhost:${PORT} || echo "DEPLOYMENT FAIL"

# chown to support dumping heapdump and etc
#sudo chown -R meteoruser app
