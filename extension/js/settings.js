var show_options_page = true;
var maxProbesLimit = 7;
var alreadyAlerted = false;

var settings = {

	get addTwitter() {
        if(localStorage['addTwitter'] == 'NaN') return true;
		return localStorage['addTwitter'] || true;
	}, 
	set addTwitter(val) {
		localStorage['addTwitter'] = val;
	},	
	
	get addTranslate() {
        if(localStorage['addTranslate'] == 'NaN') return true;
		return localStorage['addTranslate'] || true;
	},
	set addTranslate(val) {
		localStorage['addTranslate'] = val;
	},
	
	get addHashtags() {
        if(localStorage['addHashtags'] == 'NaN') return true;
		return localStorage['addHashtags'] || true;
	},
	set addHashtags(val) {
		localStorage['addHashtags'] = val;
	},
	
	
	 
	get addBookmarks() {
        if(localStorage['addBookmarks'] == 'NaN') return false;
		return localStorage['addBookmarks'] || false;
	}, 
	set addBookmarks(val) {
		localStorage['addBookmarks'] = val;
	},	

	get addTranslateTo() {
        if(localStorage['addTranslateTo'] == 'NaN') return 'en';
		return localStorage['addTranslateTo'] || 'en';
	}, 
	set addTranslateTo(val) {
		localStorage['addTranslateTo'] = val;
	},
	
	get notificationOn() {
        if(localStorage['notificationOn'] == 'NaN' || localStorage['notificationOn'] == undefined) return false;
		return localStorage['notificationOn'] == 'true' ? true : false;
	},
	set notificationOn(val) {
		localStorage['notificationOn'] = val;
	},
	
	get notificationSound() {
        if(localStorage['notificationSound'] == 'NaN') return 'sound/01.mp3';
		return localStorage['notificationSound'] || 'sound/01.mp3';
	}, 
	set notificationSound(val) {
		localStorage['notificationSound'] = val;
	},	

	get notificationTime() {
        if(localStorage['notificationTime'] == 'NaN') return 5000;
		return localStorage['notificationTime'] || 5000;
	}, 
	set notificationTime(val) {
		localStorage['notificationTime'] = val;
	},	
	
	get isFirstRun(){
		if(localStorage["version"] == null){
			return true;
		}
		return false;
	}
	
};