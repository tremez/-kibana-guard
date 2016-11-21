// var http = require('http'),
// 	httpProxy = require('http-proxy');
// //
// // Create your proxy server and set the target in the options.
// //
// httpProxy.createProxyServer({target:'http://213.155.11.160:80'}).listen(8000); // See (†)
//
// //
// // Create your target server
// //
// http.createServer(function (req, res) {
// 	res.writeHead(200, { 'Content-Type': 'text/plain' });
// 	res.write('request successfully proxied!' + '\n' + req.url+ '\n'+JSON.stringify(req.headers, true, 2));
// 	res.end();
// }).listen(9000);
var express = require('express');

var http = require('http'),
	connect = require('connect'),
	request = require('request'),
	colors = require('colors'),
	util = require('util'),
	bodyParser = require('body-parser'),
	httpProxy = require('http-proxy'),
	proxy = httpProxy.createProxyServer({});
function getPrefix(req){
	var prefix;
	var auth = req.headers.authorization;
	if (auth) {
		auth = new Buffer(req.headers.authorization.split(" ")[1], 'base64').toString();
		auth = auth.split(':');
		var username = auth[0];
		if (username === 'kibanaadmin') {
			prefix = 'pbx74vm';
		}
	}
	return prefix;
}
function isIndexName(indexName){
	if (indexName[0] === '_') {
		return false;
	}
	return true;
}
function isReplacementNeeded(index){
	if(index.indexOf('asteriskcdrmain-')!==-1){
		return true;
	}
	if(index.indexOf('asteriskcdr-')!==-1){
		return true;
	}
	if(index.indexOf('asteriskqueuelog-')!==-1){
		return true;
	}
	return false;

}
function prepareIndexName(oldIndexName,prefix){

	if(!isReplacementNeeded(oldIndexName)){
		return oldIndexName;
	}
	var indexNameParts = oldIndexName.split('-*');
	indexNameParts[0] = indexNameParts[0] + '_' + prefix;
	var indexName = indexNameParts.join('-*');
	return indexName;
}
function prepareMgetBody(body,prefix){
	var docs=body.docs;
	var newBody={};
	var newDocs=docs.map(function(el){
		el._index=prepareIndexName(el._index,prefix);
		el._id=prepareIndexName(el._id,prefix)
		console.log('JOPA',el._id,el._index);
		return el;
	});
	newBody.docs=newDocs;
	return newBody;
}

proxy.on('proxyReq', function (proxyReq, req, res, options) {
	var prefix=getPrefix(req);
	console.log('proxy req',req.url);
	if (req.body) {
		var body=req.body;
		try{
			body=JSON.parse(body);
			console.log(body);

			if(req.url.indexOf('_mget')!==-1){
				body=prepareMgetBody(body,prefix);
				console.log('MGET');
			}


			if(Object.keys(body).length){
				proxyReq.write(req.body);
			}else{
				proxyReq.write("");
			}

		}catch(e){
			if(typeof body === 'object'){
				body="{}";
			}
			//console.log('NO JSON','---',body.toString(),'---');
			proxyReq.write(body);

		}
	}
	//console.log('DONE');
});


var app = express()
	.use(bodyParser.text({type:function(){return true}}))
	.use(function(req, res){
		var prefix=getPrefix(req);

		// You can define here your custom logic to handle the request
		// and then proxy the request.
		//console.log(req.url);
		if (prefix && req.url.indexOf('/elasticsearch/') != -1) {
			var url = req.url;
			var parts = url.split('/');
			var searchIndex = parts.findIndex(function (el) {
				if (el === 'elasticsearch') {
					return true;
				} else {
					return false;
				}
			});
			searchIndex += 1;
			var indexName;
			if (parts.length >= searchIndex) {
				indexName = parts[searchIndex];
				// if (indexName[0] === '_') {
				// 	indexName = null;
				// }

				if (isIndexName(indexName)) {
					indexName=prepareIndexName(indexName,prefix);
					parts[searchIndex] = indexName;
				}
			}
			url = parts.join('/');
			req.url = url;
		}
		// proxy.on('proxyReq', function(proxyReq, req, res, options) {
		// 	console.log(res);
		// });
		proxy.web(req, res, {proxyTimeout: 600000, target: 'http://213.155.11.160:80'});
	});

http.createServer(app).listen(9000, function(){
	console.log('proxy linsten 9000');
});
