/* Viewport helper: keeps --app-vh in sync with the visual viewport so the
   composer stays visible when the on-screen keyboard opens (iOS/Android). */
(function () {
	"use strict";
	var doc = document, vv = window.visualViewport, rafId = 0, nLast = 0;
	function applyHeight() {
		var h = (vv && vv.height) || window.innerHeight;
		if (h === nLast) return;
		nLast = h;
		doc.documentElement.style.setProperty("--app-vh", h + "px");
		try {
			window.dispatchEvent(new CustomEvent("screenfit", { detail: { height: h, width: (vv && vv.width) || window.innerWidth } }));
		} catch (e) {}
	}
	function schedule() {
		if (rafId) return;
		rafId = requestAnimationFrame(function () { rafId = 0; applyHeight(); });
	}
	window.setMF = function () { applyHeight(); };
	window.addEventListener("resize", schedule, { passive: true });
	window.addEventListener("orientationchange", function () { setTimeout(schedule, 200); });
	if (vv) {
		vv.addEventListener("resize", schedule, { passive: true });
		vv.addEventListener("scroll", schedule, { passive: true });
	}
	if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", schedule, { once: true });
	else schedule();
})();
