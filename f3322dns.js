'use strict';
const fs = require('fs');
const http = require('http');
const path = require('path');
const crypto = require('crypto');
const config = require(path.join(__dirname, 'config.json'));

const F3322DNS_HOST = 'members.3322.net';
const HTTP_METHOD = "GET";
var IP = config.ip || '127.0.0.1';
const USERNAME = config.username;
const PASSWORD = config.password;
const USERINFOSTR = USERNAME + ":" + PASSWORD;
const USERINFO = Buffer.from(USERINFOSTR, 'utf-8').toString('base64');
const HEADERS = {'Host': 'members.3322.net','Authorization': "Basic " + USERINFO,'User-Agent': 'myclient/1.0 me@null.net'};
const COMMONPARAMS = {"wildcard":"OFF","mx":"mail.exchanger.ext","backmx":"NO","offline":"NO"};

const getCombinedParams = function (reqParams) {
  const combinedParams = {};
  Object.keys(reqParams).forEach((x) => {
    combinedParams[x] = reqParams[x];
  });
  Object.keys(COMMONPARAMS).forEach((x) => {
    combinedParams[x] = COMMONPARAMS[x];
  });
  return combinedParams;
};

const convertJsonToQueryString = function (params) {
  return Object.keys(params)
    .sort()
    .map(x => x + "=" + params[x])
    .join("&");
};

const getQueryString = function (reqParams) {
  const combinedParams = getCombinedParams(reqParams);
  return convertJsonToQueryString(combinedParams);
};

const getPath = function (reqParams) {
  return '/dyndns/update?' + getQueryString(reqParams);
};

const saveConfig = function (newConfig){
	const configJSONStr = JSON.stringify(newConfig, null, 4);
	if (configJSONStr){
		try{
			fs.writeFileSync(path.join(__dirname, 'config.json'), configJSONStr);
		}catch(e){}
	}
};

const updateRecord = function(target){
	const ip = target.ip;
	const subDomain = target.hostname;
	const updateParmas = {
		hostname: target.hostname,
		myip: target.ip
	};
	if (IP!='127.0.0.1' && target.ip && target.hostname && IP!=target.ip) {
		console.log("old ip is " + IP);
		console.log("new ip is " + target.ip);
		console.log("try update " + target.hostname);
		http.request({
				host: F3322DNS_HOST,
				path: getPath(updateParmas),
				headers: HEADERS
			}, res => {
				if (res.statusCode === 200) {
					console.log("update " + target.hostname + " success");
					var newConfig = config;
					IP = newConfig.ip = target.ip;
					saveConfig(newConfig);
				}else{
					console.log("update " + target.hostname + " fail");
					res.on('data', (chunk) => {
						console.log(`${chunk}`);
					});
				}
		}).end();
	}else {
		var newConfig = config;
		newConfig.ip = target.ip;
		saveConfig(newConfig);
	}
};

module.exports.updateRecord = updateRecord;
