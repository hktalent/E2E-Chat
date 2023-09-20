process.setMaxListeners(5000);
var fs = require('fs'),
    os = require('os'),
    // crypto = require("crypto"),
    spdy = require('spdy'),
    // brotli = require('brotli'),
    express = require('express'),
    destroy = require('destroy'),
    onFinished = require('on-finished'),
    app = express(),
    mime = require('mime'),
    minify = require('html-minifier').minify, 
    expresslimiter = require('express-limiter'),
    webStaticPath = __dirname + "/static/",
    mergeRes = require('./mergeRes'),
    os = require('os'),
    szCurPath = __dirname + "/",
    uuid  = require('node-uuid'),
    EventEmitter = require('events').EventEmitter,
    // juicer = require("juicer"),
    useragent = require('useragent'),
    // yum install redis;systemctl start redis.service;systemctl status redis.service
    // apt install redis;service redis-server start
    // brew install redis;brew services restart redis
    nMaxConn = 100,
    // https://github.com/helmetjs/helmet/  standalone module: helmet-csp  Content-MD5
    helmet = require('helmet'),
    // session = require('express-session'),
    expressOptions = require('./expressOptions'),
    compression = require('compression'),
    path = require('path'),
    bUseHttps = true,
    // 白名单host
    wtHosts = [],
    { createClient } = require("redis"),
    { createAdapter } = require("@socket.io/redis-adapter"),
    credentials = {};

// fix: UnhandledPromiseRejectionWarning: Error: The client is closed  Commander._RedisClient_sendCommand (node_modules/@node-redis/client/dist/lib/client/index.js:387:31)
const pubClient = createClient({ url: "redis://localhost:6379" });
(async () => {
    pubClient.on('error', (err) => console.log('Redis Client Error', err));
    await pubClient.connect();
})();

const subClient = pubClient.duplicate();
const zlib = require('zlib');

var szCjs = "/js/,.js",szCcss = "/css/,.css";

function closeStream(res, stream){
    onFinished(res, function () {
        destroy(stream)
    });
}

