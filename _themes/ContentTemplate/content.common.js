// Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license. See LICENSE file in the project root for full license information.
function buildEditLink(obj) {
	var editLink = '';

	if(obj.source.remote.repo.indexOf('visualstudio.com') > -1) {
		//vsts formatting
		editLink = obj.source.remote.repo + '?path=' + obj.source.remote.path + '&version=GB' + obj.source.remote.branch;
		if(obj.source.startLine) {
			editLink += '&line=' + obj.source.startLine;
		}
	} else {
		//default to git formatting
		editLink = obj.source.remote.repo.replace('.git', '/blob/') + obj.source.remote.branch + '/' + obj.source.remote.path;
		if(obj.source.startLine) {
			editLink += '/#L' + (obj.source.startLine + 1);
		}
	}

	return editLink;
}

function stringToBoolean(str){
    switch(str.toLowerCase().trim()){
        case "true": case "yes": case "1": return true;
        case "false": case "no": case "0": return false;
        default: return Boolean(str);
    }
}

exports.buildEditLink = buildEditLink;
exports.stringToBoolean = stringToBoolean;