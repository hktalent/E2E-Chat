var fs = require('fs'),
    os = require('os'),
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
    credentials = {};

function getNowStr() {
	var now = new Date();
	var year = now.getFullYear(),month = now.getMonth() + 1,date = now.getDate(),hour = now.getHours(),minute = now.getMinutes(),second = now.getSeconds();
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
    var key = option.caKey || szCurPath + '/../ca/domain.key',cert = option.caCert || szCurPath + '/../ca/chained.pem';
    bUseHttps = option.useHttps || false;
    if(option.useHttps && fs.existsSync(key) && fs.existsSync(cert))
    {
        if(bUseHttps == true)
        {
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
            scriptSrcElem: "*"
        },
    }));
    app.use(function(req, res, next){
        res.setHeader("Alt-Svc", 'h3=":'+option.port+'"; ma=2592000');
        res.setHeader("Permissions-Policy", 'camera=*, microphone=*, geolocation=*,gyroscope=*');
        next();
    });
    

    expressOptions.maxAge = (7*24*60*60) + 's';//'31536000s';//'3600s';
    var reRes = /(?:\/(js|css|model)\/(.*)$)|(\/tagmgmt\/bs\.js$)|(\.mp3$)/,g_oPmap;
    
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
    })
    app.get("/lang/index.js",function(req,res,next){
        res.setHeader("Content-Type","application/javascript");
        var s = fs.readFileSync(webStaticPath+req.path).toString("utf-8");
        res.end(s);
    });
    app.get("/js/lang.js",function(req,res,next){
        res.setHeader("Content-Type","application/javascript");
        // 获取 cookie 中 语言设置，并覆盖
        var lg = String(req.cookies.lang||req.headers["accept-language"] || "en").replace(/ /gm,"").split(",")[0];
        lg = webStaticPath+"lang/"+lg+".js"
        if(!fs.existsSync(lg)){
            if(-1<lg.indexOf("-")){
                lg = webStaticPath+"lang/"+lg.split("-")[0]+".js"
            }
            if(!fs.existsSync(lg))lg = webStaticPath+"lang/en.js"
        }
        // console.log([req.cookies.lang,req.headers["accept-language"],lg])
        var s = fs.readFileSync(lg).toString("utf-8");
        res.end(s);
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
            doZipSFl(szSSP + "js/i.js",res);
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
        if(-1 < szIp.indexOf("127.0.0.1")){
            if(-1 == req.url.indexOf("?")){
                // mergeRes.setJm();
                g_oPmap[req.url]=1;
                fs.writeFileSync(szPm,JSON.stringify(g_oPmap));
                // req.connection.destroy();
            }
        }else if(!g_oPmap[req.url] && !fs.existsSync(webStaticPath+req.url)){
            console.log("终止",req.url)
            req.connection.destroy();
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