var t = 0;
var timerOnMouseOver = 0;

var CONF_TIMEOUT = 5000;
var CONF_TIMEOUT_AFTER_MOUSEOUT = 5000;

var bMouseOver = false;
var bMouseOverTimerOff = true;

function Notify() {

	this.data = undefined;

	this.init = function() {

		this.bindWindowEvents();
		this.bindEvents();
		this.startTimer();

	};

	this.startTimer = function() {
		t = setTimeout("notify.beforeClose()", CONF_TIMEOUT);
	};

	this.startTimerAfterMouseOut = function() {
		bMouseOverTimerOff = false;
		t = setTimeout("notify.afterMouseOut()", CONF_TIMEOUT_AFTER_MOUSEOUT);
	};

	this.afterMouseOut = function() {

		if (!bMouseOver) {
			bMouseOverTimerOff = true;
		}
	};

	this.beforeClose = function() {
		if (!bMouseOver && bMouseOverTimerOff) {
			window.close();
		} else {
			t = setTimeout("notify.beforeClose()", CONF_TIMEOUT_AFTER_MOUSEOUT);
		}
	};

	this.bindWindowEvents = function() {

		var bodyObj = document.querySelector("body");

		if (bodyObj.addEventListener) {
			bodyObj.addEventListener('mouseover', function(e) {
				bMouseOver = true;
				bodyObj.setAttribute('class', 'selected');

				console.log('mouseover', bMouseOver);
			}, false);

			bodyObj.addEventListener('mouseout', function(e) {
				bMouseOver = false;
				bodyObj.setAttribute('class', '');
				console.log('mouseout', bMouseOver);
				this.startTimerAfterMouseOut();

			}, false);

			bodyObj.addEventListener('click', function(e) {
				bMouseOver = true;
				bodyObj.setAttribute('class', 'clicked');
				console.log('click', bMouseOver);

				chrome.extension.getBackgroundPage().doOpenLink({
					url : this.data.url
				});

				window.close();

			}, false);

		}
	};

	this.bindEvents = function() {
		var query = {};
		var search = window.location.search;

		search = search.substring(1, search.length);
		search = search.split('&');

		for (part in search) {
			part = search[part].split('=');
			query[part[0]] = decodeURIComponent(part[1]);
		}

		this.data = query;

		console.log(this.data);

		var container = document.querySelector(".a-b-f-i-oa");

		container.innerHTML = this.data.html;

		var containers = document.querySelectorAll("a");

		for (i in containers) {

			if (containers[i].addEventListener) {
				containers[i].addEventListener('click', function(e) {

					console.log(e);
					chrome.extension.getBackgroundPage().doOpenLink({
						url : this.href
					});
					return;

				}, false);
			}

		}
	};
}

var notify = new Notify();
