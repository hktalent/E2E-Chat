var fs = require('fs'),
    szPath = __dirname + "/static/js/",
    szPathC = __dirname + "/static/css/",
    aFCache = {},
    bJmi = !!1,
    CleanCSS = require('clean-css'),
    JavaScriptObfuscator = require('javascript-obfuscator'),
    useCc =  !!1;

if(process.env['DEBUG'])useCc = false;
function fnWc () {
    var a = [szPath, szPathC];
    for (var i = 0; i < a.length; i++)
        fs.watch(a[i], { encoding: 'buffer' }, (eventType, filename) => {

            var sF = filename.toString();
            if (fs.existsSync(szPath + sF)) sF = szPath + sF;
            else sF = szPathC + sF;
            if (sF && "change" == eventType) {
                var szT = String(fs.readFileSync(sF).toString("utf-8"));
                aFCache[sF] = szT;
            }
        });
}

var g_cache = {};
const { minify } = require("terser");
var minifyOptions = {
    compress: {
        drop_console: true,//移除所有console相关代码；
        drop_debugger: true,//移除自动断点功能；
        pure_funcs: ["console.log", "console.error"] // 配置移除指定的指令，如console.log,alert等
    },
    format: {
        comments: false // 删除注释
    }
};

var JsHxOpt = {
    compact: true,
    controlFlowFlattening: true,
    debugProtection: false,
    debugProtectionInterval: 333,
    disableConsoleOutput: true,
    deadCodeInjectionThreshold: 0.1,
    controlFlowFlatteningThreshold: 1,
    numbersToExpressions: true,
    simplify: true,
    identifierNamesGenerator: 'hexadecimal',
    stringArrayShuffle: true,
    splitStrings: true,
    stringArrayThreshold: 1
};

async function MakeN(){
    x11 = "p2pchat.js"
    s111 = fs.readFileSync(x11).toString("utf-8");
    s111 = (await minify(s111, minifyOptions)).code
    s1 = JavaScriptObfuscator.obfuscate(s111, JsHxOpt)
    fs.writeFileSync(x11 + "_1", String(s1));
}

if(useCc)MakeN();
else{
    fs.unlink("p2pchat.js_1",()=>{});
    fs.unlink("static/js.js",()=>{});
    fs.unlink("static/css.css",()=>{});
}
async function fnMerg (s, t) {
    var szXf = "static/"+t + "." + t;
    // if (t == "js") s = "client.min,jquery,RecordRTC.min,adapter-latest,stunLists,qrcode.min,plyr,html5-qrcode.min,aes,fix,upup.min,p2pchat";
    if (t == "js") s = "client.min,jquery,RecordRTC.min,adapter-latest,stunLists,qrcode.min,plyr,html5-qrcode.min,aes,fix,bundle,p2pchat";
    // else s = "all.min,plyr,bootstrap.min,p2pchat";
    else s = "plyr,p2pchat";
    if(useCc){
        if(fs.existsSync(szXf)){
            var s1 = fs.readFileSync(szXf).toString("utf-8");
            g_cache[s] = s1;
            return s1;
        }
        if(g_cache[s]){
            return g_cache[s];
        }
    }
    console.log("开始初始化 " + szXf)
    var a = s.split(/[,;\| ]/), i = 0, b = [], sF, szPathT = (t && "css" == t) ? szPathC : szPath, szHz;
    if (t == "css") szHz = ".css";
    else szHz = ".js";

    for (; i < a.length; i++) {
        if (fs.existsSync(sF = szPathT + a[i] + szHz)) {
            var szT = String(aFCache[sF] || fs.readFileSync(sF)).toString("utf-8");
            if (useCc && t == "js" && a[i] == "p2pchat") {
            // 只对关键、核心代码加密，不然会导致移动端运行不正常
                // szT = minify(szT)
                if(bJmi){
                    szT = (await minify(szT, minifyOptions)).code
                    szT = JavaScriptObfuscator.obfuscate(szT, JsHxOpt)
                }
            }
            aFCache[sF] = szT;
            b.push(szT);
        }
    }
    g_cache[s] = b.join("\n");
    if ("css" == t) {
        oM = new CleanCSS({})
        o1 = oM.minify(g_cache[s])
        g_cache[s] = o1.styles
    }
    if(useCc){
        if ("js" == t) {
            o11 = await minify(g_cache[s], minifyOptions)
            g_cache[s] = o11.code
        }
        fs.writeFileSync(szXf,g_cache[s])
        if("js" == t)console.log("加密js已经初始化完毕 " + szXf)
    }
    return g_cache[s];
}
// 启动时预处理，提高速度
fnMerg(",", "js");
fnMerg(",", "css");

function setLongTermCache (res) {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    res.setHeader("Expires", date.toUTCString());
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
}

function TrueIp(req){
    s = req.headers['true-client-ip'] || req.headers["HTTP_CF_CONNECTING_IP".toLowerCase()] || req.headers['HTTP_CF_IPCOUNTRY'.toLowerCase()]
    if(s)console.log(s)
}

// var reRes = /\/(js|css)\/([^.]+)$/;
async function fnDoMg (req, res, next, reRes) {
    TrueIp(req)
    var a = reRes.exec(req.url), t = a[1], tp = "js" == t ? "javascript" : "css";
    if (!(/[,;\|]/g.test(req.url))) return next();

    s1 = String(req.connection.remoteAddress)
    // var bDebug = false //-1 < s1.indexOf('::ffff:127.0.0.1') || -1 < s1.indexOf('::ffff:192.168.')
    res.setHeader('content-type', 'text/' + tp);
    setLongTermCache(res)

    xx = await fnMerg(a[2], t)
    res.end(String(xx));
}
function fnSetPath (s) {
    if (s)
        szPath = s + "js/",
            szPathC = s + "css/";
}

module.exports = { fnDoMg: fnDoMg, fnSetPath: fnSetPath, fnWc: fnWc };