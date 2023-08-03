var fs = require('fs'),
    os = require('os'),
    szPath = __dirname + "/static/js/",
    szPathC = __dirname + "/static/css/",
    aFCache = {},
    bJmi = !!0,
    bIsMacOsSelf = os.platform() === 'darwin',
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
var g_cache = {},
    { minify } = require("terser"),
    minifyOptions = {
    compress: {
        drop_console: bJmi,//移除所有console相关代码；
        drop_debugger: bJmi,//移除自动断点功能；
        pure_funcs: bJmi?["console.log", "console.error"]:[] // 配置移除指定的指令，如console.log,alert等
    },
    format: {
        comments: false // 删除注释
    }
};

var JsHxOpt = {
    // selfDefending:true,
    compact: true,      // 压缩代码到一行
    debugProtectionInterval: 33, // 如果设置为true，则会在“控制台”选项卡上使用一个间隔来强制调试模式，这使得使用开发人员工具的其他功能更加困难。 启用了debugProtection，才可以使用。
    disableConsoleOutput: true,     // 通过将它们替换为空函数，禁用console.log，console.info，console.error，console.warn，console.debug，console.exception和console.trace的使用。
    deadCodeInjectionThreshold: 0.2,// 节点加入废代码的概率，值越大，混淆代码大小越大
    controlFlowFlatteningThreshold: 0.35,// 必须 >= 0.3，否则各种冲突，报错，每个节点采用平展控制流的概率，该参数主要用来优化大代码的性能和代码大小。大量的平展控制流会是代码运行效率变差而且代码增大。 设置为0表示关闭平展控制流
    numbersToExpressions: true, // 将数字转换为等效的表达式。例如，将数字转换为等效的二进制表达式。 该选项会增加混淆代码的大小（最大100%）
    simplify: true, // 简化代码，例如：将if语句转换为三元表达式。 该选项会增加混淆代码的大小（最大100%）
    sourceMap: false, // 是否生成sourceMap
    /*identifierNamesGenerator
    类型：string      默认值：hexadecimal

设置变量名称生成器，可以使用下面的值：

dictionary: 变量名称来自identifiersDictionary
hexadecimal:变量名称像 _0xabc123
mangled: 短变量名称如： a, b, c
mangled-shuffled: 和mangled一样，但是变量是乱序的*/
    // identifierNamesGenerator: 'mangled-shuffled',// 变量名称生成器
    stringArrayShuffle: true, // 打乱字符串数组的顺序，增加混淆代码的大小（最大100%）
    splitStrings: true, // 将字符串拆分为字符串数组，增加混淆代码的大小（最大100%）
    log: false, // 是否打印混淆日志
    // stringArrayEncoding: ['rc4'], // 字符串数组加密方式，可以使用多种加密方式，例如：['base64', 'rc4'],使用rc4对stringArray值进行编码。大约比base64慢30-50%，但更难获得初始值。建议在使用rc4编码时禁用UnicodeScapeSequence选项，以防止出现非常大的混淆代码。
    // UnicodeScapeSequence: false, // 是否使用Unicode转义序列对字符串进行编码。例如：\u0041
    // stringArrayIndexShift: true, // 是否将字符串数组的索引值移动到0，增加混淆代码的大小（最大100%）
    // stringArrayWrappersCount: 1, // 生成的字符串数组的最大包装器数
    // stringArrayWrappersChainedCalls: true, // 是否将字符串数组包装器链接在一起，以减少混淆代码的大小（最大100%）
    // stringArrayWrappersParametersMaxCount: 2,// 生成的字符串数组的最大参数数
    // stringArrayWrappersType: 'variable',// 可以使用的值：['variable', 'function', 'property']
    stringArrayThreshold: 0.3 // 生成的字符串数组的最小长度
};
if(bJmi){
    Object.assign(JsHxOpt, {
        controlFlowFlattening: true,  // 是否开启平展控制流。此选项对性能的影响最大为运行速度降低1.5倍。 使用controlFlowFlatteningThreshold设置将受控制流展平影响的节点的百分比。平展控制流是源代码的结构转换，让代码变得难以阅读。
        deadCodeInjection: true, // 向代码中注入死代码，增加混淆代码的大小（最大100%）
        domainLock: ["chat.51pwn.com"],     // 限制混淆代码运行的域名,调试阶段绝对不能开启
        debugProtection: true, // 如果您打开开发人员工具，会冻结您的浏览器，不允许调试.使用该选项，几乎不可能使用开发人员工具的调试器功能（基于WebKit和Mozilla Firefox的浏览器上）
    });
}

