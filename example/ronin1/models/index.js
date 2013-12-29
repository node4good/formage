var _ = require('lodash-contrib'),
    path = require('path'),
    fs = require('fs'),
    mongoose = require('mongoose');

_(fs.readdirSync(__dirname))
    .map(function (file) { return path.basename(file, '.js'); })
    .without('index')
    .forEach(function (name) {
        var mod = require('./' + name);
        if (mod.prototype instanceof mongoose.Model)
            module.exports[name] = mod;
        else if (mod instanceof mongoose.Schema)
            module.exports[name] = mongoose.model(name, mod);
        else if (_.isObject(mod))
            _.assign(module.exports, mod);

    });
