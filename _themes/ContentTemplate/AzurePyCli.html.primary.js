var contentCommon = require('./content.common.js');

exports.transform = function (model) {
	var globalParamNames = ['--debug', '--help -h', '--output -o', '--query', '--verbose'];

	if(model.children && model.children.length){
		var child = null;
		var requiredParams = [];
		var optionalParams = [];
		var globalParams = [];
		var param = null;
		var isGlobalParam = false;

		for(var h = 0; h < model.children.length; h++){
			child = model.children[h];

			requiredParams = [];
			optionalParams = [];
			globalParams = [];

			//edit link
			if(child.source && child.source.remote && child.source.remote.path && child.source.remote.branch && child.source.remote.repo)
			{ 			
				model.children[h].editLink = contentCommon.buildEditLink(child);
			}

			//parameters
			if(child.parameters && child.parameters.length){
				for(var i = 0; i < child.parameters.length; i++){					
					param = child.parameters[i];

					param.showParameterInfo = param.parameterValueGroup !== undefined || param.defaultValue !== undefined || param.valueFrom !== undefined;

					if(contentCommon.stringToBoolean(param.isRequired)) {
						requiredParams.push(param);
					} else {
						isGlobalParam = false;
						for(var j = 0; j < globalParamNames.length; j++){
							if(param.name === globalParamNames[j]) {
								isGlobalParam = true;
								break;
							}
						}

						if(isGlobalParam) {
							globalParams.push(param);
						} else {
							optionalParams.push(param);
						}
					}
				}

				if(requiredParams.length)
				{
					requiredParams.sort(sortParams);
					model.children[h].requiredParameters = requiredParams;
				}

				if(optionalParams.length)
				{
					optionalParams.sort(sortParams);
					model.children[h].optionalParameters = optionalParams;
				}

				if(globalParams.length)
				{
					globalParams.sort(sortParams);
					model.children[h].globalParameters = globalParams;
				}
			}
			
			var synopsis = '';
			var isFirstParam = true;
			var nameLength = child.name.length;
			if(requiredParams.length)
			{
				for(var i = 0; i < requiredParams.length; i++){
					synopsis += getLineBreak(isFirstParam, nameLength) + ' ' + getFirstName(requiredParams[i].name) + getAcceptedValues(requiredParams[i]);
					isFirstParam = false;
				}
			}

			if(optionalParams.length)
			{
				for(var i = 0; i < optionalParams.length; i++){
					synopsis += getLineBreak(isFirstParam, nameLength) + ' [' + getFirstName(optionalParams[i].name) + getAcceptedValues(optionalParams[i]) + ']';
					isFirstParam = false;
				}
			}
			
			model.children[h].synopsis = child.name + synopsis;
		}
	}

	return model;
}

function getAcceptedValues(obj){
	if(obj.parameterValueGroup){
		return ' {' + obj.parameterValueGroup + '}';
	} else {
		return '';// ' + getFirstName(obj.name).toUpperCase().replace(/--/g, '').replace(/-/g, '_');
	}
}

function getFirstName(str){
	if(str.indexOf(' ') > -1) {
		return str.split(' ')[0];
	} else {
		return str;
	}
}

function getLineBreak(isFirstParam, nameLength) {
	if(!isFirstParam) {
		var spacer = '';
		for(var i = 0; i < nameLength; i++){
			spacer += ' ';
		}
		return '<br>' + spacer;
	} else {
		return '';
	}
}

function sortParams(a, b) {
	var nameA = a.name.toLowerCase();
	var nameB = b.name.toLowerCase();

    if (nameA < nameB) {
		return -1
	}
        
    if (nameA > nameB){
		return 1;
	}

    return 0;
}