var fs = require('fs'),
    szPath = __dirname + "/static/js/", 
    szPathC = __dirname + "/static/css/", 
    aFCache = {},
    JavaScriptObfuscator = require('javascript-obfuscator'),
    enableJm = true;

function fnWc()
{
    var a = [szPath,szPathC];
    for(var i = 0; i < a.length; i++)
    fs.watch(a[i], { encoding: 'buffer' }, (eventType, filename) => 
    {
        
        var sF = filename.toString();
        if(fs.existsSync(szPath + sF))sF = szPath + sF;
        else sF = szPathC + sF;
        if (sF && "change" == eventType)
        {
            var szT = String(fs.readFileSync(sF).toString("utf-8"));
            aFCache[sF] = szT;
        }
    });
}

var g_cache = {};
function fnMerg(s,t)
{
    if(enableJm && g_cache[s]){
        return g_cache[s];
    }
    var a = s.split(/[,;\| ]/),i = 0,b = [],sF,szPathT = (t && "css" == t) ? szPathC : szPath, szHz;
    if(t == "css")szHz = ".css";
    else szHz = ".js";
    for(; i < a.length; i++)
    {
        if(fs.existsSync(sF = szPathT + a[i] + szHz))
        {
            var szT = String(aFCache[sF] || fs.readFileSync(sF)).toString("utf-8");
            aFCache[sF] = szT;
            b.push(szT);
        }
    }
    g_cache[s] = b.join("\n");
    if("js" == t){
/*
{
    compact: true,
    controlFlowFlattening: false,
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: false,
    deadCodeInjectionThreshold: 0.4,
    debugProtection: false,
    debugProtectionInterval: 0,
    disableConsoleOutput: false,
    domainLock: [],
    domainLockRedirectUrl: 'about:blank',
    forceTransformStrings: [],
    identifierNamesCache: null,
    identifierNamesGenerator: 'hexadecimal',
    identifiersDictionary: [],
    identifiersPrefix: '',
    ignoreImports: false,
    inputFileName: '',
    log: false,
    numbersToExpressions: false,
    optionsPreset: 'default',
    renameGlobals: false,
    renameProperties: false,
    renamePropertiesMode: 'safe',
    reservedNames: [],
    reservedStrings: [],
    seed: 0,
    selfDefending: false,
    simplify: true,
    sourceMap: false,
    sourceMapBaseUrl: '',
    sourceMapFileName: '',
    sourceMapMode: 'separate',
    sourceMapSourcesMode: 'sources-content',
    splitStrings: false,
    splitStringsChunkLength: 10,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayCallsTransformThreshold: 0.5,
    stringArrayEncoding: [],
    stringArrayIndexesType: [
        'hexadecimal-number'
    ],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 1,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersParametersMaxCount: 2,
    stringArrayWrappersType: 'variable',
    stringArrayThreshold: 0.75,
    target: 'browser',
    transformObjectKeys: false,
    unicodeEscapeSequence: false
}
        */
       if(enableJm){
            g_cache[s] = JavaScriptObfuscator.obfuscate(g_cache[s],{
                compact: true,
                controlFlowFlattening: true,
                controlFlowFlatteningThreshold: 1,
                numbersToExpressions: true,
                simplify: true,
                identifierNamesGenerator: 'hexadecimal',
                stringArrayShuffle: true,
                splitStrings: true,
                stringArrayThreshold: 1
            })
        }
    }
    return g_cache[s];
}

// var reRes = /\/(js|css)\/([^.]+)$/;
function fnDoMg(req,res,next,reRes)
{
    var a = reRes.exec(req.url),t = a[1],tp = "js" == t? "javascript":"css";
    if(!(/[,;\|]/g.test(req.url)))return next();
    
    s1 = String(req.connection.remoteAddress)
    // var bDebug = false //-1 < s1.indexOf('::ffff:127.0.0.1') || -1 < s1.indexOf('::ffff:192.168.')
    res.setHeader('content-type', 'text/' + tp);
    
    xx = fnMerg(a[2],t)
    res.end(String(xx));
}
function fnSetPath(s)
{
    if(s)
    szPath = s + "js/", 
    szPathC = s + "css/";
}

module.exports = {fnDoMg:fnDoMg,fnSetPath:fnSetPath,fnWc:fnWc};