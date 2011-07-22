/**
 * you can't use here the background page
 */

// In a content script
var port = undefined;
// chrome.extension.connect({
// name : 'chrome-google-plus-helper'
// });

getPort().postMessage({
	message : "registerPort"
});

var STATUS_LOADING = 1;
var STATUS_READY = 2;

var status = STATUS_READY;

var container = undefined;

var actions = new Actions();
var uiExtender = new UIExtender();

var gplushelper = new GPlusHelper();
gplushelper.init();

var lastPostId = undefined;

function getPort() {

	if (!port) {

		console.log('create port');

		port = chrome.extension.connect({
			name : 'chrome-google-plus-helper'
		});
	}
	return port;
}

function GPlusHelper() {

	this.init = function() {

		/*
		 * this.addNotifier();
		 * 
		 * this.extendUI();
		 */

		var url = this.getFullUrlByLocation(window.location);

		var result = url.search(/plus.google.com/);
		if (result == -1) {
			return;
		}

		/*
		 * check if user post
		 */
		data = this.analyzePage(url);

		getPort().postMessage({
			message : "onActivatePageAction"
		});

		this.initHomePageToolbar();
		this.initHomePage(data.notificationOn);

	};

	this.analyzePage = function(url) {
		console.log('analyzePage...');

		// https://plus.google.com/
		// https://plus.google.com/104512463398531242371/posts
		// https://plus.google.com/104512463398531242371/posts/jdw7brnkX9H

		var pageInfo = {
			url : url,
			type : undefined,
			notificationOn : false
		};

		var qRe = new RegExp(
				"^https://plus.google.com/([0-9]+)/posts/([a-zA-Z0-9]+)$");
		var test = qRe.exec(url);

		/*
		 * check if user page
		 */
		qRe = new RegExp("^https://plus.google.com/([0-9]+)/posts/$");
		test = qRe.exec(url);

		/*
		 * check home
		 */
		qRe = new RegExp("^https://plus.google.com/u/0/$");
		test = qRe.exec(url);
		pageInfo.notificationOn = (test || pageInfo.notificationOn) ? true
				: false;

		// https://plus.google.com/u/0/104512463398531242371/posts

		/*
		 * check home
		 */
		qRe = new RegExp("^https://plus.google.com/$");
		test = qRe.exec(url);
		pageInfo.notificationOn = (test || pageInfo.notificationOn) ? true
				: false;

		return pageInfo;

	};

	this.initHomePage = function(bNotificationOn) {
		console.log('initHomePage...');

		var container = document.querySelector("div.a-b-f-i-oa");
		if (container == undefined) {
			return;
		}

		if (!container.addEventListener) {
			return;
		}

		(function(component) {
			container.addEventListener('DOMNodeInserted', function(e) {

				// console.log('DOMNodeInserted', e.target.id, e.target);

				// a-b-f-i-p-R

				var idBegin = e.target.id ? e.target.id.substring(0, 7)
						: undefined;

				if (idBegin == 'update-') {
					lastPostId = e.target.id;
					console.log('onBeforePostAdded', lastPostId);
					return;
				}

				var classAttribute = undefined;

				try {
					classAttribute = e.target.getAttribute('class');
				} catch (e) {
					// TODO: handle exception
				}

				if (classAttribute == 'a-Ja-h a-b-h-Jb a-f-i-Ad') {
					console.log('onPostAdded', lastPostId, e.target
							.getAttribute('href'));

					/*
					 * check notifications settings
					 */
					chrome.extension.sendRequest({
						action : "checkNotificationON",
						lastPostId : lastPostId
					}, function(response) {
						console.log('response.notificationOn',
								response.notificationOn);

						if (!response.notificationOn) {
							console.log('...no notification');
							return;
						}
						var postObj = document.querySelector('#'
								+ response.lastPostId);

						if (!postObj) {
							console.log('failed to get html by ' + '#'
									+ response.lastPostId);
							return;
						}

						/*
						 * send notification
						 */
						getPort().postMessage(
								{
									message : "onNewPost",
									id : postObj.id,
									url : 'https://plus.google.com/'
											+ e.target.getAttribute('href'),
									html : postObj.innerHTML
								});

					});

					lastPostId = undefined;
					fetchTabInfo("fetchOnUpdate");

				}

			}, false);

		})(this);

	};

	this.initHomePageToolbar = function(settings) {
		console.log('initHomePageToolbar...');
		var miniToolbarObj = document.querySelector("div.oLO5kc");

		if (!miniToolbarObj) {
			return;
		}

		chrome.extension
				.sendRequest(
						{
							action : "getSettings"
						},
						function(response) {
							console.log('response.getSettings', response);

							var settings = response.settings;

							if (settings.addChromeBookmarks == 'true'
									&& settings.addChromeBookmarksToolbar == 'true') {

								var buttonObj = document.createElement("a");

								buttonObj.href = '#';

								var attrClass = document
										.createAttribute("class");
								attrClass.nodeValue = 'd-h a-b-h-Jb rKsb7e d-s-r jw8A1e';

								(function(chromeBookmarsFolderId) {
									buttonObj.onclick = function(e) {
										e.stopPropagation();
										chrome.extension
												.sendRequest(
														{
															action : "doOpenLink",
															values : {
																url : 'chrome://bookmarks/?#'
																		+ chromeBookmarsFolderId
															}
														}, function() {
														});

										return false;
									};
								})(response.chromeBookmarsFolderId);

								buttonObj.setAttributeNode(attrClass);
								buttonObj.innerHTML = '<span class="mZxz3d VAbDid mk-toolbar-bookmark" data-tooltip="Bookmarks"></span>';
								miniToolbarObj.appendChild(buttonObj);

							}

						});

	};

	this.addHashTagsUrls = function(element, callback) {

		
		var replaceWith = '$1<a href="http://www.google.com/search?sourceid=chrome&ie=UTF-8&q=%23$2+site%3Aplus.google.com" target="_blank">#$2</a>';
		var hashtagged = element.innerText.replace(/(| |,)#([A-Za-z0-9_-]+)/g,
				replaceWith);

		if (element.innerHTML != hashtagged) {
			
			var hashtagged = element.innerHTML.replace(/(| |,)#([A-Za-z0-9_-]+)/g,
					replaceWith);
			
			callback(hashtagged);
			
		}
		
		callback(undefined);

	};

	this.getFullUrlByLocation = function(location) {

		var url = location.href;

		return url;

	};
}

