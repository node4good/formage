'use strict';
var express = require('express'),
    _ = require('underscore');


// Dummy plug
var User = function() {};
User.fn = User.prototype;
User.permitted = function(role, model) {
    return true;
};


// Formage Admin Constructor
var Fa = module.exports = function(o) {
    o = o || {};
    this.models = {};
    this.title = o.title || 'Backoffice';
    this.user = new User;

    this.paths();
};
Fa.fn = Fa.prototype;


/*
    Statics methods
 */
// Singleton creator
Fa.create = function(o) {
    Fa.singleton = new Fa(o);

    return Fa.singleton.app;
};

// Pretty console.log
Fa.log = function(msg) {
    console.log('\x1b[36mFormage Admin\x1b[0m %s', msg);
};


/*
    Public methods
 */
// Create express
Fa.fn.paths = function() {
    var app = this.app = express();

    app.get('/', function(req, res) {
        res.send('Yeah');
    });

    Fa.log('is listening.');
};

// Close express
Fa.fn.close = function() {
    this.app.close();
};

// Register Mongoose models
/*
    model options:
        list: [ field ]
        sort: [ field ]
        is_single: bool
        populates: [ collection ]
        start: int
        limit: int
        form: Formage object
 */
Fa.fn.register = function(name, model, o) {
    o = _.extend({
        is_single: false,
        form: AdminForm
    }, o || {});

    this.models[name] = {
        name: name,
        model: model,
        options: o
    };
    // TODO: filters, permissions, actions

    Fa.log('registered model: ' + name);
};
Fa.fn.registerSingle = function(name, model, o) {
    o = o || {};
    o.is_single = true;

    this.register(name, model, o);
};

// Models getters
Fa.fn.getModels = function() {
    return _.filter(this.models, function(model) {
        return this.user.permitted('view', model.name);
    });
};
Fa.fn.getModel = function(name) {
    if (this.user.permitted('view', name))
        return this.models[name];
    else
        return new Error('You are not authorized to view model ' + model);
};

// Document list
Fa.fn.listDocuments = function(name, o, cb) {
    var model = this.models[name];

    if (!model.list)
        return cb(null, []);

    o.sort = o.sort ? _.uniq(o.sort.concat(model.options)) || [];
    o = _.extend({}, model.options, o);

    // TODO: filters

    var query = model.model.find();
    query.select.apply(query, model.list);

    if (o.sort)
        query.sort(o.sort);
    if (o.populates)
        o.populates.forEach(function(p) {
            query.populate(p);
        });
    if (o.start)
        query.skip(o.start);
    if (o.limit)
        query.limit(o.limit);

    return query.exec(cb);
};

// Get document
Fa.fn.getDocument = function(name, id, cb) {
    this.models[name].model.findById(id).exec(cb);
};

// Create document
Fa.fn.createDocument = function(req, name, cb) {
    if (!this.user.permitted('create', name))
        return cb('No authorization to create '+ name +' document');

    var model = this.models[name];

    var form = new model.form(req, { data: req.params }, model);
    form.is_valid(function(err, valid) {
        if (err)
            return cb(err);

        // TODO: validation
    });
};
