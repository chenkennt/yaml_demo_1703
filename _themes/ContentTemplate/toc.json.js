// Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license. See LICENSE file in the project root for full license information.
var common = require('./common.js');

exports.transform = function (model) {

  transformItem(model, 0);
  return {
    content: JSON.stringify(model.children)
  };

  function transformItem(item, level){
    item.toc_title = item.name;
    item.name = undefined;
    item.topicHref = undefined;

    if (item.items && item.items.length > 0){
      var children = [];
      var length = item.items.length;
      for (var i = 0; i<length; i++) {
        children.push(transformItem(item.items[i], level+1));
      };
      item.children = children;
      item.items = undefined;
    }
    return item;
  }
}
