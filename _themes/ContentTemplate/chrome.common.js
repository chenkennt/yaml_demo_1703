// Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license. See LICENSE file in the project root for full license information.
exports.makeTitle = makeTitle;
exports.processMetadata = processMetadata;

function makeTitle(model) {
    if(typeof(model.title) !== 'undefined' && model.title != null) { 
        var pipeIndex = model.title.indexOf("|");
        if (pipeIndex > -1) {
        model._op_ogTitle = model.title.substring(0, pipeIndex).trim();
        } else {
        model._op_ogTitle = model.title;
        }
    } else {
        model._op_ogTitle = "";
    } 

	var titleSuffix = "";
	if (typeof(model["titleSuffix"]) !== 'undefined' 
		&& model["titleSuffix"] !== null) {
		titleSuffix = " - " + model["titleSuffix"];
		model["titleSuffix"] = null;
	}
	model.title = model._op_ogTitle + titleSuffix + " | Microsoft Docs";
}

function processMetadata(model, canonicalUrl) {

  var displayDate = model["ms.date"];
  if (typeof(displayDate) !== 'undefined' && displayDate !== null) {
    try {
      var msDateAsDate = stringToDate(displayDate, "mm/dd/yyyy", "/");
      model._op_displayDate = msDateAsDate.getFullYear() + "-" + (msDateAsDate.getMonth()+1) + "-" + msDateAsDate.getDate();
      model._op_displayDate_source = msDateAsDate.toISOString();
    }
    catch(e) {
      model._op_displayDate = null;
      model._op_displayDate_source = null;
    }
  }

  // For metadata consumed by docs themes, rename with prefix "_op_"
  var metaForThemes = ["wordCount", "rawTitle", "appliesto", "searchScope", "brand", "hideEdit", "hideViewSource", "extendBreadcrumb", "featureFlags", "defaultDevLang", "google_analytics"];
  for (var index = 0; index < metaForThemes.length; ++index) {
    var meta = metaForThemes[index];
    model["_op_".concat(meta)] = model[meta];
    model[meta] = undefined;
  }
  model._op_canonicalUrl = canonicalUrl;
}

  //from http://stackoverflow.com/a/25961926
  function stringToDate(_date,_format,_delimiter)
  {
      var formatLowerCase=_format.toLowerCase();
      var formatItems=formatLowerCase.split(_delimiter);
      var dateItems=_date.split(_delimiter);
      var monthIndex=formatItems.indexOf("mm");
      var dayIndex=formatItems.indexOf("dd");
      var yearIndex=formatItems.indexOf("yyyy");
      var month=parseInt(dateItems[monthIndex]);
      month-=1;
      var formatedDate = new Date(dateItems[yearIndex],month,dateItems[dayIndex]);
      return formatedDate;
  }
