(function () {
    var audioContext = window.AudioContext || window.webkitAudioContext;
    if (audioContext) {
      var audioCtx = new audioContext();
      var myAudio = {}; // 存储加载过的音频资源
      var bpIn = false; // 标记是否正在播放音频
      var oNTm1 = {}; // 存储上次播放音频的时间戳
  
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
  
      async function playSd(n) {
        var s = "";
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
  
        var n1 = 1000;
        var n2 = new Date().getTime();
        if (!oNTm1[s]) oNTm1[s] = n2;
        else {
          if (s == "wh01") n1 = 25000;
          if (n2 - oNTm1[s] < n1) return;
          oNTm1[s] = n2;
        }
  
        try {
          if (!myAudio[s]) {
            myAudio[s] = await loadSound("https://unpkg.com/web-ai-51pwn@latest/dist/"+s+".mp3");
          }
  
          playSoundOnce(myAudio[s]);
        } catch (error) {
          console.error(error);
        }
      }
  
      window.playSd = playSd;
    } else {
      console.error("AudioContext not supported!");
    }
  })();
  