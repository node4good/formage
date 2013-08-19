


function formageDialog(type,params,options,callback){
	if(typeof(options) == 'function'){
		callback = options;
		options = null;
	}
	if(typeof(params) == 'function'){
		callback = params;
		params = options = null;
	}
	function serialize(params){
		return $.map(params,function (v, k) {
			return k + '=' + v;
		}).join(',');
	}
	var qry = serialize(params || {});
	var optionsStr = serialize($.extend({
		width:$(window).width() - 100,
		height:$(window).height() - 100,
		top:50,
		left:50,
		scrollbars:1
	},options || {}));
	var win = window.open(root + '/dialog/' + type + '?' + qry, 'formage dialog', optionsStr);
	var onDialogMessage = function(event){
		if(event.source != win)
			return;
		win = null;
		window.removeEventListener('message',onDialogMessage);
		var rsp = event.data;
		// on delete
		callback(rsp);
	}
	window.addEventListener('message',onDialogMessage,false);
}