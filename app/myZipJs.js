// 字典压缩 优化js

// 统计每一个字典的使用次数
let oD = {},
    fs = require('fs'),
    s = fs.readFileSync('static/js/p2pchat.js', 'utf8').toString(),
    a = s.match(/[a-zA-Z_]{2,}/gmi),
    aS = [];// [cnt, key]
for(let i = 0; i < a.length; i++) {
    oD[a[i]]=oD[a[i]]||0;
    oD[a[i]]++;
}
// 排序 得到最多的字典
for(let key in oD) {
    aS.push([oD[key], key]);
}
aS.sort((a, b) => {
    return b[0] - a[0];
});
console.log(aS);
// 对js代码进行重构，最终输出
// eval.call(window,代码)
// 基于上面的统计字典，将最多的字典替换为一个字毸
let x = 1,aDOut = {};
let GetC = () => {
    let c = String.fromCharCode(x);
    x++;
    return c;
}
for(let i = 0; i < aS.length; i++) {
    let c = GetC(),sK = aS[i][1];
    while(c.length < sK.length && -1 < s.indexOf(c)) {
        c = GetC();
    }
    if(sK.length < 3||c.length >= sK.length) {
        break;
    }
    aDOut[c] = sK;
    s = s.replace(sK, c);
}
// 测试发现，压缩效果不理想，所以不使用
// console.log(`eval.call(window,(function(s) {
//     let q = `+JSON.stringify(aDOut)+`;
//     for(let i in q) {
//         s = s.replace(i, q[i]);
//     }
//     return s;
// })(`+JSON.stringify(s)+"));");