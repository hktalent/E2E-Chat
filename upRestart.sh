#!/bin/bash

export xxx="app1"
function rcp(){
	rport=26188
	rip="65.49.208.113"
	scp -o StrictHostKeyChecking=no -i ~/.ssh/id_rsa -C -r -P ${rport} "$1"  root@${rip}:"$2"
	rport=22
	rip="144.202.116.91"
	scp -o StrictHostKeyChecking=no -i ~/.ssh/id_rsa -C -r -P ${rport} "$1"  root@${rip}:"$2"
}

#rcp ./upTmp.sh /root/app1/app/
rport=26188
rip="65.49.208.113"

ssh -o StrictHostKeyChecking=no -p $rport -i ~/.ssh/id_rsa -C root@$rip "
cd /root/app1/app
./upTmp.sh
pkill -9 node;ps -ef|grep node
tmux send -t 6 'NODE_ENV=production node server.js' enter
ps -ef|grep node
"
