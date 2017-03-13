// Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license. See LICENSE file in the project root for full license information.
var common = require('./common.js');
var opCommon = require('./op.common.js');
var chromeCommon = require('./chrome.common.js');

exports.transform = function (model) {
  model.title = model.name;

  chromeCommon.makeTitle(model);

  model.layout = model.layout || "Rest";
  model._op_layout = model.layout;
  model.pagetype = "Reference";
  model.dev_langs = model.langs || ["http"];

  model.toc_asset_id = model.toc_asset_id || model._tocPath;
  model.toc_rel = model.toc_rel || model._tocRel;

  // If ms.assetId is not set, set it to combination of model.uid and file name without extension, which is same to operation group name by default
  model["ms.assetid"] = model["ms.assetid"] || opCommon.getAssetId(model) + '/' + common.path.getFileNameWithoutExtension(model._path);

  model.content_git_url = model.content_git_url || common.getImproveTheDocHref(model, model.newFileRepository);

  var canonicalUrl;
  if (model._op_canonicalUrlPrefix && model._path) {
    canonicalUrl = opCommon.getCanonicalUrl(model._op_canonicalUrlPrefix, model._path, model.layout);
    canonicalUrl = canonicalUrl.replace('.experimental', '');
  }
  model.canonical_url = canonicalUrl;

  if (typeof templateUtility !== 'undefined' && model.breadcrumb_path && model._path) {
    model.breadcrumb_path = templateUtility.resolveSourceRelativePath(model.breadcrumb_path, model._path);
  }
  opCommon.resolvePdfUrlTemplate(model);
  // Clean up unused predefined properties
  var resetKeys = [
    "basePath",
    "_baseDirectory",
    "children",
    "conceptual",
    "consumes",
    "definitions",
    "_displayLangs",
    "documentation",
    "externalDocs",
    "footer",
    "host",
    "htmlId",
    "name",
    "newFileRepository",
    "parameters",
    "produces",
    "remarks",
    "responses",
    "schemes",
    "sections",
    "security",
    "securityDefinitions",
    "source",
    "swagger",
    "tags",
    "uid",
    "gitContribute",
    "_gitContribute",
    "langs"
  ];

  model = opCommon.resetKeysAndSystemAttributes(model, resetKeys, true);

  chromeCommon.processMetadata(model, canonicalUrl);

  // Clean up 'x-*' which is extensions to the Swagger Schema
  model = opCommon.batchSetProperties(
    model,
    function (key) {
      return key.indexOf('x-') === 0;
    },
    undefined);

  return {
    content: JSON.stringify(model)
  };
}