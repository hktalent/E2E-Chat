var fs = require("fs"),JavaScriptObfuscator = require('javascript-obfuscator'),JsHxOpt = {
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

// 读取命令行文件
console.log("start obfuscate file: " + process.argv[2]);
szT = JavaScriptObfuscator.obfuscate( fs.readFileSync(process.argv[2]).toString("utf-8"), JsHxOpt)
fs.writeFileSync(process.argv[3]||process.argv[2] + "_1", String(szT));