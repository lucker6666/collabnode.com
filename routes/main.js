

exports.index = function (req, res) {
	res.render('boards');
};

exports.partials = function (req, res) {
  var name = req.params.name;
  res.render('partials/' + name);
};