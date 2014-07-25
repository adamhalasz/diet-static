// Dependencies
var send 	= require('send');
var url 	= require('url');
var path 	= require('path');

module.exports.global = function($, options){
	var root = '/static' || options.root;

	if(path.extname($.url.href)){
		// your custom error-handling logic:
		function error(err) {
			$.response.statusCode = err.status || 500;
			$.response.end(err.message);
		}
		
		send($.request, $.url.pathname, { root: $.domain.path+root})
		  .on('error', error)
		  .pipe($.response);
	} else {
		$.return();
	}
}