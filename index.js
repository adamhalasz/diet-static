// Dependencies
var url  = require('url');
var path = require('path');
var send = require('send');
var mime = require('mime');

module.exports.global = function($, options){
	var root = '/static' || options.root;
	var mimeType = mime.lookup($.url.pathname);
	
	// if no route was specified and mimeType exists
	if($.noRoute && mimeType){
		// set header
		$.header('content-type', mimeType);
		
		// send static file
		send($.request, $.url.pathname, { root: $.domain.path+root })
		  .on('error', function(err) {
		  	$.response.statusCode = err.status || 500;
		  	$.response.end($.response.statusCode+ ' File not found.');
		  }).pipe($.response); 
	} else {
		$.return();
	}
}