let fs = require('fs'),
    mergeRes = require('./mergeRes'),
    webStaticPath = __dirname + "/static/",
// 缓存
    oHtmlCc = {};

// 一次性 初始化 js、css

// 并发、快速 初始化
(async ()=>{
    const a = String(`tfjs.js
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
                                if(err)return;
                                oHtmlCc[k1] = await mergeRes.HxJs1(data.toString("utf-8"));
                                fs.writeFileSync(k1, oHtmlCc[k1]);
                                console.log("init",s, new Date().getTime() - n1, "ms");
                            });
                        }
                    }
                    // css 、html
                    // else if(!oHtmlCc[s]){
                    //     fs.readFile("static" + s,async (err, data) => {
                    //         if(err)return;
                    //         oHtmlCc[s] = minify(data.toString("utf-8"), mOpt);
                    //         console.log("init",s, new Date().getTime() - n1, "ms");
                    //     });
                    // }
                },0);
            })(s,k);
        });
    })();

// var a = "msd,stunLists,tipso.min,p2pchat".split(","),d1 = [];
// a.map(async (s, k) => {
//     if(s){
//         var k1 = webStaticPath+"js/" + s + ".js";
//         console.log(k1);
//         d1.push(fs.readFileSync(k1).toString("utf-8"));
//     }
//     fs.writeFileSync(webStaticPath+"js/,.js", await mergeRes.HxJs1(d1.join("\n")));
// });

// mergeRes.fnMerg(",.js", "js");
// fs.renameSync(webStaticPath+"js.js", webStaticPath+"/js/,.js");
