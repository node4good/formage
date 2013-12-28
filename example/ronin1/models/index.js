var _ = require('lodash-contrib'),
    path = require('path'),
    fs = require('fs'),
    mongoose = require('mongoose');

_(fs.readdirSync(__dirname))
    .map(function (file) { return path.basename(file, '.js'); })
    .reject('index')
    .forEach(function (name) {
        var mod = require('./' + name);
        if (mod.model)
            module.exports[name] = mod;
        else if (_.isObject(mod))
            _.assign(module.exports, mod);
        else
            module.exports[name] = mongoose.model(name, mod);
    });
