const VERSION = 'v1';
// 缓存
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(VERSION).then(function(cache) {
      return cache.addAll('/model/v1tiny/group1-shard14of16;/model/v1tiny/group1-shard15of16;/model/v1tiny/model.json;/model/v1tiny/group1-shard16of16;/model/v1tiny/group1-shard12of16;/model/v1tiny/group1-shard13of16;/model/v1tiny/group1-shard11of16;/model/v1tiny/group1-shard10of16;/model/v1tiny/group1-shard2of16;/model/v1tiny/group1-shard3of16;/model/v1tiny/group1-shard1of16;/model/v1tiny/group1-shard4of16;/model/v1tiny/group1-shard5of16;/model/v1tiny/group1-shard7of16;/model/v1tiny/group1-shard6of16;/model/v1tiny/group1-shard8of16;/model/v1tiny/group1-shard9of16;/model/v3tiny/model.json;/model/v3tiny/group1-shard8of9;/model/v3tiny/group1-shard9of9;/model/v3tiny/group1-shard2of9;/model/v3tiny/group1-shard6of9;/model/v3tiny/group1-shard7of9;/model/v3tiny/group1-shard3of9;/model/v3tiny/group1-shard4of9;/model/v3tiny/group1-shard1of9;/model/v3tiny/group1-shard5of9;/model/v2tiny/model.json;/model/v2tiny/group1-shard11of11;/model/v2tiny/group1-shard10of11;/model/v2tiny/group1-shard2of11;/model/v2tiny/group1-shard3of11;/model/v2tiny/group1-shard1of11;/model/v2tiny/group1-shard4of11;/model/v2tiny/group1-shard5of11;/model/v2tiny/group1-shard7of11;/model/v2tiny/group1-shard6of11;/model/v2tiny/group1-shard8of11;/model/v2tiny/group1-shard9of11;/model/v3/group1-shard7of60;/model/v3/model.json;/model/v3/group1-shard6of60;/model/v3/group1-shard4of60;/model/v3/group1-shard59of60;/model/v3/group1-shard58of60;/model/v3/group1-shard5of60;/model/v3/group1-shard1of60;/model/v3/group1-shard60of60;/model/v3/group1-shard48of60;/model/v3/group1-shard49of60;/model/v3/group1-shard2of60;/model/v3/group1-shard3of60;/model/v3/group1-shard39of60;/model/v3/group1-shard11of60;/model/v3/group1-shard10of60;/model/v3/group1-shard38of60;/model/v3/group1-shard12of60;/model/v3/group1-shard13of60;/model/v3/group1-shard17of60;/model/v3/group1-shard16of60;/model/v3/group1-shard14of60;/model/v3/group1-shard28of60;/model/v3/group1-shard29of60;/model/v3/group1-shard15of60;/model/v3/group1-shard18of60;/model/v3/group1-shard30of60;/model/v3/group1-shard24of60;/model/v3/group1-shard25of60;/model/v3/group1-shard31of60;/model/v3/group1-shard19of60;/model/v3/group1-shard27of60;/model/v3/group1-shard33of60;/model/v3/group1-shard32of60;/model/v3/group1-shard26of60;/model/v3/group1-shard22of60;/model/v3/group1-shard36of60;/model/v3/group1-shard37of60;/model/v3/group1-shard23of60;/model/v3/group1-shard35of60;/model/v3/group1-shard21of60;/model/v3/group1-shard20of60;/model/v3/group1-shard34of60;/model/v3/group1-shard53of60;/model/v3/group1-shard47of60;/model/v3/group1-shard46of60;/model/v3/group1-shard52of60;/model/v3/group1-shard44of60;/model/v3/group1-shard50of60;/model/v3/group1-shard51of60;/model/v3/group1-shard45of60;/model/v3/group1-shard8of60;/model/v3/group1-shard41of60;/model/v3/group1-shard55of60;/model/v3/group1-shard54of60;/model/v3/group1-shard40of60;/model/v3/group1-shard9of60;/model/v3/group1-shard56of60;/model/v3/group1-shard42of60;/model/v3/group1-shard43of60;/model/v3/group1-shard57of60;/model/yolov8n-seg_web_model/model.json;/model/yolov8n-seg_web_model/metadata.yaml;/model/yolov8n-seg_web_model/group1-shard1of4.bin;/model/yolov8n-seg_web_model/group1-shard3of4.bin;/model/yolov8n-seg_web_model/group1-shard4of4.bin;/model/yolov8n-seg_web_model/group1-shard2of4.bin;/model/yolov8n_web_model/model.json;/model/yolov8n_web_model/metadata.yaml;/model/yolov8n_web_model/group1-shard1of4.bin;/model/yolov8n_web_model/group1-shard3of4.bin;/model/yolov8n_web_model/group1-shard4of4.bin;/model/yolov8n_web_model/group1-shard2of4.bin;/models/fuse/ocr/ch_PP-OCRv2_rec_fuse_activation/model.json;/models/fuse/ocr/ch_PP-OCRv2_rec_fuse_activation/chunk_2.dat;/models/fuse/ocr/ch_PP-OCRv2_rec_fuse_activation/chunk_1.dat;/models/fuse/ocr/ch_PP-OCRv2_det_fuse_activation/model.json;/models/fuse/ocr/ch_PP-OCRv2_det_fuse_activation/chunk_1.dat;/css/,.css;/socket.io/socket.io.js;/js/client.min.js;/js/jquery.js;/js/RecordRTC.min.js;/js/adapter-latest.js;/js/qrcode.min.js;/js/plyr.js;/js/html5-qrcode.min.js;/js/aes.js;/js/fix.js;/js/kindle.js;/js/ie.js;/js/,.js'.split(";"));
    })
  );
});

// 缓存更新
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          // 如果当前版本和缓存版本不一致
          if (cacheName !== VERSION) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 捕获请求并返回缓存数据
self.addEventListener('fetch', function(event) {
  event.respondWith(caches.match(event.request).catch(function() {
    return fetch(event.request);
  }).then(function(response) {
    caches.open(VERSION).then(function(cache) {
      cache.put(event.request, response);
    });
    return response.clone();
  }).catch(err => caches.match(e.request).then(res => res)));
});