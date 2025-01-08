#!/bin/sh

TAG="web-cleanup"
storage=$1

if [ "$#" -lt 1 ]; then
    logger -s "Wrong Arguments, please specify getac or flash" -t $TAG
    exit 1
fi

if [ "$storage" = "getac" ]; then
    logger -s "cleanup /tmp/tmp_daemon"
    rm -rf /tmp/tmp_daemon
    logger -s "[Stop daemon]:SysMgr, MediaMgr, IoMgr, ssdpd, rtsps, venc_cbb, tiny_aenc_mmap" -t $TAG 
    killall -15 SysMgr
    killall -15 MediaMgr
    killall -15 IoMgr 
    killall -15 ssdpd 
    killall -15 rtsps
    killall -15 venc_cbb
    killall -15 tiny_aenc_mmap 
    exit 0
fi

if [ "$storage" = "flash" ]; then
    logger -s "cleanup /tmp/tmp_flash" -t $TAG 
    rm -rf /tmp/tmp_flash
    exit 0
fi

logger -s "Arguments not supportted" -t $TAG

