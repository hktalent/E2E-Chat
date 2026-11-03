// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

// app.use(cors({
//     origin: 'https://pan.quark.cn', // 允许的跨域请求来源
//     credentials: true // 允许携带凭证
// }));
// 使用cors中间件
app.use(function(req, res, next){
    res.setHeader("Access-Control-Allow-Origin","https://pan.quark.cn");
    res.setHeader("Timing-Allow-Origin", "*");
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
});

// 提供静态文件
app.use(express.static(path.join(__dirname, 'static')));

// 启动服务器
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
