#!/bin/sh

TAG="prehookInstall.sh"

mosquitto_pub -t "config/io/led/blinking" -m "{\"value\":true}"
logger -s "Status LED blinking" -t $TAG