function doPush(res,urlPath){
    var szRfp = urlPath;
    if(szCjs == szRfp)szRfp = "js.js";
    else if(szCcss == szRfp)szRfp = "css.css";
    else if("/socket.io/socket.io.js" ==szRfp)szRfp = "/js/socket.io.js";
    var o = {
        status: 200,
        method: 'GET',
        request: {
          accept: '*/*'
        },
        response: {
            // 'Content-Encoding': 'gzip',
            'content-type': mime.lookup(szRfp)
        }
    };
    var stream = res.push(urlPath,o,function(err,ss){
        if(err){
            console.log(urlPath," ==> ",err);
            return;
        }
        // chrome Error: PUSH_PROMISE disabled by other side
        // firfox Error: Got RST: REFUSED_STREAM
        // if("/js/," == urlPath)console.log(o,err)
        var ss = fs.createReadStream(webStaticPath + szRfp,{autoClose:true});
        ss.pipe(zlib.createGzip()).pipe(ss);
        closeStream(res,ss);
    });
    
    return stream;
}
function getNowStr() {
	var now = new Date();
	var year = now.getFullYear(),
		month = now.getMonth() + 1,
		date = now.getDate(),
		hour = now.getHours(),
		minute = now.getMinutes(),
		second = now.getSeconds();
	function p (s) {
		return s < 10 ? '0' + s : s;
	}
	var timeFormat = year + "-" + p(month) + "-" + p(date) + " " + p(hour) + ":" + p(minute) + ":" + p(second);
	return timeFormat;
}
function myapp(option)
{
    Object.setPrototypeOf(this, EventEmitter.prototype)
    var _t = this;
    fnOnLog = option.onLog || function(s)
    {
        _t.emit('log',s,_t);
    };
    var fnElog = option.onError || function(e)
    {
        _t.emit('error',e,_t);
    };
    // process.on('uncaughtException', fnElog);process.on('unhandledRejection', fnElog);
    szCurPath = (option.serverRootPath || __dirname);
    nMaxConn = option.singleIpMaxConnect || nMaxConn;
    webStaticPath = (option.webStaticPath || webStaticPath);
    var key = option.caKey || szCurPath + '/../ca/domain.key',
        cert = option.caCert || szCurPath + '/../ca/chained.pem';
    bUseHttps = option.useHttps || false;

    wtHosts = option.wtHosts || ["127.0.0.1"];
    if(option.useHttps && fs.existsSync(key) && fs.existsSync(cert))
    {
        if(bUseHttps == true)
        {
            credentials = {
                "key": fs.readFileSync(key, 'utf8'),
                "cert": fs.readFileSync(cert, 'utf8'),
                minVersion: "TLSv1.2",
                zlib: true,
              // **optional** SPDY-specific options
              spdy: {
                protocols: ['h2','spdy/3.1', 'spdy/3', 'spdy/2'],
                plain: false,
                ssl: true,
                // **optional**
                // Parse first incoming X_FORWARDED_FOR frame and put it to the
                // headers of every request.
                // NOTE: Use with care! This should not be used without some proxy that
                // will *always* send X_FORWARDED_FOR
                'x-forwarded-for': true,
                connection: {
                  windowSize: 1024 * 1024, // Server's window size
                  // **optional** if true - server will send 3.1 frames on 3.0 *plain* spdy
                  autoSpdy31: false
                }
              }
            };
        }
    }
    
    mergeRes.fnSetPath(webStaticPath);
    mergeRes.fnWc();
    mOpt = {
        preserveLineBreaks:true,
        collapseInlineTagWhitespace:true,
        removeComments:            true,
        collapseWhitespace:        true,
        collapseBooleanAttributes: true,
        removeAttributeQuotes:     true,
        removeEmptyAttributes:     true,
        removeScriptTypeAttributes:true,
        removeStyleLinkTypeAttributes:true,
        minifyCSS:                 true,
        minifyJS:                  true
    };
    oHtmlCc = {};
    app.disable('x-powered-by');
    app.set('etag', true); 
    // gzip压缩数据
    app.use(compression({
        brotli: { quality: 11 },
        "level":9,
        "memLevel":9,
        // "strategy":// 
        "filter":function(req,res)
        {
            if(-1 < req.path.indexOf("/model") && -1 == req.path.indexOf(".json"))return false;
            var s = String(res && res.getHeader('Content-Type') || "");
            if(-1 < s.indexOf("text/") || -1 < s.indexOf("javascript") || -1 < s.indexOf("css"))
            {
                return true;
            }
            return compression.filter(req, res);
        }
    }));
    var w1 = "https://unpkg.com/*", w2 = "https://cdnjs.cloudflare.com/*",connectSources = [
        "'self'",
        "data:",
        "wss://chat.51pwn.com:" + String(option.port) + "/*",
        "https://chat.51pwn.com:" + String(option.port) + "/*",
        w1,
        w2,
        "wss://chat.51pwn.com:"+String(option.port) + "/*"
    ];
    if(os.platform() === 'darwin'){
        connectSources.push("wss://192.168.0.107:" + String(option.port)+ "/*","wss://127.0.0.1:" + String(option.port)+ "/*")
    }
    app.use(helmet());
    // 终于fixed 头部信息生效的bug
    app.use(helmet.contentSecurityPolicy({
        directives: {
          connectSrc: connectSources,
          scriptSrc: [
            "'self'",
            "https://chat.51pwn.com:" + String(option.port) + "/*",
            w2,
            w1,
            "'unsafe-inline'",
            "'unsafe-eval'",
            
          ],
          scriptSrcElem: "*"
        },
    }));
    app.use(function(req, res, next){
        res.setHeader("Alt-Svc", 'h3=":'+option.port+'"; ma=2592000');
        /* 推荐的写法
    摄像头 - camera
    麦克风 - microphone
    地理位置 - geolocation
    陀螺仪 - gyroscope

    () - 表示不允许,禁止访问该权限
    self - 表示仅允许同源使用
    * 表示允许任意来源使用
        */
        res.setHeader("Permissions-Policy", 'camera=*, microphone=*, geolocation=*,gyroscope=*');
        next();
    });
    
    
    // cache静态资源等时间，这个对性能影响很大，缓冲客户端后，在设置等时间范围内、刷新不再请求
    // Strict-Transport-Security: max-age=31536000; includeSubdomains; preload
    expressOptions.maxAge = (7*24*60*60) + 's';//'31536000s';//'3600s';
    var reRes = /(?:\/(js|css|model)\/(.*)$)|(\.mp3$)/,g_oPmap;
    app.get(reRes,function(req,res,next)
    {
        // var s11 = mime.lookup(req.path);
        if(req.path.match(/sw\.js$/)){
            expressOptions.setNoCache(res);
            doZipSFl(szSSP + "js/sw.js",res);
            return
        }
        if(req.path.match(/plyr\.svg$/)){
            doZipSFl(szSSP + "plyr.svg",res);
            return
        }
        if(req.path.match(/\.mp3$/)){
            res.setHeader("Content-Type","audio/mp3");
            res.sendFile(szSSP + req.path);
            // doZipSFl(szSSP + req.path,res);
            return
        }
        
        /*
[ '0', '/js/client.min.js' ]             // https://cdnjs.cloudflare.com/ajax/libs/ClientJS/0.2.1/client.min.js
[ '1', '/js/jquery.min.js' ]             // https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.0/jquery.min.js
[ '2', '/js/RecordRTC.min.js' ]          // https://cdnjs.cloudflare.com/ajax/libs/RecordRTC/5.6.2/RecordRTC.min.js
[ '3', '/js/adapter-latest.js' ]         // https://cdnjs.cloudflare.com/ajax/libs/webrtc-adapter/8.2.3/adapter.min.js
[ '4', '/js/qrcode.min.js' ]             // https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js
[ '5', '/js/plyr.js' ]                   // https://cdnjs.cloudflare.com/ajax/libs/plyr/3.7.8/plyr.min.js
[ '6', '/js/html5-qrcode.min.js' ]       // https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js
[ '7', '/js/crypto-js.min.js' ]          // https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js
[ '8', '/js/fix.js' ]                    // https://unpkg.com/web-ai-51pwn@latest/dist/8.js
[ '9', '/js/tfjs.js' ]                   // https://cdnjs.cloudflare.com/ajax/libs/tensorflow/4.10.0/tf.min.js
[ '10', '/js/webtorrent.min.js' ]        // https://cdnjs.com/libraries/webtorrent
[ '11', '/js/stunLists.js' ]
[ '12', '/js/p2pfs.js' ]
        */
        var aj = "/js/client.min.js,/js/jquery.min.js,/js/RecordRTC.min.js,/js/adapter-latest.js,/js/qrcode.min.js,/js/plyr.js,/js/html5-qrcode.min.js,/js/crypto-js.min.js,/js/fix.js,/js/tfjs.js,/js/webtorrent.min.js,/js/stunLists.js,/js/p2pfs.js".split(",");
        // for(var k in aj){
        //     console.log([k,aj[k]])
        // }
        var s7 = req.path.substring(4);
        var n12 = parseInt(s7.substring(0,s7.length - 3));
        
        // console.log([n12,aj[n12]])
        
        if(aj[n12] && fs.existsSync(szSSP + aj[n12])){
            var stt = fs.statSync(szSSP + aj[n12]);
            expressOptions.setLongTermCache(res,stt);
            doZipSFl(szSSP + aj[n12],res);
            return
        }
        if(req.path.match(/i\.js/)){
            doZipSFl(szSSP + "js/i.js",res);
            return
        }
    
        // console.log(req.url, "xx",getNowStr())
        mergeRes.fnDoMg(req,res,next,reRes);
        // next();
    });
    app.use(function(req, res, next){
        szPath = req.path;
        
        if("" == szPath || "/" == szPath || "/index.html" == szPath){
            // if(String(req.headers["user-agent"]||"").indexOf("Safari") > -1){
            //     // 静态资源
            //     var a09 = [ szCjs,
            //     szCcss,
            //     "/js/client.min.js",
            //     "/js/client.min.js.map",
            //     "/socket.io/socket.io.js",
            //     "/js/jquery.js",
            //     "/plyr.svg",
            //     "/js/sw.js",
            //     "/js/RecordRTC.min.js",
            //     "/js/adapter-latest.js",
            //     "/js/qrcode.min.js",
            //     "/js/plyr.js",
            //     "/js/html5-qrcode.min.js",
            //     "/js/aes.js",
            //     "/js/fix.js",
            //     "/js/bundle.js"];
            //     for(var i = 0; i < a09.length; i++){
            //         try{
            //             var szFn = a09[i];
            //             doPush(res,szFn);
            //         }catch(e){break;}
            //     }
            // }

            var szEn = String(res.getHeader("accept-language") || ""),szFn = "/index.html";
            if(0 == szEn.indexOf("en"))szFn = "/index_en.html";
            html = oHtmlCc[szFn] || minify(fs.readFileSync("static" + szFn).toString("utf-8"), mOpt);
            oHtmlCc[szFn] = html;
            // 创建一个 MD5 哈希对象
            // const hash = crypto.createHash("md5");
            // hash.update(html);
            // res.setHeader("Content-MD5",crypto.digest("md5", hash.digest()));
            res.send(html);
            return
        }
        next();
    });
    // app.use(express.limit('4M')),app.use(express.bodyParser());
    // app.use(bodyParser.json({limit: '150mb'}));
    // app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    //     limit: '150mb',
    //     extended: true
    // })); 
    // app.use(express.json());app.use(express.urlencoded());

    async function doZipSFl(szFl,res){
        szFl = szFl.replace(/\/+/g,"/")
        var szT = mime.lookup(szFl);
        if(/\.mp3$/.test(szFl)){
            szT = "audio/mp3"
        }
        res.setHeader("Content-Type",szT);
        var bZip = -1 == szFl.indexOf("/model") && -1 == szFl.indexOf(".json")
        // if(bZip)res.setHeader('Content-Encoding', 'gzip');
        var ss = oHtmlCc[szFl];
        
        if(!ss){
            ss=fs.readFileSync(szFl);
            if(/\.js$/g.test(szFl)){
                if(/sw\.js$/g.test(szFl)){
                    ss = await mergeRes.HxJs1(ss.toString("utf-8"));
                }else if(/i\.js$/g.test(szFl))ss = await mergeRes.HxJs(ss.toString("utf-8"));
            }
        }
        oHtmlCc[szFl] = ss;
        // var ss = fs.createReadStream(szFl,{autoClose:true});
        // console.log(szFl)
        // if(bZip)ss = ss.pipe(zlib.createGzip())
        // ss.pipe(res);
        // closeStream(res,ss);
        res.end(ss);
        // res.end();
    }
    // 检查user-agent，避免工具、攻击，不合法的ua拒绝访问
    function fnCheckUa(req,res)
    {
        // if(true)return true;
        // console.log(req.headers);
        // console.log('IP:' + [String(req.connection.remoteAddress),req.headers['user-agent']].join(', '));
        // 记录访问者信息
        var obj = {
            "ip":/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g.exec(String(req.connection.remoteAddress))[1],
            "user-agent": req.headers['user-agent'],
            href:req.href
        };
        fs.appendFile("db/" + obj.ip,JSON.stringify(obj),function(){});
        
        var ua = useragent.is(req.headers['user-agent'] || ""), 
            bFlg = req.headers['user-agent'] == 'acme-tiny' || ua.opera || ua.webkit || ua.ie || ua.chrome || ua.safari || ua.mobile_safari || ua.firefox || ua.mozilla || ua.android;

        var szOrigin = req.headers['origin'],fnCls=function(szKey){
            fnOnLog(ua);
            fnOnLog('close:' + [String(req.connection.remoteAddress),req.headers[szKey]].join(', '));
            req.connection.destroy();
            return false;
        };

        if(szOrigin)
        {
            szOrigin=szOrigin.split(/http[s]?:\/\//);
            if(2 != szOrigin.length)
                return fnCls('origin');
            szOrigin = szOrigin[1].split(/[\/:#\?;]/)[0];
            if(bFlg && !wtHosts.find(function(s0){
                return s0 == szOrigin;
            }))return fnCls('origin');
        }
        var fnFh = function(h1)
        {
            return h1 == req.headers['host'];
        };
        if(bFlg && wtHosts.find(fnFh))return true;
        return fnCls('user-agent');
    }

    // 避免js转义
    // juicer.set({
    //     'script': false,
    //     'strip': false,
    //     'cache': false
    // });
    var szSSP = webStaticPath;
    
    app.use(function(req,res,next){
        var szPm = szSSP + "js/pmap.json";
        if(!g_oPmap){
            if(fs.existsSync(szPm))g_oPmap=JSON.parse(fs.readFileSync(szPm));
            else g_oPmap={};
        }
        var szIp = String(req.connection.remoteAddress);
        if(-1 < szIp.indexOf("127.0.0.1")){
            if(-1 == req.url.indexOf("?")){
                // mergeRes.setJm();
                g_oPmap[req.url]=1;
                fs.writeFileSync(szPm,JSON.stringify(g_oPmap));
                // req.connection.destroy();
            }
        }else if(!g_oPmap[req.url]){
            console.log("终止",req.url)
            req.connection.destroy();
            return;
        }
        next();
    });
    
    app.use(express.static(szSSP, expressOptions));
    // app.use('/stunLists.js', browserify(['fs',{'./readstunlist.js':{run: true,precompile:true,minify:true,gzip:true,debug:false}}]));
    // apt-get install coturn
    // yum install coturn
    // /etc/turnserver.conf
    // 需要关闭，否则报错： Refused to execute a script because its hash, its nonce, or 'unsafe-inline' does not appear in the script-src directive of the Content Security Policy.
    // app.use(function(req, res, next)
    // {
    //     // console.log(req.url);
    //     if(bUseHttps)
    //     {
    //         if(!res.locals.nonce)res.locals.nonce = uuid.v4();
    //     }
    //     // if(fnCheckUa(req,res))next();// else 
    //     next();
    // });

    // https://www.npmjs.com/package/express-session
    if(bUseHttps)app.set('trust proxy', 1),fnOnLog("open https SSL");

    // 并发限制
    var limiter = expresslimiter(app, pubClient);
    limiter({
        path: '*',// "post"
        method: 'all',
        lookup: ['connection.remoteAddress'],
        // 本机访问不受并发限制
        whitelist:function (req) 
        {
            var eRg = /^(127\.0\.0\.1|192\.168\.|localhost|172\.17\.0\.[1-10]).*/g,s = String(req.connection.remoteAddress),
                eGetIp = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/gmi;
            s = eGetIp.exec(s) || '';
            if(s)s = s[1];
            return !!eRg.exec(s);
        },
        onRateLimited: function (req, res, next)
        {
            req.connection.destroy();
            // next({ message: '客户端1分钟内只允许并发连接' + nMaxConn, status: nCd });// 429
        },
        // 150 requests per hour
        total: nMaxConn,
        skipHeaders: false,
        expire: 1000 * 60 * 60
    });
    // Content-Type: application/csp-report
    app.post("/rptv",function(req,res)
    {
        res.end();
    });

    
    // app.set('view engine', 'html');
    // app.engine('html', function(path, options, fn){
    //     // console.log(options);
    // 	fs.readFile(path, 'utf8', function(err, str){
    // 		if (err) return fn(err);
    // 		str = juicer(str, options);
    // 		fn(null, str);
    // 	});
    // });
    // app.get('/', function(req, res){
    //     //try{
    //         res.sendFile(path.join(path.join(szSSP, 'index.html')));
    //     //}catch(e){console.log(e)}
    // });
    
    if(option.cbkApp)option.cbkApp(app);

    // 100M
    var server = null,nMxsize = 100 * 1024 * 1024,oSvOpt = {maxHttpBufferSize:nMxsize};

    if(bUseHttps)server = spdy.createServer(credentials,app,oSvOpt);// require('https').createServer(credentials,app);
    else server = require('http').createServer(app,oSvOpt);
    server.on('stream', (stream, reqHeaders) => {
        if(reqHeaders[http2.constants.HTTP2_HEADER_PATH]) {
          console.log(reqHeaders[http2.constants.HTTP2_HEADER_PATH]);  
            //   case '/': return serveAsset(stream, DOCUMENT);
        }
      });
    // 不能加，否则rdp不正常：, { serveClient: false }
    var io = new require('socket.io')(server, {
        // path:'/x',// 如果设置了需要修改相关静态的路径
        secure: bUseHttps,
        autoConnect:true,
        maxHttpBufferSize: 1e8// 100M
    });
    // https://github.com/muaz-khan/WebRTC-Experiment/blob/master/socketio-over-nodejs/signaler.js
    // 不能加下面代码，否则报错
    // io.set('transports', [
    // // 'websocket',
    // 'xhr-polling',
    // 'jsonp-polling'
    // ]);

    // 集群下用同一个redis
        io.adapter(createAdapter(pubClient, subClient));
    // }catch(e){
    //     io.adapter(redisAdapter({ host: 'docker.for.mac.localhost', port: 6379 }));
    // }


    var szSsh = [],aSsh = {},oNoRpt = {};
    var fnGetSsh = function(k)
    {
        pubClient.get(k,function(e,r)
        {
            r = JSON.parse(r);
            szSsh.push(r.id);
            var szK = [r.host,r.port,r.username].join("_");
            if(oNoRpt[szK])
            {
                console.log("del :");
                // console.log(r);
                pubClient.del(r.id,function(e,r1)
                {
                    // console.log(r1);
                });
                return;
            }
            else aSsh[r.id] = r;
            oNoRpt[szK] = r;
        });
    }
    global.aSsh = aSsh;
    global.oNoRpt = oNoRpt;
    pubClient.keys('*', function (err, keys)
    {
        if (err) return console.log(err);
        for(var i = 0, len = keys.length; i < len; i++)
        {
            if(0 == keys[i].indexOf("ssh"))
            {
                fnGetSsh(keys[i]);
            }
        }
    });

    //*/ 实际上这里等数据只发送当前连接等客户端一次，因此是可以直接关闭等
    if(option.cbk4ServerAppIo)option.cbk4ServerAppIo(server,app,io);
    
    // 拦截关闭404
    app.use("*",function(req, res, next)
    {
        if (req.url.indexOf("/?EIO=") > -1)
        {
            next();
            return;
        }
        // if(err)
        // console.log("destroy: " + req.url)
        // console.log(req.headers)
        // req.connection.destroy();
        next()
    })
    var nPort = option.port || 3000;
    fnOnLog("start port " + nPort);
    server.listen(nPort);
}
// myapp = Object.setPrototypeOf(myapp,EventEmitter.prototype)
module.exports = myapp;

