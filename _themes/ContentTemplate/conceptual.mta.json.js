// Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license. See LICENSE file in the project root for full license information.
var opCommon = require('./op.common.js');
var chromeCommon = require('./chrome.common.js');

exports.transform = function (model) {
  model.layout = model.layout || "Conceptual";
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
    "_gitContribute"
  ];
  model = opCommon.resetKeysAndSystemAttributes(model, resetKeys, true);

  chromeCommon.makeTitle(model);
  chromeCommon.processMetadata(model, canonicalUrl);

  return {
    content: JSON.stringify(model)
  };
};
