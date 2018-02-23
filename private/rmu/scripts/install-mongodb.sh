#!/bin/bash

apt update -y
apt install mongodb -y

# Restart mongodb
service mongodb stop || :
service mongodb start
