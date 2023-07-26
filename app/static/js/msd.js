(function(){
    function fnCkPromise(promise){
        var bR = true;
        if (promise !== undefined) {
            promise.catch(error => {
                // Auto-play was prevented
                log(error);
                bR = false;
            }).then(() => {
                bR = true;
                // Auto-play started
            });
        }
        return bR;
    }
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    if(AudioContext){
        var audioContext = new AudioContext();
        window.playSound = function (sound) {
            log("playSound()")
            var source = audioContext.createBufferSource()
            if (source) {
                source.buffer = sound
                if (!source.start)
                    source.start = source.noteOn
    
                if (source.start) {
                    var gain = audioContext.createGain()
                    source.connect(gain)
                    gain.connect(audioContext.destination)
                    source.start()
                }
                return true;
            }
            return false;
        }
    
        window.loadSound = function (url, callback) {
            log("start loading sound " + url)
            var ajax = new XMLHttpRequest()
            ajax.open("GET", url, true)
            ajax.responseType = "arraybuffer"
            ajax.onload = function () {
                audioContext.decodeAudioData(
                    ajax.response,
                    function (buffer) {
                        log("loaded sound " + url)
                        log(buffer)
                        callback(buffer)
                    },
                    function (error) {
                        log(error)
                    }
                )
    
            }
            ajax.send();
        }
        // loadSound(url, function (r) { myAudio = r; startInterval() })
        // loadSound(url2, function (r) { myAudio2 = r })
    }else{
        window.playSound = function (sound) {
            log("playSound() readyState=" + sound.readyState)
            log("gold readyState=" + myAudio2.readyState)
            var p = sound.play();
            return fnCkPromise(p);
        };
    
        window.loadSound = function (url, callback) {
            var audio = new Audio(url)
            audio.addEventListener('canplaythrough', function () {
                log('canplaythrough');
                if (callback)callback()
            }, false)
    
            audio.load()
            if (audio.readyState > 3) {
                log('audio.readyState > 3');
                if (callback)callback()
            }
            return audio
        };
        // var myAudio = loadSound(url, startInterval)
        // var myAudio2 = loadSound(url2)
    }
})();

var myAudio={},bpIn = false,oNTm1 = {};
function startInterval (s) {
    log("startInterval()");
    setTimeout(function () {
        playSound(myAudio[s]);
        bpIn = false;
    },2000);
}

function playSd(n) {
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
    if(bpIn)return;
    var n1 = 1000,n2 = new Date().getTime();
    if(!oNTm1[s])oNTm1[s] = n2;
    else{
        if(s == "wh01")n1 = 25000;
        if(n2 - oNTm1[s] < n1)return;
        oNTm1[s] = n2;
    }
    bpIn = true;
    loadSound(`/${s}.mp3`, function (r) { myAudio[s] = r; startInterval(s) })
}