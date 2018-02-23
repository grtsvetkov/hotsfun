#!/bin/bash

mkdir -p /opt/<%= appName %>/
mkdir -p /opt/<%= appName %>/config
mkdir -p /opt/<%= appName %>/tmp

chown ${USER} /opt/<%= appName %> -R
chown ${USER} /etc/init
chown ${USER} /etc/

npm install -g forever userdown wait-for-mongo node-gyp

# Creating a non-privileged user
useradd meteoruser || :