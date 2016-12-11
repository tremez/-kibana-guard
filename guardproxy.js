/**
 * Created by taras on 12/2/16.
 */
var config = require('./config.json');
var users=config.users;
var httpProxy = require('http-proxy');
var proxy = httpProxy.createProxyServer({});
var replaceableIndexes=config.replaceableIndexes;

function getPrefix(req) {
	var prefix;
	var user=req.user;
	if (user) {
		prefix = user.prefix;
	}else{
		prefix="JOPA";
	}
	if(prefix===null){
		prefix="JOPA";
	}
	return prefix;
}
function isIndexName(indexName) {
	if (indexName[0] === '_') {
		return false;
	}
	return true;
}
function isReplacementNeeded(index) {
	var ret=false;
	replaceableIndexes.forEach(function(el){
		if (index.indexOf(el) !== -1) {
			ret= true;
		}
	})
	return ret;

}function prepareIndexName(oldIndexName, prefix) {

	if (!isReplacementNeeded(oldIndexName)) {
		return oldIndexName;
	}
	var indexNameParts = oldIndexName.split('-*');
	indexNameParts[0] = indexNameParts[0] + prefix;
	var indexName = indexNameParts.join('-*');
	return indexName;
}
function prepareMgetBody(body, prefix) {
	var docs = body.docs;
	var newBody = {};
	var newDocs = docs.map(function (el) {
		el._index = prepareIndexName(el._index, prefix);
		el._id = prepareIndexName(el._id, prefix)
		return el;
	});
	newBody.docs = newDocs;
	return newBody;
}
function onProxyReq (proxyReq, req, res, options) {
	var prefix = getPrefix(req);
	if (req.body) {
		var body = req.body;
		try {
			body = JSON.parse(body);

			if (req.url.indexOf('_mget') !== -1) {
				body = prepareMgetBody(body, prefix);
			}

			if (Object.keys(body).length) {
				var bodyData=JSON.stringify(body);
				//proxyReq.setHeader('Content-Length',Buffer.byteLength(bodyData));
				proxyReq.write(bodyData);
				//console.log(bodyData);
			} else {
				proxyReq.write("");
			}

		} catch (e) {
			if (typeof body === 'object') {
				body = "{}";
			}
			proxyReq.write(body);

		}
	}
}

function guardProxy(req, res) {
	var prefix = getPrefix(req);
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

			if (isIndexName(indexName)) {
				indexName = prepareIndexName(indexName, prefix);
				parts[searchIndex] = indexName;
			}
		}
		url = parts.join('/');
		req.url = url;
	}
	// proxy.on('proxyReq', function(proxyReq, req, res, options) {
	// 	console.log(res);
	// });
	console.log(req.url,req.method,req.user);
	proxy.web(req, res, {proxyTimeout: 600000, target: req.user.elk_host});
}
proxy.on('proxyReq', onProxyReq);


module.exports={
	guardProxy:guardProxy
}