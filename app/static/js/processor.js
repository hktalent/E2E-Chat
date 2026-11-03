let processor = {
    timerCallback: function() {
        if (this.video.paused || this.video.ended) {
          return;
        }
        this.computeFrame();
        let self = this;
        setTimeout(function () {
            self.timerCallback();
          }, 0);
    },
  
    doLoad: function() {
      this.video = document.getElementById("myVideo");
      this.c1 = document.getElementById("c1");
      this.ctx1 = this.c1.getContext("2d");
      this.c2 = document.getElementById("c2");
      this.ctx2 = this.c2.getContext("2d");
      let self = this;
      this.video.addEventListener("play", function() {
          self.width = self.video.videoWidth / 2;
          self.height = self.video.videoHeight / 2;
          self.timerCallback();
        }, false);
    },
  
    computeFrame: function(){
      this.ctx1.drawImage(this.video, 0, 0, this.width, this.height);// 实现缩放，减少内存开销，提高运算效率
      let frame = this.ctx1.getImageData(0, 0, this.width, this.height);
      let l = frame.data.length / 4;
  
      for (let i = 0; i < l; i++) {// 红色（R）、绿色（G）和蓝色（B） https://www.rapidtables.org/zh-CN/web/color/html-color-codes.html
        let r = frame.data[i * 4 + 0];
        let g = frame.data[i * 4 + 1];
        let b = frame.data[i * 4 + 2];
        if (g > 100 && r > 100 && b < 43)// 绿色值大于 100、红色值大于 100，且蓝色值小于 43，则将该像素的透明度（A）设置为 0
          frame.data[i * 4 + 3] = 0;
      }
      this.ctx2.putImageData(frame, 0, 0);
      return;
    }
  };

document.addEventListener("DOMContentLoaded", function() {
  processor.doLoad();
});