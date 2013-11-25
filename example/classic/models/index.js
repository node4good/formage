var path = require('path'),
    fs = require('fs'),
    mongoose = require('mongoose'),
    files = fs.readdirSync(__dirname);

files.forEach(function(file) {
    var name = path.basename(file, '.js');
    if (name === 'index')
        return;

    var mod = require('./' + name);
    if (mod.model)
        module.exports[name] = mod;
    else
        module.exports[name] = mongoose.model(name, mod);
});