/*
 * container.addEventListener('DOMNodeInserted', function(e){
 * 
 * console.log('DOMNodeInserted', e.target.id);
 * 
 * var idBegin = e.target.id.substring(0, 7); if (idBegin == 'update-') {
 * console.log(e.target.innerHTML); return; } }, false);
 * 
 * 
 * function DOMNodeInserted(e) { console.log('DOMNodeInserted', e); }
 */

getPort().onMessage.addListener(function(msg) {
	console.log("The extension said: " + msg.message + " with values: "
			+ msg.values, msg);

	console.log('onMessage', msg);

	switch (msg.message) {
	case 'update':
		fetchTabInfo('update');
		break;
	case 'checkForUpdate':
		/*
		 * fetchTabInfo('checkForUpdate');
		 * 
		 * if (status == STATUS_LOADING) { fetchTabInfo('checkForUpdate2');
		 * 
		 * return; } fetchTabInfo('checkForUpdate3');
		 * 
		 * checkForUpdate();
		 */
	case 'updateTabInfo':
		fetchTabInfo('updateTabInfo');
		break;
	default:
		// fetchTabInfo('...nothing to do');
		console.log('unknow messade:', msg);
		break;
	}

});

/*
 * chrome.extension.sendRequest({ 'action' : 'fetchTabInfo' }, fetchTabInfo);
 * 
 * chrome.extension.onRequest.addListener(function(request, sender,
 * sendResponse) { console.log('extension.onRequest');
 * 
 * if (request.action == 'updateTabInfo') { fetchTabInfo('updateTabInfo'); }
 * 
 * });
 */

