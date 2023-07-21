
function setNoCache(res) {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  res.setHeader("Expires", date.toUTCString());
  res.setHeader("Pragma", "no-cache");
  res.setHeader("maxAge", "0");
  res.setHeader("Cache-Control", "public, no-cache");
}

function setLongTermCache(res) {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  res.setHeader("Expires", date.toUTCString());
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
}


module.exports = {
  etag: true,
  lastModified: true,
  setHeaders: function (res, path, stat) {
    var isSw = !!path.match(/sw\.js$/);
    if(!isSw && (path.match(/\/(js|css)\//) || path.match(/model|(socket\.io\.js)/))) {
      setLongTermCache(res)
    }else{
      setNoCache(res)
    }
    res.set('x-timestamp', Date.now())
  }
}
