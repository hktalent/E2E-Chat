
function setNoCache(res) {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  res.setHeader("Expires", date.toUTCString());
  res.setHeader("Pragma", "no-cache");
  res.setHeader("maxAge", "0");
  res.setHeader("Cache-Control", "public, no-cache");
}
var oNow = new Date(),sz1 = oNow.toUTCString();
oNow.setFullYear(oNow.getFullYear() + 1);
function setLongTermCache(res,stat) {
  // res.setHeader("Expires", sz1);
  res.setHeader("Cache-Control", "public, max-age=31536000");
  res.setHeader("Date", sz1);
  var szL = sz1;
  if(stat && stat.mtime){
    szL = stat.mtime.toUTCString();
  }
  res.setHeader("Last-Modified", szL);
  // Alt-Svc: h3=":443"; ma=86400
  // Content-Encoding: br
  // Date: Mon, 31 Jul 2023 03:53:21 GMT
  // Last-Modified: Wed, 15 Feb 2023 01:31:46 GMT
}


module.exports = {
  setNoCache:setNoCache,
  setLongTermCache,setLongTermCache,
  etag: true,
  lastModified: true,
  setHeaders: function (res, path, stat) {
    res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains; preload");
    var isSw = !!path.match(/sw\.js$/);
    if(!isSw && (path.match(/\/(js|css)\//) || path.match(/model|(socket\.io\.js)/))) {
      setLongTermCache(res,stat)
    }else{
      setNoCache(res)
    }
    res.set('x-timestamp', Date.now())
  }
}
