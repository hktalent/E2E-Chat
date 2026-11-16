var fs = require('fs'),
    os = require('os'),
    request = require('request'),
    socketIo=new require('socket.io'),
    // crypto = require("crypto"),
    // brotli = require('brotli'),
    express = require('express'),
    cookieParser = require("cookie-parser"),
    app = express(),
    serverRootPath = __dirname + "/",
    Mime = require(serverRootPath +'Mime'),
    minify = require('html-minifier').minify, 
    webStaticPath = __dirname + "/static/",
    mergeRes = require('./mergeRes'),
    os = require('os'),
    szCurPath = __dirname + "/",
    EventEmitter = require('events').EventEmitter,
    // yum install redis;systemctl start redis.service;systemctl status redis.service
    // apt install redis;service redis-server start
    // brew install redis;brew services restart redis
    nMaxConn = 100,
    // https://github.com/helmetjs/helmet/  standalone module: helmet-csp  Content-MD5
    helmet = require('helmet'),
    // session = require('express-session'),
    expressOptions = require('./expressOptions'),
    compression = require('compression'),
    bUseHttps = true,
    credentials = {},
    isUrlAllowed={"http://192.168.0.125:81/stream":1}
function getNowStr() {
	var now = new Date();
	var year = now.getFullYear(),month = now.getMonth() + 1,date = now.getDate(),hour = now.getHours(),minute = now.getMinutes(),second = now.getSeconds();
	function p (s) {
		return s < 10 ? '0' + s : s;
	}
	var timeFormat = year + "-" + p(month) + "-" + p(date) + " " + p(hour) + ":" + p(minute) + ":" + p(second);
	return timeFormat;
}
// 静态文本缓存（按 mtime 失效），避免每次请求同步读盘
var g_oFileCache = {}, g_oLangDir = { list: [], ts: 0 };
function doFileCache(szFl) {
    var nMt = 0;
    try { nMt = fs.statSync(szFl).mtimeMs } catch (e) { }
    var oC = g_oFileCache[szFl];
    if (!oC || oC.mtime !== nMt) {
        oC = { mtime: nMt, data: fs.readFileSync(szFl).toString("utf-8") };
        g_oFileCache[szFl] = oC;
    }
    return oC;
}
// 语言目录列表缓存，避免每次请求 readdirSync
function doLangList(szBase) {
    var nNow = Date.now();
    if (!g_oLangDir.list.length || 60000 < nNow - g_oLangDir.ts) {
        g_oLangDir.list = fs.readdirSync(szBase);
        g_oLangDir.ts = nNow;
    }
    return g_oLangDir.list;
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
    var key = option.caKey || szCurPath + '/../ca/domain.key',cert = option.caCert || szCurPath + '/../ca/chained.pem';
    bUseHttps = option.useHttps || false;
    if(option.useHttps && fs.existsSync(key) && fs.existsSync(cert))
    {
        if(bUseHttps == true){
            credentials = {
                "key": fs.readFileSync(key, 'utf8'),
                "cert": fs.readFileSync(cert, 'utf8'),
                minVersion: "TLSv1.2",
                zlib: true,
            };
        }
    }
    
    mergeRes.fnSetPath(webStaticPath);
    mergeRes.fnWc();
    // 预热合并后的 js/css，避免首个访问者等待数秒的压缩/混淆
    mergeRes.fnPrewarm();
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
    // 缓存
    let oHtmlCc = {};
    // 并发、快速 初始化
    (async ()=>{
        const a = String(`/index.html
tfjs.js
face-api.js
html2canvas.min.js
webtorrent.min.js
i.js
client.min.js
jquery.min.js
RecordRTC.min.js
adapter-latest.js
qrcode.min.js
plyr.js
html5-qrcode.min.js
crypto-js.min.js
fix.js`).split("\n")
        a.map(async (s, k) => {
            if(s)
            (async (s,k)=>{
                setTimeout(async ()=>{
                    const n1 = new Date().getTime();
                    if(k > 0){
                        var k1 = webStaticPath+"js/" + s;
                        if(!oHtmlCc[k1]){
                            fs.readFile(k1,async (err, data) => {
                                if(err)return;// await mergeRes.HxJs1(data.toString("utf-8"));
                                oHtmlCc[k1] = data.toString("utf-8");
                                console.log("init",s, new Date().getTime() - n1, "ms");
                            });
                        }
                    }else if(!oHtmlCc[s]){
                        fs.readFile("static" + s,async (err, data) => {
                            if(err)return;
                            oHtmlCc[s] = minify(data.toString("utf-8"), mOpt);
                            console.log("init",s, new Date().getTime() - n1, "ms");
                        });
                    }
                },0);
            })(s,k);
        });
    })();
    app.disable('x-powered-by');
    app.set('etag', true); 
    // gzip压缩数据
    app.use(compression({
        brotli: { quality: 5 },
        "level":6,
        "memLevel":8,
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
    const self = `'self'`;
    var w1 = "https://unpkg.com/*", w2 = "https://cdnjs.cloudflare.com/*",connectSources = [
        self,
        "data:",
        "blob:",
        "wss://chat.51pwn.com:" + String(option.port) + "/*",
        "https://chat.51pwn.com:" + String(option.port) + "/*",
        w1,
        w2,
        "wss://chat.51pwn.com:"+String(option.port) + "/*"
    ];
    if(os.platform() === 'darwin'){
        connectSources.push("wss://192.168.0.107:" + String(option.port)+ "/*","wss://127.0.0.1:" + String(option.port)+ "/*")
    }
    let doBrGzip = function(szFl,req,res){
        var a = {},szRt = __dirname+"/tmp/static"+szFl;
        
        String(req.headers["accept-encoding"]||"").replace(/ /g,"").split(",").map(s=>{a[s.toLowerCase()]=!!1});
        if(a["br"] && fs.existsSync(szRt+".br")){
            res.contentType(Mime.getMime(szFl));
            res.setHeader('Content-Encoding', 'br');
            res.sendFile(szRt+".br");
            // console.log("send file:" +szFl+".br")
            return true
        }
        if((a["gzip"]||a["deflate"]) && fs.existsSync(szRt+".gzip")){
            res.contentType(Mime.getMime(szFl));
            res.setHeader('Content-Encoding', 'gzip');
            res.sendFile(szRt+".gzip");
            // console.log("send file:" +szFl+".gzip")
            return true
        }
        return false
    }
    
    app.use(helmet());
    const images = [`https:`, `data:`];
    // 终于fixed 头部信息生效的bug
    app.use(helmet.contentSecurityPolicy({
        directives: {
            connectSrc: connectSources,
            workerSrc: [
                self,
                "blob:"
            ],
            objectSrc: [self],
            imgSrc: [self, ...images],
            scriptSrcAttr:[self,"'unsafe-inline'"],
            scriptSrc: [
                self,
                "https://chat.51pwn.com:" + String(option.port) + "/*",
                w2,
                w1,
                "'unsafe-inline'",
                "'unsafe-eval'",
                "blob:", // 允许加载 blob：URL
                "https://static.cloudflareinsights.com/*"
            ],
            scriptSrcElem: "*",
            mediaSrc: ["*"] // 允许任意的<video>元素访问任意的URL
        },
    }));
    app.use(function(req, res, next){
        res.setHeader("Alt-Svc", 'h3=":'+option.port+'"; ma=2592000');
        res.setHeader("Access-Control-Allow-Origin","*");
        res.setHeader("Timing-Allow-Origin", "*")
        res.setHeader("Vary", "Origin")
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin")
        res.setHeader("Permissions-Policy", 'camera=*, microphone=*, geolocation=*,gyroscope=*');
        next();
    });
    

    expressOptions.maxAge = (7*24*60*60) + 's';//'31536000s';//'3600s';
    var reRes = /(?:\/(js|css|model)\/(.*)$)|(\/tagmgmt\/bs\.js$)|(\.mp3$)/,g_oPmap,nPmapTs = 0;
    
    app.use(cookieParser()); 
    app.use(function(req,res,next){
        if(/^\/flags\/[^\.]+\.svg$/g.test(req.path)) {
            let szP = webStaticPath + req.path;
            if(!fs.existsSync(szP)){
                szP = webStaticPath+"flags/us.svg";
            }
            if(doBrGzip(szP.substring(0,webStaticPath.length),req,res))return;
            res.setHeader("Content-Type","image/svg+xml");
            res.sendFile(szP);
            return;
        }
        next();
    });
    // 从 "http://192.168.0.125:81/stream" 读取视频流并返回
    app.get("/stream",async function(req,res,next){
        try{
            let url = decodeURIComponent(req.query.u||"");
            if(!url || !isUrlAllowed[url]){
                res.end("error");
                return;
            }
            let stream1 = request(url);
            stream1.on('error', function(e) {// 上游不可用时不要把连接拖死
                console.log("stream error", e.message);
                if(!res.headersSent)res.status(502);
                res.end("error");
            });
            stream1.on('response', function(response) {// 将流媒体的头信息一起输出到客户端
                res.set(response.headers);
                response.pipe(res);
            });
            req.on('close', function() {// 当客户端关闭连接时，结束流
                stream1.destroy();
                console.log("stream close");
            });
        }catch(e){console.log(e)}
    });
    app.get("/lang/index.js",function(req,res,next){
        res.setHeader("Content-Type","application/javascript");
        var szLf = webStaticPath+req.path, oC = doFileCache(szLf);
        res.setHeader("Cache-Control","public, max-age=600, must-revalidate");
        res.setHeader("Last-Modified", new Date(oC.mtime).toUTCString());
        res.end(oC.data);
    });
    app.get("/js/lang.js",function(req,res,next){
        res.setHeader("Content-Type","application/javascript");
        // 获取 cookie 中 语言设置，并覆盖
        var lg = String(req.cookies.lang||req.headers["accept-language"] || "en").replace(/ /gm,"").split(",")[0];
        if(req.query.lang)lg = String(req.query.lang).replace(/ /gm,"");
        if(lg.length>8){
            return res.end("alert('error');");
        }
        // 兼容 zh-cn / ZH-CN / zh_CN / cn 等历史写法，按文件名大小写不敏感匹配
        var szBase = webStaticPath+"lang/";
        var aLangFiles = doLangList(szBase);
        function findLangFile(sCode){
            var sWant = String(sCode).replace(/_/g,"-").toLowerCase()+".js";
            var aAlias = {"cn":"zh-cn","tw":"zh-tw","hk":"zh-tw"};
            sWant = (aAlias[sWant.slice(0,-3)] || sWant.slice(0,-3))+".js";
            for(var i=0;i<aLangFiles.length;i++){
                if(aLangFiles[i].toLowerCase() === sWant)return szBase+aLangFiles[i];
            }
            return "";
        }
        var szLangFile = findLangFile(lg);
        if(!szLangFile && -1 < lg.indexOf("-"))szLangFile = findLangFile(lg.split("-")[0]);
        if(!szLangFile)szLangFile = findLangFile("en") || szBase+"en.js";

        var oC = doFileCache(szLangFile);
        res.setHeader("Cache-Control","public, max-age=600, must-revalidate");
        res.setHeader("Last-Modified", new Date(oC.mtime).toUTCString());
        res.end(oC.data);
    });
    // 兼容旧版客户端：/v8.js 改由 /js/v8.js 按需合并，避免容器启动清理后 404
    app.get("/v8.js",function(req,res,next){
        res.redirect(302,"/js/v8.js");
    });
    app.get("/tfjs-backend-wasm-simd.wasm",function(req,res,next){
        res.setHeader("Content-Type","application/wasm");
        // console.log(szSSP+"model/tfjs-backend-wasm-simd.wasm")
        res.sendFile(szSSP+"model/tfjs-backend-wasm-simd.wasm");
    })
    
    app.get(reRes,async function(req,res,next)
    {
        if(doBrGzip(req.path,req,res))return;
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
            // res.setHeader("Content-Type","audio/mp3");
            res.contentType(Mime.getMime(req.path));
            var s4 = String(szSSP + req.path).replace(/\/+/g,"/");
            // console.log(req.path,s4,"ddddd 1");
            // req.headers["range"]
            // res.setHeader("Accept-Ranges", "none");
            // var data = fs.readFileSync(s4);// 大文件处理比较慢
            // res.end(data);
            res.sendFile(s4); // 使用 sendFile 会导致 range 多次触发而支持不友好
            // try{
            //     throw(new Error("dd"))
            // }catch(e){console.log(e)}
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
[ '13', '/js/html2canvas.min.js' ]
[ '14', '/js/face-api.min.js' ]
[ '15', '/js/dexie.js' ]

        */
        var aj = "/js/client.min.js,/js/jquery.min.js,/js/RecordRTC.min.js,/js/adapter-latest.js,/js/qrcode.min.js,/js/plyr.js,/js/html5-qrcode.min.js,/js/crypto-js.min.js,/js/fix.js,/js/tfjs.js,/js/webtorrent.min.js,/js/stunLists.js,/js/p2pfs.js,/js/html2canvas.min.js,/js/face-api.js,/js/dexie.js".split(",");
        // for(var k in aj){
        //     console.log([k,aj[k]])
        // }
        var s7 = req.path.substring(4);
        var n12 = parseInt(s7.substring(0,s7.length - 3));
        
        // console.log([n12,aj[n12]])
        
        if(aj[n12] && fs.existsSync(szSSP + aj[n12])){
            if(doBrGzip(aj[n12],req,res))return;
            var stt = fs.statSync(szSSP + aj[n12]);
            expressOptions.setLongTermCache(res,stt);
            doZipSFl(szSSP + aj[n12],res);
            return
        }
        if(req.path.match(/i\.js/)){
            if(doBrGzip("/js/i.js",req,res))return;
            expressOptions.setLongTermCache(res,fs.statSync(szSSP + "js/i.js"));
            doZipSFl(szSSP + "js/i.js",res);
            return
        }
    
        // 目标检测/报警使用的 v8.js：直接下发（混淆 257KB 需要 20s+，会阻塞事件循环）
        if("/js/v8.js" == req.path){
            if(doBrGzip("/js/v8.js",req,res))return;
            expressOptions.setLongTermCache(res, fs.statSync(szSSP + "js/v8.js"));
            doZipSFl(szSSP + "js/v8.js",res);
            return
        }
        // console.log(req.url, "xx",getNowStr())
        mergeRes.fnDoMg(req,res,next,reRes);
        // next();
    });
    app.use(function(req, res, next){
        szPath = req.path;
        if(doBrGzip(req.path,req,res))return;
        
        if("" == szPath || "/" == szPath || "/index.html" == szPath){
            var szEn = String(res.getHeader("accept-language") || ""),szFn = "/index.html";
            if(0 == szEn.indexOf("en"))szFn = "/index_en.html";
            html = oHtmlCc[szFn] || minify(fs.readFileSync("static" + szFn).toString("utf-8"), mOpt);
            if(!process.env['DEBUG'])oHtmlCc[szFn] = html;
            // console.log(szFn)
            res.send(html);
            return
        }
        next();
    });
   
    async function doZipSFl(szFl,res){
        szFl = szFl.replace(/\/+/g,"/");
        // var szT = mime.lookup(szFl);
        // if(/\.mp3$/.test(szFl)){
        //     szT = "audio/mp3"
        // }
        // res.setHeader("Content-Type",szT);
        res.contentType(Mime.getMime(szFl));
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
            // ss = ss.toString("utf-8");
        }
        if(!process.env['DEBUG'])oHtmlCc[szFl] = ss;
        // console.log(szFl,ss.length)// 这里 js
        // console.log(szFl)
        res.end(ss);
        // res.end();
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
        var szUrl = req.url.split("?")[0].split("#"[0]);
        if(-1 < szIp.indexOf("127.0.0.1")){
            if(-1 == req.url.indexOf("?")){
                // mergeRes.setJm();
                g_oPmap[szUrl]=1;
                // 节流写盘，避免每个本地请求都同步写整个映射文件
                var nNow = Date.now();
                if(5000 < nNow - nPmapTs){
                    nPmapTs = nNow;
                    fs.writeFile(szPm,JSON.stringify(g_oPmap),function(){});
                }
            }
        }else if(!g_oPmap[szUrl] && !/^\/(js|css|model|lang|vt)\/|^\/v8\.js$|^\/socket\.io\//.test(szUrl) && !fs.existsSync(webStaticPath+szUrl)){
            console.log("404",req.url)
            // 返回标准 404，而不是直接断开 TLS 连接（会导致 robots.txt 等请求异常）
            res.status(404).set("Content-Type","text/plain; charset=utf-8").end("Not Found");
            return;
        }
        next();
    });
    
    app.use(express.static(szSSP, expressOptions));
    // https://www.npmjs.com/package/express-session
    if(bUseHttps)app.set('trust proxy', 1),fnOnLog("open https SSL");

    // Content-Type: application/csp-report
    // app.post("/rptv",function(req,res)
    // {
    //     res.end();
    // });
    
    if(option.cbkApp)option.cbkApp(app);

    // 100M
    var server = null,nMxsize = 100 * 1024 * 1024,oSvOpt = {maxHttpBufferSize:nMxsize};
    if(bUseHttps){
        server = require('https').createServer(credentials,app);
    }
    else server = require('http').createServer(app,oSvOpt);
    server.on('stream', (stream, reqHeaders) => {
        if(reqHeaders[http2.constants.HTTP2_HEADER_PATH]) {
          console.log(reqHeaders[http2.constants.HTTP2_HEADER_PATH]);  
            //   case '/': return serveAsset(stream, DOCUMENT);
        }
      });
    // 不能加，否则rdp不正常：, { serveClient: false }
    var io = socketIo(server, {
        // path:'/x',// 如果设置了需要修改相关静态的路径
        secure: bUseHttps,
        autoConnect:true,
        maxHttpBufferSize: 1e8// 100M
    });
    

    var aSsh = {},oNoRpt = {};
    global.aSsh = aSsh;
    global.oNoRpt = oNoRpt;

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
        console.log("404",req.url);
        next()
    })
    var nPort = option.port || 3000;
    fnOnLog("start port " + nPort);
    server.listen(nPort);
}
// myapp = Object.setPrototypeOf(myapp,EventEmitter.prototype)
module.exports = myapp;