// Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license. See LICENSE file in the project root for full license information.
var opCommon = require('./op.common.js');
var chromeCommon = require('./chrome.common.js');

exports.transform = function (model) {
    model.layout = model.layout || "Conceptual";
    model._op_layout = model.layout;
    model.pagetype = "Reference";
    model.title = model.name;

    chromeCommon.makeTitle(model);

    model.description = model.summary;
    model["ms.assetid"] = model.uid;

    // get overwrite metadata
    if (model.overwrite_metadata) {
        var keys = model.overwrite_metadata;
        for (var key in keys) {
            model[key] = keys[key];
        }
    }

    model.toc_asset_id = model.toc_asset_id || model._tocPath;
    model.toc_rel = model._tocRel;

    if (model.breadcrumb_path && model._path) {
        model.breadcrumb_path = templateUtility.resolveSourceRelativePath(model.breadcrumb_path, model._path);
    }

    var canonicalUrl;
    if (model._op_canonicalUrlPrefix && model._path) {
        canonicalUrl = opCommon.getCanonicalUrl(model._op_canonicalUrlPrefix, model._path, model.layout);
        canonicalUrl = canonicalUrl.replace('.experimental', '');
    }
    model.canonical_url = canonicalUrl;
    model._op_canonicalUrl = canonicalUrl;

    if (model.doc_source_url_repo && model.doc_source_url_path)
        model.content_git_url = model.doc_source_url_repo + opCommon.encodePath(model.doc_source_url_path);

    opCommon.resolvePdfUrlTemplate(model);
    // Clean up unused predefined properties
    var resetKeys = [
      "usage",
      "filePath",
      "synopsis",
      "isWorkflow",
      "extent",
      "isSupportCommonParameters",
      "notes",
      "options",
      "inputs",
      "outputs",
      "links",
      "syntax",
      "examples",
      "parameters",
      "children",
      "uid",
      "htmlId",
      "name",
      "summary",
      "fullName",
      "doc_source_url_path",
      "doc_source_url_repo",
      "overwrite_metadata",
      "source",
      "commandList"
    ];
    model = opCommon.resetKeysAndSystemAttributes(model, resetKeys, true);

    // For metadata consumed by docs themes, rename with prefix "_op_"
    var metaForThemes = ["wordCount", "rawTitle", "appliesto", "searchScope", "brand", "hideEdit", "hideViewSource", "extendBreadcrumb", "featureFlags", "defaultDevLang"];
    for (var index = 0; index < metaForThemes.length; ++index) {
        var meta = metaForThemes[index];
        model["_op_".concat(meta)] = model[meta];
        model[meta] = undefined;
    }
    return {
        content: JSON.stringify(model)
    };
}
