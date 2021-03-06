// Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license. See LICENSE file in the project root for full license information.
var opCommon = require('./op.common.js');

exports.transform = function (model) {
  // Clean up unused predefined properties
  var resetKeys = [
    "newFileRepository",
    "_baseDirectory",
    "_displayLangs",
    "gitContribute",
    "_gitContribute"
  ];
  model = opCommon.resetKeysAndSystemAttributes(model, resetKeys, true);
  return {
    content: JSON.stringify(model)
  };
}
