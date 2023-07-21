process.setMaxListeners(5000);
var fs = require('fs'),
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
    // https://github.com/helmetjs/csp, standalone module: helmet-csp
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
            'Content-Encoding': 'gzip',
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
    // cache静态资源等时间，这个对性能影响很大，缓冲客户端后，在设置等时间范围内、刷新不再请求
    // Strict-Transport-Security: max-age=31536000; includeSubdomains; preload
    expressOptions.maxAge = (7*24*60*60) + 's';//'31536000s';//'3600s';
    app.use(express.static("/js/sw.js", {
        maxAge: 0
    }));
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
            res.send(html);
            return
        }
        next();
    });
    // gzip压缩数据
    app.use(compression({
        "level":9,
        "memLevel":9,
        // "strategy":// 
        "filter":function(req,res)
        {
            if(-1 < req.path.indexOf("/model") && -1 == req.path.indexOf(".json"))return false;
            var s = String(res && res.getHeader('Content-Type') || "");
            if(-1 < s.indexOf("text/"))
            {
                return true;
            }
            return compression.filter(req, res);
        }
    }));
    connectSources = ["'self'", "wss://chat.51pwn.com:" + option.port,"wss://192.168.0.107:" + option.port,, "wss://chat.51pwn.com:"+option.port, "wss://127.0.0.1:" + option.port]
    if(bUseHttps)app.use(helmet({directives:{upgradeInsecureRequests:bUseHttps, connectSrc:connectSources}}));
    app.use(helmet.referrerPolicy({policy:'no-referrer'}));
    app.use(helmet());
    app.disable('x-powered-by');
    // app.use(express.limit('4M')),app.use(express.bodyParser());
    // app.use(bodyParser.json({limit: '150mb'}));
    // app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    //     limit: '150mb',
    //     extended: true
    // })); 
    // app.use(express.json());app.use(express.urlencoded());

    function doZipSFl(szFl,res){
        szFl = szFl.replace(/\/+/g,"/")
        res.setHeader("Content-Type",mime.lookup(szFl));
        var bZip = -1 == szFl.indexOf("/model") && -1 == szFl.indexOf(".json")
        // if(bZip)res.setHeader('Content-Encoding', 'gzip');
        var ss = oHtmlCc[szFl] || fs.readFileSync(szFl);
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
    var reRes = /\/(js|css|model)\/(.*)$/;
    app.use(express.static(szSSP, expressOptions));
    app.get(reRes,function(req,res,next)
    {
        var s11 = mime.lookup(req.path);
        if(req.path.match(/sw\.js$/)){
            doZipSFl(szSSP + "js/sw.js",res);
            return
        }
        if(req.path.match(/plyr\.svg/)){
            doZipSFl(szSSP + "plyr.svg",res);
            return
        }
        var aj = "/js/client.min.js,/js/jquery.js,/js/RecordRTC.min.js,/js/adapter-latest.js,/js/qrcode.min.js,/js/plyr.js,/js/html5-qrcode.min.js,/js/aes.js,/js/fix.js,/js/kindle.js,/js/ie.js,/js/v8.js".split(",");
        var s7 = req.path.substring(4);
        var n12 = parseInt(s7.substring(0,s7.length - 3));
        // console.log([n12,aj[n12]])
        if(aj[n12] && fs.existsSync(szSSP + aj[n12])){
            expressOptions.setLongTermCache(res);
            doZipSFl(szSSP + aj[n12],res);
            return
        }
        
        mergeRes.fnDoMg(req,res,next,reRes);
        // next();
    })

    // app.use('/stunLists.js', browserify(['fs',{'./readstunlist.js':{run: true,precompile:true,minify:true,gzip:true,debug:false}}]));
    // apt-get install coturn
    // yum install coturn
    // /etc/turnserver.conf
    app.use(function(req, res, next)
    {
        // console.log(req.url);
        if(bUseHttps)
        {
            if(!res.locals.nonce)res.locals.nonce = uuid.v4();
        }
        // if(fnCheckUa(req,res))next();// else 
        next();
    });

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