/*
 * 
 * function checkForUpdate() { console.log('checkForUpdate...');
 * 
 * status = STATUS_LOADING; xmlhttpPost('GET',
 * 'https://plus.google.com/u/0/_/n/guc?_reqid=680986&rt=j'); }
 * 
 * function xmlhttpPost(type, strURL) { console.log('xmlhttpPost', type,
 * strURL);
 * 
 * var xmlHttpReq = false; // Mozilla/Safari xmlHttpReq = new XMLHttpRequest();
 * 
 * xmlHttpReq.open(type, strURL, true);
 * xmlHttpReq.setRequestHeader('Content-Type',
 * 'application/x-www-form-urlencoded'); xmlHttpReq.onreadystatechange =
 * function() { if (xmlHttpReq.readyState == 4) { status = STATUS_READY;
 * updatepage(xmlHttpReq.responseText); } };
 * 
 * xmlHttpReq.send(strURL); }
 * 
 * 
 * function updatepage(response) { console.log('updatepage', response); }
 */

function fetchTabInfo(selectedPacketName) {
	console.log('content_scripts.fetchTabInfo:' + selectedPacketName);
	var attrClass = undefined;
	var postObj = undefined;

	/*
	 * get home stream
	 */
	var streamObj = document.querySelector("div.a-b-f-i-oa");

	/*
	 * get post stream
	 */
	if (!streamObj) {
		streamObj = document.querySelector("div.a-Wf-i-M");
	}

	if (!streamObj) {
		console.log('failed to get stram for extension');
		return;
	}

	chrome.extension.sendRequest({
		action : "getSettings"
	}, function(response) {
		console.log('response.getSettings', response);

		var settings = response.settings;

		for ( var i = 0; i < streamObj.childElementCount; i++) {
			console.log('found post element...');

			postObj = streamObj.childNodes[i];

			if (postObj) {

				if (!postObj.getAttributeNode('mk-extended')) {
					attrClass = document.createAttribute('mk-extended');
					attrClass.nodeValue = 'true';
					postObj.setAttributeNode(attrClass);
					extendPostArea(postObj, settings);
				}
				;
			}
			;
		}
		;

	});

};

function extendPostArea(o, settings) {
	console.log('extendPostArea...');

	if (settings.addHashtags == 'true') {
		uiExtender.addHashtags(o);
	}
	;

	
//	if (settings.addHashtagsComments == 'true') {
//		var commentsObj = o.querySelectorAll("span.a-f-i-W-p");
//
//	}
	
	var placeholderObj = o.querySelector("div.a-f-i-bg");

	if (!placeholderObj) {
		console.log('error: failed to get the placeholder for actions');
		return;
	}

	

	
	if (settings.addTwitter == 'true') {
		extentPostWithAction(placeholderObj, 'Tweet', function() {
			actions.doTweet(parsePostData(this));
		}, 'Click to tweet this post');
	}

	if (settings.addTranslate == 'true') {
		extentPostWithAction(placeholderObj, 'Translate', function() {
			actions.doTranslate(parsePostData(this));
		}, 'Click to translate this post');
	}

	if (settings.addBookmarks == 'true') {

		extentPostWithAction(placeholderObj, 'Bookmark', function() {
			actions.doBookmark(parsePostData(this));
		}, 'Click to bookmark this post');

	}

	if (settings.addDelicious == 'true') {

		extentPostWithAction(placeholderObj, 'Delicious', function() {
			actions.doDelicious(parsePostData(this));
		}, 'Click to bookmark this post on Delicious');

	}

	var placeholderIconsObj = o.querySelector("span.a-f-i-yj");

	if (!placeholderIconsObj) {
		console.log('error: failed to get the placeholder for incons');
		return;
	}

	if (settings.addChromeBookmarks == 'true') {

		var postData = parsePostData(placeholderObj);
		chrome.extension.sendRequest({
			action : "checkChromeBookmarked",
			values : {
				url : postData.url
			}
		}, function(bookmarked) {

			if (bookmarked) {

				extentPostWithIconAction(placeholderIconsObj, 'mk-bookmarked',
						function(element) {
							actions.doChromeBookmark(element.target,
									parsePostData(this));
						}, 'Click to remove bookmark this post');

			} else {

				extentPostWithIconAction(placeholderIconsObj, 'mk-bookmark',
						function(element) {
							actions.doChromeBookmark(element.target,
									parsePostData(this));
						}, 'Click to bookmark this post');

			}
			;

		});

	}
	;

	// http://www.google.com/webhp?hl=en#sclient=psy&hl=en&site=webhp&source=hp&q=%22test%22+site:plus.google.com&pbx=1&oq=%22test%22+site:plus.google.com&aq=f&aqi=&aql=f&gs_sm=e&gs_upl=968l968l0l1l1l0l0l0l0l157l157l0.1l1&bav=on.2,or.r_gc.r_pw.&fp=ad93d5a0dc8b6623&biw=1280&bih=685

}

