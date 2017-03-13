// Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license. See LICENSE file in the project root for full license information.
var contentCommon = require('./content.common.js');
var restApiCommon = require('./RestApi.common.js');
var currentGroupName = 'STARTING';
var groupCount = 0;

exports.transform = function (model) {
  model = restApiCommon.transform(model);
  model._disableToc = model._disableToc || !model._tocPath || (model._navPath === model._tocPath);
  model.formattedName = FormatOperationName(model.name);
  if (model.tags) {
    var childNames = [];
    for(var x in model.tags){
      //move children out to the main model.children collection
      model.tags[x].children.forEach(function (child) {
          var operationId = child.operationId;

          if (childNames.indexOf(operationId) === -1) {
            model.children.push(child);
            childNames.push(operationId);
          }
      });
    }
  }

  if (model.children) {
    updateChildren(model.children, model); 
    model.children.sort(function(a, b) {
        return a.operationName.localeCompare(b.operationName);
    });
  }

  for(var child in model.children)
  {
    var singleChild = model.children[child];
    examples = singleChild["x-ms-examples"];
    var newExamples = [];
    if (examples) {
        for (var example in examples) {
          var singleItem = examples[example];
          singleItem["x-internal-ref-name"] = undefined;
          var singleExample = {};
          singleExample.name = FormatOperationName(example);
          singleExample.content = JSON.stringify(singleItem, null, '\t').trim();
          newExamples.push(singleExample);
        }
    }
    model.children[child].MSExamples = newExamples;
  }

  if (model.children && model.children.length > 0)
  {
      model.formattedName = model.children[0].groupName;
  }

  updateArrayNames(model);

  return model;
};

exports.getOptions = function (model) {
  if (!model) return null;

  var bookmarks = {};
  // Rest's first level bookmark should have no anchor
  bookmarks[model.uid] = "";
  if (model.children) {
      model.children.forEach(function (child) {
          bookmarks[child.uid] = child.operationId;
      });
  }

  return { "bookmarks": bookmarks};
}

function updateChildren(children, model) {  
  var lastIndex = children.length-1;
  for (var childIdx in children)
  {
    var child = children[childIdx];

    if (childIdx===lastIndex)
    {
      child.isLastItem = true;
    }
    else
    {
      child.isLastItem = false;
    }

    var altName = "";
    var version = "";

    var obj = JSON.parse(model._raw);
    for(var x in obj){
        if(x === "x-internal-operation-group-name"){
          altName = obj[x];
        }
        if (x === "info") {
          for (var y in obj[x]) {
              if (y === "version") {
                version = obj[x][y];
              }
          }
        }
    }

    model.apiversion = version;
    if (child.path.indexOf('?api-version') > -1 && child.path.indexOf('?api-version=') === -1) {
      child.path = child.path.replace('?api-version','?api-version=' + version);
    }
    
    var originalGroupName = GetGroupNameFromOperationName(child.operationId);
    var groupName = "";
    if (altName !== "") {
      groupName = altName;
    } else {
      groupName = originalGroupName;
    }

    groupName = FormatOperationName(groupName);
    originalGroupName = FormatOperationName(originalGroupName);
    var groupId = CreateIdFromName(groupName);
    child.groupId = groupId;
    if (originalGroupName !== currentGroupName)
    {
      child.isNewGroup = true;
      groupCount++;
    }
    else
    {
      child.isNewGroup = false;
    }    

    if (groupCount == 1)
    {
      child.isFirstGroup = true;
      child.isNewGroup = true;
    }
    else
    {
      child.isFirstGroup = false;
    }
    child.groupName = groupName;        
    currentGroupName = originalGroupName;

    child.operationName = FormatOperationName(child.operationId);
    child.anchor = child.operationId;
    child.operationName = TrimString(child.operationName.replace(originalGroupName + "_",""));

    if (child.description === null || child.description == child.summary)
    {
      child.description=null;
    }

    if (child.parameters && child.parameters.length > 1) {
      sortParameters(child.parameters);
    }
  }
}

function updateArrayNames(model){
  var debugLog = "";

  if (model.tags) {
    for(var x in model.tags){
      debugLog += updateOperationArrayNames(model.tags[x].children);
    }
  }

  if (model.children) {
    debugLog += updateOperationArrayNames(model.children); 
  }

  return debugLog;
}

function updateOperationArrayNames(children){
  var debugLog = "";

  for (var y in children){
    var child = children[y];
    for(var z in child){
      if(z === "parameters"){
        debugLog += updateParameterArrayNames(child[z]);
      } else if(z === "responses"){
        debugLog += updateParameterArrayNames(child[z]);
      }
    }
  }

  return debugLog;
}

