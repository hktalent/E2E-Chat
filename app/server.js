var crypto=require('crypto'),
    fs=require('fs'),
    serverRootPath = __dirname + "/",
    myapp = require(serverRootPath +'/myapp_51pwn'),
    szSSP = serverRootPath + "static/"
    nPort = 8089;
/* fix 
brew services start redis
NODE_DEBUG=true node --trace-deprecation server.js
*/
var fnDecodeURIComponent = decodeURIComponent;
decodeURIComponent=function(s)
{
    try{
        return fnDecodeURIComponent(s);
    }catch(e){}
    return s;
}
process.on('uncaughtException', function(err) {
    console.log('Caught exception: ' + err);
});

var g_oRceCache = {};
// 超过1分钟就删除
function clrOld()
{
    var n = 60 * 1000,nN = new Date().getTime();
    for(var k in g_oRceCache)
    {
        var o = g_oRceCache[k];
        if(nN > o['time'] > n)delete g_oRceCache[k];
    }
}

// docker run -it --rm  -e DISPLAY=$DISPLAY -p 1443:1443 -v `pwd`/app:/app -v `pwd`/tools:/tools -v `pwd`/ca:/ca -v /tmp/.X11-unix:/tmp/.X11-unix --privileged --name='mywebapp' mywebapp /bin/sh
function logRequest(req)
{
    console.log(req.url || req.path || req.query)
}
// require("child_process").execSync("npm install -g npm;npm audit fix;");
var oMyapp = new myapp({
    serverRootPath: serverRootPath,
    webStaticPath: szSSP,
    // 单ip最大允许连接数
    singleIpMaxConnect:100,
    useHttps: true,
    caKey: serverRootPath + '../ca/privkey.pem',
    caCert:serverRootPath + '../ca/fullchain.pem',
    port: nPort,
    wtHosts:[/^.*$/],
    redisAdapter:{ host: '127.0.0.1', port: 6379 },
    onError:function(e){
        console.log(e)
    },
    cbkApp:function(app)
    {
        // app.use(/\/.*/,function(req, rep, next)
        // {
        //     next();
        // })
    },
    cbk4ServerAppIo:function(server,app,io)
    {
        require(serverRootPath + '/p2pchat').fnInit(io.of("/pChat"));
    },
    onLog:function(s)
    {
        console.log(s);
    }
});