/**
 * create element
 * 
 * @param placeholderObj
 */
function extentPostWithAction(placeholderObj, caption, callback, title) {
	if (!placeholderObj) {
		return;
	}
	var txt = document.createElement("txt");
	txt.innerHTML = "&nbsp;&nbsp;-&nbsp;&nbsp;";

	// <span role="button" class="d-h a-b-f-i-Zd-h">Twitt</span>
	var span = document.createElement("span");
	span.innerText = caption;

	var attrClass = document.createAttribute("class");
	attrClass.nodeValue = 'd-h';
	span.setAttributeNode(attrClass);

	var attrAlt = document.createAttribute("title");
	attrAlt.nodeValue = title;
	span.setAttributeNode(attrAlt);

	span.onclick = callback;

	placeholderObj.appendChild(txt);
	placeholderObj.appendChild(span);
}

function extentPostWithIconAction(placeholderObj, htmlClass, callback, title) {
	if (!placeholderObj) {
		return;
	}
	// d-h a-f-i-Ia-D-h a-b-f-i-Ia-D-h
	// a-f-i-yj
	// var txt = document.createElement("txt");
	// txt.innerHTML = "&nbsp;&nbsp;-&nbsp;&nbsp;";

	// <button id="star" class="wpb" style="margin-left: 0"></button>

	var span = document.createElement("button");
	// span.innerText = caption;

	var attrClass = document.createAttribute("class");
	attrClass.nodeValue = htmlClass;
	;
	span.setAttributeNode(attrClass);

	var attrAlt = document.createAttribute("title");
	attrAlt.nodeValue = title;
	span.setAttributeNode(attrAlt);

	span.onclick = callback;

	// placeholderObj.appendChild(txt);
	placeholderObj.appendChild(span);
}

function parsePostData(o) {
	console.log('parsePostData', o);

	var updateDiv = undefined;
	var currentElement = o;

	while (currentElement.parentElement) {
		currentElement = currentElement.parentElement;

		if (currentElement.getAttribute('id')) {
			var idBegin = currentElement.getAttribute('id').substring(0, 7);
			if (idBegin == 'update-') {
				updateDiv = currentElement;
				break;
			}
			;

		}
		;

	}

	if (updateDiv) {
		// console.log(updateDiv);
		var postUrlObj = currentElement.querySelector("a.a-Ja-h");
		// console.log(postUrlObj);
		/*
		 * try to get comment
		 */
		var postTextObj = null;

		postTextObj = currentElement.querySelector("div.a-b-f-i-u-ki");

		if (postTextObj && postTextObj.innerText == '') {
			postTextObj = currentElement.querySelector("div.a-b-f-i-p-R");
		}

		if (!postTextObj) {
			postTextObj = currentElement.querySelector("div.a-b-f-i-p-R");
		}
		// a-f-i-u-ki
		/*
		 * get author
		 */
		// cs2K7c a-f-i-Zb a-f-i-Zb-U
		var autorObj = currentElement.querySelector("a.cs2K7c");
		var author = autorObj != undefined ? autorObj.innerHTML : '';
		var authorUrl = autorObj != undefined ? autorObj.getAttribute('href')
				: '';

		var data = {
			text : postTextObj.innerText,
			url : 'https://plus.google.com/' + postUrlObj.getAttribute('href'),
			author : author,
			authorUrl : authorUrl

		};
		console.log('data', data);

		return data;

	}
	;
}

