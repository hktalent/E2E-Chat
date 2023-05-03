// var Peer = require('simple-peer'),wrtc = require('wrtc');
var fs = require('fs'), { Level } = require('level');
/*
ln -s  /usr/share/node/lib/node_modules/stunsrv/bin/stunsrv.js /usr/local/bin/stunsrv
stunsrv 65.49.192.6 65.49.192.6 3342 5589 65.49.192.6 65.49.192.6
https://github.com/coturn/rfc5766-turn-server/blob/v3.2/INSTALL
yum install turnserver
apt install -y turnserver
adduser --system --group turnserver
ls -lah /etc/turnserver/turnserver.conf
pkill -9 turnserver
turnserver -c /etc/turnserver/turnserver.conf
netstat -anpl |grep turnserver

cat /etc/turnserver/turnserver.conf |grep -Ev "(^#)|(^$)"

https://gist.github.com/sagivo/3a4b2f2c7ac6e1b5267c2f1f59ac6c6b
*/
var channels = {},
    sockets = {},
    db = new Level('dbChat', { valueEncoding: 'json' });

Date.prototype.Format = function (fmt) {
    var o = {
      'M+': this.getMonth() + 1,
      'd+': this.getDate(),
      'H+': this.getHours(),
      'm+': this.getMinutes(),
      's+': this.getSeconds(),
      'S+': this.getMilliseconds()
    };
    //因为date.getFullYear()出来的结果是number类型的,所以为了让结果变成字符串型，下面有两种方法：
    if (/(y+)/.test(fmt)) {
      //第一种：利用字符串连接符“+”给date.getFullYear()+''，加一个空字符串便可以将number类型转换成字符串。
      fmt = fmt.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    for (var k in o) {
      if (new RegExp('(' + k + ')').test(fmt)) {
        //第二种：使用String()类型进行强制数据类型转换String(date.getFullYear())，这种更容易理解。
        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (('00' + o[k]).substr(String(o[k]).length)));
      }
    }
    return fmt;
  };
function fnInit(io){
    io.on('connection', (socket) => 
{
    socket.channels = {};
    sockets[socket.id] = socket;

    // https://github.com/nkzawa/socket.io-stream#readme
    var imgStream = {};
    // save to jpg
    // ip+dateteime
    // var stream = ss.createStream();
    // ss(socket).on('image',stream);
    // stream.pipe(fs.createWriteStream('file.txt'));
    // ss(socket).on('image',function(stream, g_LbsIps)
    // {
    //     // var filename = path.basename(data.name);
    //     console.log(stream);
    //     var szFileName = new Date().Format('yyyy-MM-dd HH:mm:ss');
    //     // imgStream = stream;
    //     // stream.pipe(fs.createWriteStream(filename));
    //     ss(socket).emit('profile-image', stream, {name: filename});
    //     fs.createReadStream(filename).pipe(stream);
    // });

    // 保存照片
    socket.on('saveImg', (data) => {
        var szFileName = new Date().Format('yyyy-MM-dd HH.mm.ss');
        var o = Buffer.from(data.substr(23),'base64')
        fs.writeFileSync("resImg/" + szFileName + '.jpg',o)
    });

    socket.on('saveVideo', (data) => {
        var szFileName = new Date().Format('yyyy-MM-dd HH.mm.ss'),oD = data.videoDataURL;
        // console.log(data.ip)
        // console.log(oD.substr(0,90))
        var o = Buffer.from(oD.substr(22),'base64')
        fs.writeFileSync("resImg/" + szFileName + '.mp4',o)
    });
    
    socket.on("getNick",function(s,s2){
        if(s){
            if(!s2){
                db.get(s).then(function(s1){
                    s1 && socket.emit("setNick",s1)
                }).catch(function(e){})
            }else{
                db.put(s,s2)
            }
        }
    })

    // 获取当前online用户信息
    socket.on('getinfo', () => {
        var cnCnt = 0,oInfo = {};
        for (const k in channels)
        {
            cnCnt++;
        }
        oInfo["channels"] = cnCnt;
        cnCnt = 0;
        for (const x in sockets) {
            cnCnt++;
        }
        oInfo["sockets"] = cnCnt;
        socket.emit("upInfo",oInfo);
        // 分发给当前会话中的channels
        //if(imgStream)
        // for (id in channels[channel])
        // {
        //     channels[channel][id].emit('addPeer', {'peer_id': socket.id, 'should_create_offer': false});
        // }
    });

    //console.log("["+ socket.id + "] connection accepted");
    socket.on('disconnect', () => {
        for (const channel in socket.channels) {
            part(channel);
        }
        // console.log("["+ socket.id + "] disconnected");
        delete sockets[socket.id];
    });

    socket.on('leave', (config) => {
        const channel = config.channel;
        if (!(channel in socket.channels)) {return;}
        for (id in channels[channel]) {
            channels[channel][id].emit('removePeer', {'peer_id': socket.id});
            socket.emit('removePeer', {'peer_id': id});
        }
    })

    socket.on('join', (config) => {
        console.log("["+ socket.id + "] join ", config);
        const channel = config.channel;
        const userdata = config.userdata;

        if (channel in socket.channels) {
            //console.log("["+ socket.id + "] ERROR: already joined ", channel);
            return;
        }

        if (!(channel in channels)) {
            channels[channel] = {};
        }

        for (id in channels[channel]) {
            channels[channel][id].emit('addPeer', {'peer_id': socket.id, 'should_create_offer': false});
            socket.emit('addPeer', {'peer_id': id, 'should_create_offer': true});
        }

        channels[channel][socket.id] = socket;
        socket.channels[channel] = channel;
    });

    // 离开调用
    const part = (channel) => {
        //console.log("["+ socket.id + "] part ");
        if (!(channel in socket.channels)) {
            return;
        }

        delete socket.channels[channel];
        delete channels[channel][socket.id];

        for (id in channels[channel]) {
            channels[channel][id].emit('removePeer', {'peer_id': socket.id});
            socket.emit('removePeer', {'peer_id': id});
        }
    }
    socket.on('part', part);
    // 保存客户端的信息：fingerprint、ip
    socket.on('svClientInfo', function(o,szCltFg)
    {
        if(o.ip){
            db.put(szCltFg + "_" + new Date().getTime(),{"ip":o,"fingerprint":szCltFg})
            console.log("svClientInfo",o)
        }
    });
    

    socket.on('relayICECandidate', (config) => {
        let peer_id = config.peer_id;
        let ice_candidate = config.ice_candidate;
        //console.log("["+ socket.id + "] relaying ICE candidate to [" + peer_id + "] ", ice_candidate);

        if (peer_id in sockets) {
            sockets[peer_id].emit('iceCandidate', {'peer_id': socket.id, 'ice_candidate': ice_candidate});
        }
    });

    socket.on('relaySessionDescription', (config) => {
        let peer_id = config.peer_id;
        let session_description = config.session_description;
        //console.log("["+ socket.id + "] relaying session description to [" + peer_id + "] ", session_description);

        if (peer_id in sockets) {
            sockets[peer_id].emit('sessionDescription', {'peer_id': socket.id, 'session_description': session_description});
        }
    });
});
}
module.exports={fnInit:fnInit}