// Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license. See LICENSE file in the project root for full license information.
var common = require('./common.js');
var opCommon = require('./op.common.js');
var chromeCommon = require('./chrome.common.js');

exports.transform = function (model) {
  model.layout = model.layout || "Reference";
  model._op_layout = model.layout;
  model.pagetype = "Reference";
  model.title = model.title || (model.name[0].value + " " + model.type);

  chromeCommon.makeTitle(model);

  if (typeof(model["description"]) === 'undefined' || model["description"] === null) {
	  if (typeof(model.summary) !== 'undefined' && model.summary !== null && model.summary !== '') {
		  var summaryTxt = removeTags(model.summary);
		  if(summaryTxt.length > 200) {
			  summaryTxt = summaryTxt.substring(0, 199).trim() + "…";
		  }
		  model["description"] = summaryTxt;
	  }
  }

  model.toc_asset_id = model.toc_asset_id || model._tocPath;
  model.toc_rel = model.toc_rel || model._tocRel;

  model.platforms = model.platforms || model.platform;
  model.content_git_url = model.content_git_url || common.getImproveTheDocHref(model, model.newFileRepository);
  model.source_url = model.source_url || common.getViewSourceHref(model);
  model["ms.assetid"] = model["ms.assetid"] || opCommon.getAssetId(model);

  var canonicalUrl;
  if (model._op_canonicalUrlPrefix && model._path) {
    canonicalUrl = opCommon.getCanonicalUrl(model._op_canonicalUrlPrefix, model._path, model.layout);
    canonicalUrl = canonicalUrl.replace('.experimental', '');
  }
  model.canonical_url = canonicalUrl;

  if (typeof templateUtility !== 'undefined' && model.breadcrumb_path && model._path) {
    model.breadcrumb_path = templateUtility.resolveSourceRelativePath(model.breadcrumb_path, model._path);
  }
  model.dev_langs = model.langs;
  opCommon.resolvePdfUrlTemplate(model);
  // Clean up unused predefined properties
  var resetKeys = [
    "attributes",
    "uid",
    "id",
    "parent",
    "children",
    "href",
    "name",
    "fullName",
    "type",
    "source",
    "documentation",
    "assemblies",
    "namespace",
    "summary",
    "remarks",
    "example",
    "syntax",
    "overridden",
    "exceptions",
    "seealso",
    "see",
    "inheritance",
    "level",
    "implements",
    "inheritedMembers",
    "conceptual",
    "platform",
    "newFileRepository",
    "thread_safety",
    "defined_in",
    "supported_platforms",
    "requirements",
    "isEii",
    "isExtensionMethod",
    "nameWithType",
    "extensionMethods",
    "_baseDirectory",
    "_displayLangs",
    "gitContribute",
    "_gitContribute",
    "langs",
    "derivedClasses"
  ];

  model = opCommon.resetKeysAndSystemAttributes(model, resetKeys, true);

  chromeCommon.processMetadata(model, canonicalUrl);

  return {
    content: JSON.stringify(model)
  };
}

var tagBody = '(?:[^"\'>]|"[^"]*"|\'[^\']*\')*';

var tagOrComment = new RegExp(
    '<(?:'
    // Comment body.
    + '!--(?:(?:-*[^->])*--+|-?)'
    // Special "raw text" elements whose content should be elided.
    + '|script\\b' + tagBody + '>[\\s\\S]*?</script\\s*'
    + '|style\\b' + tagBody + '>[\\s\\S]*?</style\\s*'
    // Regular name
    + '|/?[a-z]'
    + tagBody
    + ')>',
    'gi');
	
function removeTags(html) {
  var oldHtml;
  do {
    oldHtml = html;
    html = html.replace(tagOrComment, '');
  } while (html !== oldHtml);
  return html.replace(/</g, '&lt;');
}