function UIExtender() {
	
	this.addHashtags = function(postObj) {
		var postBodyObj = postObj.querySelector("div.a-b-f-i-u-ki");

		if (!postBodyObj) {
			postBodyObj = postObj.querySelector("div.a-b-f-i-p-R");
		}

		if (postBodyObj) {

			gplushelper.addHashTagsUrls(postBodyObj, function(html) {

				if (html) {
					postBodyObj.innerHTML = html;
				}

			});

		}

	};
	
}

function Actions() {

	this.doTweet = function(data) {
		try {
			getPort().postMessage({
				message : "doTweet",
				values : []
			});
			window.open('https://twitter.com/intent/tweet?text='
					+ encodeURIComponent(data.text + ' #googleplus') + '&url='
					+ encodeURIComponent(data.url));
		} catch (e) {
			alert('failed open window');
		}
		;
	};

	this.doTranslate = function(data) {
		try {

			chrome.extension.sendRequest({
				action : "getSettings"
			}, function(response) {
				console.log('response.getSettings', response);

				var settings = response.settings;

				getPort().postMessage({
					message : "doTranslate",
					language : settings.addTranslateTo
				});

				window.open('http://translate.google.com/#auto|'
						+ settings.addTranslateTo + '|'
						+ encodeURIComponent(data.text + ' #googleplus '));

			});

		} catch (e) {
			alert('failed open window');
		}
		;
	};

	this.doBookmark = function(data) {
		try {
			getPort().postMessage({
				message : "doBookmark",
				values : []
			});

			window
					.open('https://www.google.com/bookmarks/api/bookmarklet?output=popup'
							+ '&srcUrl='
							+ encodeURIComponent(data.url)
							+ '&snippet='
							+ encodeURIComponent(data.text)
							+ '&title='
							+ encodeURIComponent('Google+ Bookmark'));

		} catch (e) {
			alert('failed open window');
		}
		;
	};

	this.doDelicious = function(data) {
		try {
			getPort().postMessage({
				message : "doDelicious",
				values : []
			});

			window
					.open(
							'http://www.delicious.com/save?'
									+ '&url='
									+ encodeURIComponent(data.url)
									+ '&notes='
									+ encodeURIComponent(data.author + ': '
											+ data.text)
									+ '&title='
									+ encodeURIComponent(data.author
											+ ' on Google+')
									+ '&v=6&noui=1&jump=doclose',
							"doDelicious",
							'location=yes,links=no,scrollbars=no,toolbar=no,width=550,height=550');

		} catch (e) {
			alert('failed open window');
		}
		;
	};

	this.doChromeBookmark = function(element, data) {
		if (element.getAttribute('class') == 'mk-bookmark') {
			this.addChromeBookmark(element, data);
		} else {
			this.removeChromeBookmark(element, data);
		}
	};

	this.addChromeBookmark = function(element, data) {
		console.log('doChromeBookmark', element, data);
		chrome.extension.sendRequest({
			action : "doChromeBookmark",
			values : {
				url : data.url,
				text : data.author + ': ' + data.text
			}
		}, function(bookmarked) {
			element.setAttribute('title',
					'Click to remove bookmark for this post');
			element.setAttribute('class', 'mk-bookmarked');
		});

	};

	this.removeChromeBookmark = function(element, data) {
		console.log('removeChromeBookmark', element, data);
		chrome.extension.sendRequest({
			action : "removeChromeBookmark",
			values : {
				url : data.url
			}
		}, function(bookmarked) {
			element.setAttribute('title', 'Click to bookmark this post');
			element.setAttribute('class', 'mk-bookmark');
		});

	};
}
