function playSoundOnce(audioBuffer) {
    if (!bpIn) {
    bpIn = true;
    var source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    source.onended = function () {
      bpIn = false;
    };
    source.start();
  }
}

function loadSound(url) {
  return new Promise((resolve, reject) => {
    var ajax = new XMLHttpRequest();
    ajax.open("GET", url, true);
    ajax.responseType = "arraybuffer";
    ajax.crossorigin = "anonymous";// anonymous：允许跨域请求，但不允许发送任何自定义头部 use-credentials：允许跨域请求，并允许发送任何自定义头部。
    ajax.onload = function () {
      audioCtx.decodeAudioData(
        ajax.response,
        function (buffer) {
          resolve(buffer);
        },
        function (error) {
          reject(error);
        }
      );
    };
    ajax.onerror = function (error) {
      reject(error);
    };
    ajax.send();
  });
}
// function loadSound(url) {// 经过测试，这种方法加载的音频无法播放
//   return fetch(url).then(buffer => audioCtx.decodeAudioData(buffer));
// }

async function playSd(n) {
  let s = "";
  switch (n) {
    case 1:
      s = "online";
      break;
    case 2:
      s = "msg";
      break;
    case 3:
      s = "wh01";
      break;
  }

  if (bpIn) return;

  var n1 = 1000, n2 = new Date().getTime();
  if (!oNTm1[s]) oNTm1[s] = n2;
  else {
    if (s == "wh01") n1 = 25000;
    if (n2 - oNTm1[s] < n1) return;
    oNTm1[s] = n2;
  }

  try {
    if (!myAudio[s]) {
      myAudio[s] = await loadSound(window.appURL()+"/"+s+".mp3");
    }

    playSoundOnce(myAudio[s]);
  } catch (error) {
    console.error(error);
  }
}

window.playSd = playSd;
window.onload = function () {
  var audioContext = window.webkitAudioContext||window.AudioContext;
  if (audioContext) {
    var audioCtx = new audioContext();
    var myAudio = {}; // 存储加载过的音频资源
    var bpIn = false; // 标记是否正在播放音频
    var oNTm1 = {}; // 存储上次播放音频的时间戳
  } else console.error("AudioContext not supported!");
}
