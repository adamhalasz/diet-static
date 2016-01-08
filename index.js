// Dependencies
var url  = require('url');
var path = require('path');
var mime = require('mime');
var fs = require('fs');
var zlib = require('zlib');
var cache = {}
module.exports = function(options){
	return function($){
		/**
		 * Define default options
		 * however, the path must be set because there is no way that $ could get the root path of the application
		 *
		 * @path            String   The path where the static files are
		 * @index           Boolean  Set if must search for index file if this is not specified in url
		 * @showScriptName  Boolean  Set if extensions must be writen in url, if not then @defaultScript is concatenated
		 * @defaultScript   String   The extension to be concatenated if @showScriptName is false
		 */
		var opt = {
			path: '',
			index: true,
			showScriptName: true,
			defaultScript: 'html',
			cache: 'public'
		};

		setOptions(options, opt);

		var pathname = parseUrl($.url.pathname, opt);
		var mimeType = mime.lookup(pathname);
		var extension = path.extname(pathname);

		// if no route was specified there is an extension and mimeType is not binary
		if(extension){
			// set header
			$.header('Content-Type', mimeType);
			$.status(200);
			var source = opt.path + pathname;
			fs.stat(source, function (error, stats) {
				if(!error){
					$.header('Last-Modified', stats.mtime)
					$.header('Expires', new Date(new Date().getTime() + 604800000).toUTCString())
					$.header('Cache-Control', opt.cache)
					var modified_since = new Date($.headers['if-modified-since']).getTime();
					var last_modified = new Date(stats.mtime).getTime()
					if(!$.headers['if-modified-since'] || last_modified > modified_since){
						
						// file was modified
						fs.readFile(source, function(readerror, data){
							if(readerror) throw readerror
							
							if(mimeType == 'text/css' || mimeType == 'application/javascript'){	
								var buffer = new Buffer(data);
								zlib.gzip(buffer, function(error, gzip){
									if(error) throw error
									cache[source] = gzip;
									$.header('Content-Encoding', 'gzip')
									$.header('Vary', 'Accept-Encoding')
									$.passed = false;
									$.responded = true;
									$.response.end(gzip)
									$.return()
								})
							} else {
								$.passed = false;
								$.responded = true;
								$.response.end(data)
								$.return()
							}
						})
					
					} else {
						// not modified
						$.status(304)
						$.responded = true;
						$.response.end()
						$.return()
					}
					
				} else if (error.type != 'ENOENT') {
					$.status(error.status || 500, 'File not found');
					$.return();
				} else {
					throw error;
					$.return()
				}
				
			});
		} else {
			$.return();
		}
	}
}

function setOptions(opt, def){
	for(p in opt){
		def[p] = opt[p];
	}

	return def;
}

function parseUrl(url, options){
	var urlTotal = url;
	var script = '.' + options.defaultScript;

	if(!options.index){
		if(path.extname(urlTotal) == ''){
			if(path.basename(urlTotal, script) == 'index')
				urlTotal = urlTotal + script;

			else
				urlTotal = path.join(urlTotal, 'index') + script;
		}
	}

	else{
		if(urlTotal.length > 1){
			if(!options.showScriptName && path.extname(urlTotal).length == 0)
				urlTotal = urlTotal + script;
		}
	}

	return urlTotal;
}