function updateParameterArrayNames(parameter){
  var arrayFound = false;
  var objectFound = false;
  var propertyName = null;
  var typeName = null;
  var arrayName = null;
  var clearItems = false;

  var debugLog = ""; 

  for(var aa in parameter){            
    for(var bb in parameter[aa]){
      if(bb === "name") {
        propertyName = parameter[aa][bb];
      }
      if(bb === "type" && parameter[aa][bb] === "array") {
        debugLog += " || " + propertyName + "," + bb + "::" + parameter[aa][bb];
        arrayFound = true;
      } else if (bb === "items") {
        for(var cc in parameter[aa][bb]){                               
          if(arrayFound && cc === "type") {
            debugLog += "::" + parameter[aa][bb][cc];
            if(parameter[aa][bb][cc] === "object") {
              objectFound = true;
            } else {
              arrayName = parameter[aa][bb][cc] + "[]";
              clearItems = true;
            }                                  
          } else if (objectFound && cc === "x-internal-ref-name") {
            objectFound = false;
            arrayName = parameter[aa][bb][cc] + "[]";            
          }  
        }
      } else if(bb === "schema"){
        for(var cc in parameter[aa][bb]){
          if(cc === "properties"){
            debugLog += updatePropertiesArrayNames(parameter[aa][bb][cc]);                    
          } else if(cc === "x-internal-ref-name") {
            typeName = parameter[aa][bb][cc];
          }
        }
      }
    }

    if(arrayFound)
    {
      arrayFound = false;
      parameter[aa]["type"] = arrayName;
      if(clearItems)
      {
        clearItems = false;
        parameter[aa]["items"] = null;
      }
    }

    if(typeName !== null){
      parameter[aa]["typeName"] = typeName;
      parameter[aa]["schema"]["x-internal-ref-name"] = null;
      typeName = null;
    }
  }

  return debugLog;
}

function updatePropertiesArrayNames(properties){
  var arrayFound = false;
  var objectFound = false;
  var propertyName = null;
  var enumName = null;
  var enumValues = null;
  var formatName = null;
  var arrayName = null;    
  var clearItems = false;
  var isSimpleDescription = false;

  var debugLog = "";

  for(var dd in properties){
    for(var ee in properties[dd]){
      var property = properties[dd][ee];
      if(ee === "key") {
        propertyName = property;
      }
      if(ee === "value"){
        for(var ff in property){                                    
          if(ff === "type" && property[ff] === "array") {
            debugLog += " || " + propertyName + " :: " + ff + ":" + property[ff];
            arrayFound = true;
          } else if(ff === "enum") {
            enumValues = property[ff];
          } else if(ff === "x-ms-enum") {
            enumName = property[ff]["name"];
          } else if(ff === "format") {
            formatName = property[ff];
          } else if (ff === "items") {
            for(var gg in property[ff]){
              if(arrayFound && gg === "type") {
                debugLog += ", " + gg + ":" + property[ff][gg];
                if(property[ff][gg] === "object") {
                  objectFound = true;
                } else {
                  arrayName = property[ff][gg] + "[]";
                  clearItems = true;
                }                                  
              } else if (gg === "properties") {
                debugLog += updatePropertiesArrayNames(property[ff][gg]);
              } else if (objectFound && gg === "x-internal-ref-name") {
                objectFound = false;
                arrayName = property[ff][gg] + "[]";
              }  
            } 
          }         
        }

        if(arrayFound)
        {
          arrayFound = false;
          property["type"] = arrayName;
          if(property["items"] !== undefined)
          {
            property["items"]["x-internal-ref-name"] = null;
          }

          if(clearItems)
          {
            clearItems = false;
            property["items"] = null;
          }
        } else if(enumValues !== null) {
          var enumString = enumValues.join(", ");
          
          if(enumName !== null){
            enumString = enumName + " { " + enumString + " }";
            enumName = null;
          }

          property["type"] = enumString;
          enumValues = null;
        } else if(formatName !== null) {          
          property["type"] = formatName;
          formatName = null;
        }

        if((property["type"] !== null ||
            property["description"] !== null ||
            property["x-internal-loop-ref-name"] !== null)
            &&
            ((!property.hasOwnProperty("readOnly") || property["readOnly"] === null) &&
             (!property.hasOwnProperty("required") || property["required"] === null) &&
             (!property.hasOwnProperty("title") || property["title"] === null) &&
             (!property.hasOwnProperty("summary") || property["summary"] === null) &&             
             (!property.hasOwnProperty("items")) || property["items"] === null)) {
            isSimpleDescription = true;
        }

        if(isSimpleDescription) {
          isSimpleDescription = false;
          property["isSimpleDescription"] = true;
        }
      }
    }
  }

  return debugLog;
}

function sortParameters(parameters) {

  //ensure required is set first
  for (i=0; i < parameters.length; i++) {
    if(typeof parameters[i].required === "undefined") {
      parameters[i].required = false;
    }            
  }

  parameters.sort(function(a, b) {
    if(a.required === b.required) {
        return a.name === b.name ? 0 : (a.name < b.name ? -1 : 1);
    } else if(a.required) {
        return -1;
    } else {
        return 1;
    }
  });
}


function CreateIdFromName(name) {
  var id = name.replace(' ','-');
  id = TrimString(id);
  return id;
}

function FormatOperationName(operationId) {
  var str = operationId.substring(operationId.indexOf("_")+1);
  str = operationId.replace(/([a-z])([A-Z])/g, "$1 $2");
  str = str.replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
  return TrimString(str);
}

function GetGroupNameFromOperationName(operationId) {
  var str = operationId.substring(0,operationId.indexOf("_"));
  return TrimString(str);
}

function TrimString(str) {
    if (!String.prototype.trim) {
        str = str.replace(/^\s+|\s+$/g, '');
    }
    else
    {
      str = str.trim();
    }
    return str;
}