function setJm(){
    // bJmi = false;
    delete JsHxOpt.domainLock;
    delete JsHxOpt.debugProtection;
}
if(bIsMacOsSelf){
    setJm()
}

// 最佳性能
// var JsHxOpt = {
//     // 发布时启用
//     // domainLock: ["chat.51pwn.com"],     // 限制混淆代码运行的域名,调试阶段绝对不能开启
//     // debugProtection: true, 
//     // disableConsoleOutput: true,
//     compact: true,
//     controlFlowFlattening: false,
//     deadCodeInjection: false,
//     debugProtectionInterval: 13,
//     identifierNamesGenerator: 'hexadecimal',
//     log: false,
//     numbersToExpressions: false,
//     renameGlobals: false,
//     rotateStringArray: true,
//     selfDefending: false,
//     shuffleStringArray: true,
//     simplify: true,
//     splitStrings: false,
//     stringArray: true,
//     stringArrayEncoding: [],
//     stringArrayIndexShift: true,
//     stringArrayWrappersCount:1,
//     stringArrayWrappersChainedCalls: true,
//     stringArrayWrappersParametersMaxCount:2,
//     stringArrayWrappersType: 'variable',
//     stringArrayThreshold:0.75,
//     unicodeEscapeSequence: false
// };
async function MakeN(){
    x11 = "p2pchat.js"
    s111 = fs.readFileSync(x11).toString("utf-8");
    s111 = (await minify(s111, minifyOptions)).code;
    var oTmp1 = {};
    Object.assign(oTmp1, JsHxOpt);
    delete oTmp1.domainLock;
    delete oTmp1.debugProtection;
    s1 = JavaScriptObfuscator.obfuscate(s111, oTmp1);
    fs.writeFileSync(x11 + "_1", String(s1));
}


if(!bIsMacOsSelf && useCc)MakeN();
else if(bIsMacOsSelf){
    fs.unlink("p2pchat.js_1",()=>{});
    fs.unlink("static/js.js",()=>{});
    fs.unlink("static/v8.js",()=>{});
    fs.unlink("static/css.css",()=>{});
}
async function fnMerg (s, t) {
    var szXf = "static/"+t + "." + t;
    // if (t == "js") s = "client.min,jquery,RecordRTC.min,adapter-latest,stunLists,qrcode.min,plyr,html5-qrcode.min,aes,fix,p2pchat,bundle";
    if (t == "js"){ 
        if(s == "v,.js"){
            s = "v8";
            szXf = "static/"+s + "." + t
        }else{ 
            s = "msd,stunLists,p2pchat";
        }
    }
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
            if("bundle" == a[i]){
                szT = szT.replace(/https:\/\/paddlejs\.[^\/]*/gm, "");
            }
            
            aFCache[sF] = szT;
            b.push(szT);
        }
    }
    g_cache[s] = b.join("\n");
    if (useCc && bJmi && t == "js") {
        var szTmp1 = g_cache[s];
        szTmp1 = (await minify(szTmp1, minifyOptions)).code;
        g_cache[s] = JavaScriptObfuscator.obfuscate(szTmp1, JsHxOpt).toString("utf-8");
    }
    if ("css" == t) {
        oM = new CleanCSS({})
        o1 = oM.minify(g_cache[s])
        g_cache[s] = o1.styles
    }
    if(useCc){
        fs.writeFileSync(szXf,g_cache[s]);
        if("js" == t)console.log("加密js已经初始化完毕 " + szXf)
    }
    return g_cache[s];
}
if(bIsMacOsSelf){// 启动时预处理，提高速度
    fnMerg(",.js", "js");
    fnMerg("v,.js", "js");
    fnMerg(",.css", "css");
}
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

module.exports = { fnDoMg: fnDoMg, fnSetPath: fnSetPath, fnWc: fnWc,setJm:setJm };