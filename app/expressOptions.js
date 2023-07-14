
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
    isSw = !!path.match(/sw\.js$/)
    if(!isSw && (path.match(/\.(js|css|png|jpg|jpeg|gif|ico|json|ttf|woff|woff2|eot|html|json|svg)$/) || path.match(/group[0-9]{1,}-shard[0-9]{1,}of[0-9]{1,}$/))) {
      setLongTermCache(res)
    }else{
      setNoCache(res)
    }
    res.set('x-timestamp', Date.now())
  }
}
