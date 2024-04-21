xxx="app1"
function rcp(){
	rport=26188
	rip="65.49.208.113"
	scp -o StrictHostKeyChecking=no -i ~/.ssh/id_rsa -C -r -P ${rport} "$1"  root@${rip}:"$2"
	rport=22
	rip="144.202.116.91"
	scp -o StrictHostKeyChecking=no -i ~/.ssh/id_rsa -C -r -P ${rport} "$1"  root@${rip}:"$2"
}
rcp $1 $2

