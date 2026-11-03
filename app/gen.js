const fs = require('fs');
const cryptoBrw = require('crypto-browserify');

const files = 'group1-shard1of4.bin,group1-shard2of4.bin,group1-shard3of4.bin,group1-shard4of4.bin,metadata.yaml,model.json'.split(',');

const fileBuffers = files.map(file => Buffer.from(fs.readFileSync(__dirname +'/static/model/yolov8n-seg_web_model/'+file)));

const infoHash = cryptoBrw.createHash('sha256').update(Buffer.concat(fileBuffers)).digest('hex');

const magnetLink = `magnet:?xt=urn:btih:${infoHash}&dn=${files.map(f=>"/model/yolov8n-seg_web_model/"+f).join(',')}`;

console.log(magnetLink);