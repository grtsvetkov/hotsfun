#!/bin/bash

apt update -y
apt -y install libev4 libev-dev gcc make libssl-dev git
cd /tmp
rm -rf stud
git clone https://github.com/bumptech/stud.git stud
cd stud
make install
cd ..
rm -rf stud

#make sure comet folder exists
mkdir -p /opt/stud

#initial permission
chown -R $USER /etc/init
chown -R $USER /opt/stud

#create non-privileged user
useradd stud || :