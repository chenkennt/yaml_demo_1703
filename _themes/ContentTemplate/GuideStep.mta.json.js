// Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license. See LICENSE file in the project root for full license information.
var opCommon = require('./op.common.js');
var chromeCommon = require('./chrome.common.js');

exports.transform = function (model) {
  model.layout = model.layout || "NOLAYOUT";
  model.pagetype = "Conceptual";

  //ensure author is included in contributors list
  var contribInfo = model._op_gitContributorInformation;
  if(contribInfo != null &&
     typeof contribInfo.author !== 'undefined' &&
     typeof contribInfo.author.profile_url !== 'undefined' &&
     contribInfo.author.profile_url != null &&
     contribInfo.author.profile_url != '') {

    var isFound = false;

    for (var i = 0; i < contribInfo.contributors.length; i++) {
      if(contribInfo.contributors[i].profile_url === contribInfo.author.profile_url)
      {
        isFound = true;
        break;
      }
    }

    if(!isFound)
    {
      contribInfo.contributors.unshift({profile_url: contribInfo.author.profile_url, display_name: contribInfo.author.display_name});
    }
  }


  var canonicalUrl;
  if (model._op_canonicalUrlPrefix && model._path) {
    canonicalUrl = opCommon.getCanonicalUrl(model._op_canonicalUrlPrefix, model._path, model.layout);
    canonicalUrl = canonicalUrl.replace('.experimental', '');
  }
  model.canonical_url = canonicalUrl;

  model.toc_asset_id = model.toc_asset_id || model._tocPath;
  model.toc_rel = model.toc_rel || model._tocRel;
  if (typeof templateUtility !== 'undefined' && model.breadcrumb_path && model._path) {
    model.breadcrumb_path = templateUtility.resolveSourceRelativePath(model.breadcrumb_path, model._path);
  }
  opCommon.resolvePdfUrlTemplate(model);
  // there should be a better way too get this value
  var _op_isLocalBuild = false;
  /*
  if (model._op_themeFolder !== undefined && model._op_themeFolder.substring(0, 9) === 'C:\\users\\') {
	  _op_isLocalBuild = true;
  } */

  // Clean up unused predefined properties
  var resetKeys = [
    "conceptual",
    "documentation",
    "remote",
    "path",
    "type",
    "source",
    "newFileRepository",
    "_baseDirectory",
    "_displayLangs",
    "gitContribute",
    "_gitContribute",
    "guideLayout",
    "items"
  ];
  model = opCommon.resetKeysAndSystemAttributes(model, resetKeys, true);

  chromeCommon.makeTitle(model);

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
  var metaForThemes = ["wordCount", "rawTitle", "appliesto", "searchScope", "brand", "hideEdit", "hideViewSource", "extendBreadcrumb", "featureFlags", "defaultDevLang"];
  for (var index = 0; index < metaForThemes.length; ++index) {
    var meta = metaForThemes[index];
    model["_op_".concat(meta)] = model[meta];
    model[meta] = undefined;
  }
  model._op_canonicalUrl = canonicalUrl;
  model._op_isLocalBuild = _op_isLocalBuild;
  return {
    content: JSON.stringify(model)
  };

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
}
