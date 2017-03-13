// Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license. See LICENSE file in the project root for full license information.
var opCommon = require('./op.common.js');
var chromeCommon = require('./chrome.common.js');

exports.transform = function (model) {
    model.layout = model.layout || "Conceptual";
    model._op_layout = model.layout;
    model.pagetype = "Reference";
    model.title = model.name;

    chromeCommon.makeTitle(model);

    var canonicalUrl;
    if (model._op_canonicalUrlPrefix && model._path) {
        canonicalUrl = opCommon.getCanonicalUrl(model._op_canonicalUrlPrefix, model._path, model.layout);
        canonicalUrl = canonicalUrl.replace('.experimental', '');
    }
    model.canonical_url = canonicalUrl;
    model._op_canonicalUrl = canonicalUrl;

    model.toc_asset_id = model.toc_asset_id || model._tocPath;
    model.toc_rel = model._tocRel;

    if (model.breadcrumb_path && model._path) {
        model.breadcrumb_path = templateUtility.resolveSourceRelativePath(model.breadcrumb_path, model._path);
    }

    opCommon.resolvePdfUrlTemplate(model);
    var resetKeys = [
      "commands",
      "uid",
      "name",
      "usage",
      "description"
    ];
    model = opCommon.resetKeysAndSystemAttributes(model, resetKeys, true);

    chromeCommon.processMetadata(model, canonicalUrl);

    return {
        content: JSON.stringify(model)
    };
}