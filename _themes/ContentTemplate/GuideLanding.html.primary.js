exports.transform = function (model) {
  // set href's id and update href
  if (model.items) model.items.forEach(function (part) {
    if (part.items) part.items.forEach(function (step) {
      step.id = step.href;
      var index = step.id.indexOf('.md');
      if (index != -1) {
        step.id = step.id.substr(0, index);
      }
      // step.href = step.id + '.html';
      step.href = step.id // workaround to fix .html not found issue in ppe
    });
  });

  // for js use
  model.stringified = JSON.stringify(model);

  return model;
}
