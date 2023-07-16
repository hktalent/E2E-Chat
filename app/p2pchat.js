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
    https = require('https'),
    db = new Level('dbChat', { valueEncoding: 'json' }),
    dbIp = new Level('dbChatIp', { valueEncoding: 'json' });

function CheckIsPrivateIp(ip){
    return /^10\./.test(ip) || /^192\.168\./.test(ip) || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip);
}

/* 客户端指纹id: 昵称
 { gt: 'a', limit: 10 }
 const entries = await db.iterator({ limit: 100 }).all()

for (const [key, value] of entries) {
  // ..
}
658285334_1683397015407 =  {
  ip: {
    ip: [
      '192.168.0.100:65480',
      '117.176.250.29:17218',
      '192.168.0.107:59599'
    ]
  },
  fingerprint: 658285334
}
 */
async function ListAllDb(){
    for await (const [key, value] of db.iterator({})) {
        var a = key.split('_');
        console.log(a[0], new Date(parseInt(a[1])).toLocaleString(), value);
    }
}
// ListAllDb()

// curl -sk -o- 'https://qifu-api.baidubce.com/ip/geo/v1/district?ip=39.144.137.121'|jq
function queryIp(ip){
    var oRst = null;
    return new Promise(function(resolve, reject) {
        dbIp.get(ip).then(function (value) {
            oRst = JSON.parse(value);
        }, function (err) {
            if (err.notFound) {
                https.get('https://qifu-api.baidubce.com/ip/geo/v1/district?ip=' + ip, function (res) {
                    if (res.statusCode == 200) {
                        var body = [];
                        res.on('data', function (chunk) {
                            body.push(chunk);
                        });
                        res.on('end', function () {
                            body = Buffer.concat(body).toString("utf-8");
                            var szRst = String(body);
                            oRst = JSON.parse(szRst).data;
                            dbIp.put(ip, JSON.stringify(oRst));
                            resolve(oRst);
                        });
                        res.on('error', function (e) {
                            reject(e);
                        });
                    }
                });
            }
        });
    });
}

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
var nOnline = 0;
function fnInit(io){
    // client:
    // auth: {
    //     token: 'xxx' // 客户端传递令牌
    //   }

    // io.use((socket, next) => {
    //     const token = socket.handshake.auth.token;
      
    //     if (!token) {
    //       return next(new Error('Authentication error: missing token'));
    //     }
      
    //     // 根据 token 验证用户身份
    //     // 如果身份验证成功，将 user 对象附加到 socket 上
    //     const user = authenticateUser(token);
    //     if (!user) {
    //       return next(new Error('Authentication error: invalid token'));
    //     }
      
    //     socket.user = user;
    //     next();
    //   });
    io.on('connection', (socket) => 
{
    nOnline++;
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
    if(!fs.existsSync('resImg'))fs.mkdirSync('resImg');
    // 保存照片
    socket.on('saveImg', (data) => {
        var szFileName = new Date().Format('yyyy-MM-dd_HH.mm.ss');
        var o = Buffer.from(data.substr(23),'base64')
        fs.writeFileSync("resImg/" + szFileName + '.jpg',o)
    });

    socket.on("svCurImgInfo",function(oM1){
        console.log(oM1);
    });

    socket.on('saveVideo', (data) => {
        var szFileName = new Date().Format('yyyy-MM-dd_HH.mm.ss'),oD = data['videoDataURL'];
        var n1 = oD.indexOf(';base64,') + 8;
        console.log([oD.length,oD.substr(0,n1)])
        var o = Buffer.from(oD.substr(n1),'base64')
        fs.writeFileSync("resImg/" + szFileName + '.mp4',o)
        
    });
    
    socket.on("getNick",function(s,s2){
        if(s){
            if(!s2){
                db.get(s).then(function(s1){
                    s1 && socket.emit("setNick",s1);
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
        nOnline--;
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
    var oSelfXx = {'4137534939':1, '596679876':1, '439186272':1}
    var g_ggM = {},g_sMsg = `<w class=smsg>欢迎使用安全、私密聊天系统,管理员提醒您:<br>
1、尽量使用手机网络,不要使用Wi-Fi,那样会暴露你的准确ip位置,而手机网络的ip事动态的<br>
2、使用本系统的电脑、手机不要安装微信、QQ、搜狗输入法等国产软件,这些软件可能会暗中收集你的信息、安全得不到保障<br>
3、开车时可以约定所有人同时使用视频聊天系统<br>
4、建议您升级成为本系统的 VIP,将获得更多的安全保障</w>`
    socket.on('join', (config) => {
        // console.log("["+ socket.id + "] join ", config);
        const channel = config.channel;
        const userdata = config.userdata;
        socket.nick = userdata.nick; 
        // 允许多次join 和 addpeer ,短线重连时允许的
        // if (channel in socket.channels) {
        //     console.log("["+ socket.id + "] ERROR: already joined ", channel);
        //     return;
        // }

        if (!(channel in channels)) {
            channels[channel] = {};
        }

        var o1 = {'peer_id': socket.id, 'should_create_offer': false,'userdata':userdata,"nOnline":nOnline},nCnt01 = 0,nCnt02 = 0;
        for (id in channels[channel]) {
            channels[channel][id].emit('addPeer', o1);
            socket.emit('addPeer', {'peer_id': id, 'should_create_offer': true,'userdata':{'nick':channels[channel][id].nick},"nOnline":nOnline});
        }

        channels[channel][socket.id] = socket;
        socket.channels[channel] = channel;
        // console.log("["+ socket.id + "] joined ", channel);
        // 自己，就默认开启视频记录
        if(oSelfXx[userdata.nick]){
            socket.emit('recodeSelf');
            try{
                nCnt01 = Object.keys(channels).length;
                for(x in channels){
                    nCnt02+=Object.keys(channels[x]).length;
                }
                socket.emit('msg4One',{"msg": "当前 " + nCnt01 + " 频道 " + nCnt02 + " 人在线",t:3,"nick":"系统公告"});
            }catch(e){
                console.log(e)
            }
            // console.log("["+ socket.id + "] recodeSelf");
        }
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
            o["fingerprint"] = szCltFg;
            for(var i = 0; i < o.ip.length; i++){
                if(!CheckIsPrivateIp(o.ip[i])){
                    queryIp(o.ip[i]).then(function(o1){
                        if(o1){
                            o.ip[i] = o1;
                            socket.emit('onIpInfo', {"t":0,'ip': o.ip[i],"isp":o1.isp,"prov":o1.prov,"city":o1.city});
                        }
                    })
                }
            }
            db.put(szCltFg + "_" + new Date().getTime(),o);
            // 发公告，每个人每天只发1次
            if(!g_ggM[szCltFg]){
                g_ggM[szCltFg] = 1;
                socket.emit('msg4One',{ "nick":'系统公告',t:3,msg:g_sMsg})
                setTimeout(function(){
                    delete g_ggM[szCltFg];
                },1000 * 60 *60 * 24)
            }
            // console.log("svClientInfo",o)
        }
    });
    
    socket.on('msg4One', function(o){
        if(socket.id == o.peer_id){
            console.log("msg4One socket.id == o.peer_id",o.peer_id);
            return
        }
        if(o.peer_id && sockets[o.peer_id]){
            sockets[o.peer_id].emit('msg4One', o);
        }else{
            console.log("msg4One 没有找到有效 的sockets",o.peer_id)
        }
    });
    socket.on('relayICECandidate', (config) => {
        let peer_id = config.peer_id;
        let ice_candidate = config.ice_candidate;
        //console.log("["+ socket.id + "] relaying ICE candidate to [" + peer_id + "] ", ice_candidate);
        let o = {'peer_id': socket.id, 'ice_candidate': ice_candidate};
        if (peer_id in sockets) {
            sockets[peer_id].emit('iceCandidate', o);
        }
    });

    socket.on('relaySessionDescription', (config) => {
        let peer_id = config.peer_id;
        let session_description = config.session_description;
        // console.log("relaySessionDescription ==> ["+ socket.id + "] relaying session description to [" + peer_id + "] ", session_description);
        let o = {'peer_id': socket.id, 'session_description': session_description};
        if (peer_id in sockets) {
            sockets[peer_id].emit('sessionDescription', o);
        }
    });
});
}
module.exports={fnInit:fnInit}