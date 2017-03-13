// Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license. See LICENSE file in the project root for full license information.

var contentCommon = require('./content.common.js');
var mrefCommon = require('./ManagedReference.common.js');

exports.transform = function (model) {
  model = mrefCommon.transform(model);
  if (model.type.toLowerCase() == "enum") {
    model.isClass = false;
    model.isEnum = true;
  }

  if(model.assemblies !== undefined ||
     model.namespace !== undefined ||
     model.package !== undefined) {
    model.shouldRenderDetails = true;
  }  

  // Add "platform" to group of children. The value is the union of children's "platform".
  // Rendering can use this key to decide whether to show the subtitle of a group(e.g., Methods/Properties...) after switching platform.
  if (model.children && model.platform) {
    model.children.forEach(function (group) { addGroupPlatform(group); });
  }    

	//type level edit link
	if(model.source && model.source.remote && model.source.remote.path && model.source.remote.branch && model.source.remote.repo)
	{ 			
		model.editLink = contentCommon.buildEditLink(model);
	}    

  //device family
  if(model.deviceFamilies && model.deviceFamilies.length && 
      model.deviceFamiliesVersions && model.deviceFamiliesVersions.length &&
      model.deviceFamilies.length === model.deviceFamiliesVersions.length)
  {
    for (var i = 0; i < model.deviceFamilies.length; i++)
    {
      model.deviceFamilies[i] += ' (introduced v' + model.deviceFamiliesVersions[i] + ')';
    }
  }

  //api contracts
  if(model.apiContracts && model.apiContracts.length && 
      model.apiContractsVersions && model.apiContractsVersions.length &&
      model.apiContracts.length === model.apiContractsVersions.length)
  {
    for (var i = 0; i < model.apiContracts.length; i++)
    {
      model.apiContracts[i] += ' (introduced v' + model.apiContractsVersions[i] + ')';
    }
  }

  //build member edit link
  //AND
  //update examples for Windows
  //temp fix until "Example" handles markdown via yml import
  if (model.children) {
    var child, childChild, editLink, example;
    for (var i = 0; i < model.children.length; i++)
    {
      child = model.children[i];
      if(child.children && child.children.length)
      {
        for (var j = 0; j < child.children.length; j++)
        {    
          childChild = child.children[j];

          //edit link
          if(childChild.source && childChild.source.remote && childChild.source.remote.path && childChild.source.remote.branch && childChild.source.remote.repo)
          { 			
            model.children[i].children[j].editLink = contentCommon.buildEditLink(childChild);
          }  

          //examples      
          if(childChild.example && childChild.example.length)
          {
            for (var k = 0; k < childChild.example.length; k++)
            { 
              example = childChild.example[k];
              model.children[i].children[j].example[k] = example.replace(/\\n/gi, "<br>").replace(/\\t/gi, "&nbsp;&nbsp;&nbsp;&nbsp;");
            }
          }
        }
      }
    }
  }  

  if (model.inheritedMembers && model.inheritedMembers.length > 0)
  { 
    var parents = [];

    var currentParent = "";
    for(var x in model.inheritedMembers)
    {
     
      var item = model.inheritedMembers[x];

      var existingParentIndex = -1;

      for (idx = 0; idx < parents.length; idx++)
      {
        if (parents[idx].name === item.parent)
        {
          existingParentIndex = idx;
          break;
        }
      }

      if (existingParentIndex === -1) {
        //ok, so this is a new parent, need a new grouping
        var newParent = {
          name: item.parent,
          children: []
        };
        newParent.children.push(item);

        //add new Parent to parents collection
        parents.push(newParent);
      }
      else {
        var existingParent = parents[existingParentIndex];
        existingParent.children.push(item);        
      }
    }

    for (idx = 0; idx < parents.length; idx++)
    {
        var parent = parents[idx];
        if (parent.children.length > 0) {
          parent.children[parent.children.length - 1].last = true;
        }     
    }

    model.newInheritedMembers = parents;
  }
  
  //derived classes
  var maxDerivedDisplayCount = 3;
  if(model.derivedClasses && model.derivedClasses.length > maxDerivedDisplayCount){
    var hiddenDerivedClasses = [];
    while(model.derivedClasses.length > maxDerivedDisplayCount)
    {
      hiddenDerivedClasses.unshift(model.derivedClasses.pop());
    }

    model.hiddenDerivedClassesIndex = model.derivedClasses[0].index;
    model.hiddenDerivedClasses = hiddenDerivedClasses;
  }

//  model.testData = parseModel(model);

  model._disableToc = model._disableToc || !model._tocPath || (model._navPath === model._tocPath);

  return { item: model };
}

exports.getOptions = function (model) {
  return { "bookmarks": mrefCommon.getBookmarks(model) };
}

function addGroupPlatform(group) {
  if (!group || !group.children || group.children.length == 0) return;

  var platform = [];
  for (var i = 0; i < group.children.length; i++) {
    platform = union(platform, group.children[i].platform);
  }
  group.platform = platform;
}

function parseModel(model) {
  var testData = JSON.stringify(model);
  return testData;
}

function union(a, b) {
  if (!a) return b;
  if (!b) return a;
  return a.concat(b.filter(function (item) {
    return a.indexOf(item) < 0;
  }));
}