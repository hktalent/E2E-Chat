!function() {
    "use strict";
    var e = self,
        t = e.CustomEvent,
        i = e.addEventListener,
        n = e.dispatchEvent,
        d = e.document,
        h = e.scrollTo,
        o = e.setTimeout,
        r = e.visualViewport,
        s = /Windows Phone/.test(navigator.userAgent),
        a = r || {
            addEventListener: i.bind(self),
            get width() {
                return self.innerWidth
            },
            get height() {
                return self.innerHeight
            }
        },
        l = function() {
            d.body.style.height = a.height + "px",
            h(0, 0),
            s && o(h, 300, 0, 0),
            n(new t("screenfit", {
                detail: a
            }))
        };
    d.head.appendChild(d.createElement("style")).textContent = "html,body{padding:0;margin:0;overflow:hidden;box-sizing:border-box;height:100%;height:100vh;height:-moz-available;height:-webkit-fill-available}",
    d.addEventListener("DOMContentLoaded", l, {
        once: !0
    }),
    a.addEventListener("resize", l)
}();

addEventListener('screenfit', function (event) {
    let vh = event.detail.height * 0.01;
	document.documentElement.style.setProperty('--vh', `${vh}px`);
    var h1 = 0;
    $("body,html").height(event.detail.height);
    $("main").height(h1 = event.detail.height - $("footer").height() - 20);
    $("#msgList").height(h1 - $("#qmI").height() - $("main div.row1").height())
});

