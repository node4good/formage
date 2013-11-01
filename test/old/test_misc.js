'use strict';
Error.stackTraceLimit = Infinity;
var express = require('express');
var request = require('request');
//var supertest = require('supertest');
var mongoose = require('mongoose');
require.main.require = require;
//var app = require('../example/app').app;
var _ = require('lodash');


module.exports = {
    "init": function (test) {
        test.ok(true);
        test.done();
    },


    "test something in lodash": function (test) {
        var obj = {"list":{"schema":{"paths":{"name":{"enumValues":[],"regExp":null,"path":"name","instance":"String","validators":[[null,"required"]],"setters":[],"getters":[],"options":{"required":true},"_index":null,"isRequired":true},"list":{"schema":{"paths":{"name":{"enumValues":[],"regExp":null,"path":"name","instance":"String","validators":[],"setters":[],"getters":[],"options":{},"_index":null},"_id":{"path":"_id","instance":"ObjectID","validators":[],"setters":[null],"getters":[],"options":{"auto":true},"_index":null}},"subpaths":{},"virtuals":{"id":{"path":"id","getters":[null],"setters":[],"options":{}}},"nested":{},"inherits":{},"callQueue":[],"_indexes":[],"methods":{},"statics":{},"tree":{"_id":{"auto":true},"id":{"path":"id","getters":[null],"setters":[],"options":{}}},"_requiredpaths":[],"options":{"id":true,"noVirtualId":false,"_id":true,"noId":false,"read":null,"shardKey":null,"autoIndex":true,"minimize":true,"versionKey":"__v","capped":false,"bufferCommands":true,"strict":true}},"caster":{"_id":"51dc4050df0fd95431000003"},"path":"list","validators":[],"setters":[],"getters":[],"options":{"type":[{}]},"_index":null},"_id":{"path":"_id","instance":"ObjectID","validators":[],"setters":[null],"getters":[],"options":{"auto":true},"_index":null}},"subpaths":{},"virtuals":{"id":{"path":"id","getters":[null],"setters":[],"options":{}}},"nested":{},"inherits":{},"callQueue":[],"_indexes":[],"methods":{},"statics":{},"tree":{"name":{"required":true},"list":[{}],"_id":{"auto":true},"id":{"path":"id","getters":[null],"setters":[],"options":{}}},"_requiredpaths":["name"],"options":{"id":true,"noVirtualId":false,"_id":true,"noId":false,"read":null,"shardKey":null,"autoIndex":true,"minimize":true,"versionKey":"__v","capped":false,"bufferCommands":true,"strict":true}},"caster":{"_id":"51dc4050df0fd95431000004","list":[]},"path":"list","validators":[],"setters":[],"getters":[],"options":{"type":[{"name":{"required":true},"list":[{}]}]},"_index":null},"ref":{"path":"ref","instance":"ObjectID","validators":[[null,"required"]],"setters":[],"getters":[],"options":{"ref":"pages","required":true},"_index":null,"isRequired":true},"string":{"enumValues":[],"regExp":null,"path":"string","instance":"String","validators":[[null,"required"]],"setters":[],"getters":[],"options":{"required":true},"_index":null,"isRequired":true},"date":{"path":"date","validators":[[null,"required"]],"setters":[],"getters":[],"options":{"required":true},"_index":null,"isRequired":true},"date2":{"path":"date2","validators":[[null,"required"]],"setters":[],"getters":[],"options":{"required":true},"_index":null,"isRequired":true},"time":{"enumValues":[],"regExp":null,"path":"time","instance":"String","validators":[],"setters":[],"getters":[],"options":{},"_index":null},"enum":{"enumValues":["1","2","3"],"regExp":null,"path":"enum","instance":"String","validators":[[null,"enum"],[null,"required"]],"setters":[],"getters":[],"options":{"enum":["1","2","3"],"required":true},"_index":null,"isRequired":true},"rich_text":{"enumValues":[],"regExp":null,"path":"rich_text","instance":"String","validators":[[null,"required"]],"setters":[],"getters":[],"options":{"required":true},"_index":null,"isRequired":true},"text":{"enumValues":[],"regExp":null,"path":"text","instance":"String","validators":[[null,"required"]],"setters":[],"getters":[],"options":{"required":true},"_index":null,"isRequired":true},"image":{"path":"image","validators":[[null,"required"]],"setters":[],"getters":[],"options":{"required":true},"_index":null,"isRequired":true},"map":{"path":"map","validators":[[null,"required"]],"setters":[],"getters":[],"options":{"required":true},"_index":null,"isRequired":true},"num":{"path":"num","instance":"Number","validators":[[null,"required"]],"setters":[],"getters":[],"options":{"required":true},"_index":null,"isRequired":true},"order":{"path":"order","instance":"Number","validators":[],"setters":[],"getters":[],"options":{"editable":false},"_index":null},"bool":{"path":"bool","validators":[],"setters":[],"getters":[],"options":{"default":true},"_index":null,"defaultValue":true},"object.object.object.string":{"enumValues":[],"regExp":null,"path":"object.object.object.string","instance":"String","validators":[[null,"required"]],"setters":[],"getters":[],"options":{"required":true},"_index":null,"isRequired":true},"spilon_steps":{"schema":{"paths":{"rewards.xp":{"path":"rewards.xp","instance":"Number","validators":[],"setters":[],"getters":[],"options":{"default":0},"_index":null,"defaultValue":0},"rewards.cash.min":{"path":"rewards.cash.min","instance":"Number","validators":[[null,"min"]],"setters":[],"getters":[],"options":{"min":0,"default":0},"_index":null,"defaultValue":0},"rewards.cash.max":{"path":"rewards.cash.max","instance":"Number","validators":[[null,"min"]],"setters":[],"getters":[],"options":{"min":0,"default":0},"_index":null,"defaultValue":0},"rewards.tokens.min":{"path":"rewards.tokens.min","instance":"Number","validators":[[null,"min"]],"setters":[],"getters":[],"options":{"min":0,"default":0},"_index":null,"defaultValue":0},"rewards.tokens.max":{"path":"rewards.tokens.max","instance":"Number","validators":[[null,"min"]],"setters":[],"getters":[],"options":{"min":0,"default":0},"_index":null,"defaultValue":0},"rewards.morale.min":{"path":"rewards.morale.min","instance":"Number","validators":[[null,"min"]],"setters":[],"getters":[],"options":{"min":0,"default":0},"_index":null,"defaultValue":0},"rewards.morale.max":{"path":"rewards.morale.max","instance":"Number","validators":[[null,"min"]],"setters":[],"getters":[],"options":{"min":0,"default":0},"_index":null,"defaultValue":0},"rewards.reputation.min":{"path":"rewards.reputation.min","instance":"Number","validators":[[null,"min"]],"setters":[],"getters":[],"options":{"min":0,"default":0},"_index":null,"defaultValue":0},"rewards.reputation.max":{"path":"rewards.reputation.max","instance":"Number","validators":[[null,"min"]],"setters":[],"getters":[],"options":{"min":0,"default":0},"_index":null,"defaultValue":0},"rewards.intimidation.min":{"path":"rewards.intimidation.min","instance":"Number","validators":[[null,"min"]],"setters":[],"getters":[],"options":{"min":0,"default":0},"_index":null,"defaultValue":0},"rewards.intimidation.max":{"path":"rewards.intimidation.max","instance":"Number","validators":[[null,"min"]],"setters":[],"getters":[],"options":{"min":0,"default":0},"_index":null,"defaultValue":0},"rewards.members.min":{"path":"rewards.members.min","instance":"Number","validators":[[null,"min"]],"setters":[],"getters":[],"options":{"min":0,"default":0},"_index":null,"defaultValue":0},"rewards.members.max":{"path":"rewards.members.max","instance":"Number","validators":[[null,"min"]],"setters":[],"getters":[],"options":{"min":0,"default":0},"_index":null,"defaultValue":0},"loot.items":{"schema":{"paths":{"item_id":{"path":"item_id","instance":"ObjectID","validators":[[null,"required"]],"setters":[],"getters":[],"options":{"ref":"pages","required":true},"_index":null,"isRequired":true},"amount":{"path":"amount","instance":"Number","validators":[[null,"min"]],"setters":[],"getters":[],"options":{"min":0,"default":0},"_index":null,"defaultValue":0},"percent":{"path":"percent","instance":"Number","validators":[[null,"min"],[null,"max"]],"setters":[],"getters":[],"options":{"min":0,"max":100,"default":0},"_index":null,"defaultValue":0},"is_mandatory":{"path":"is_mandatory","validators":[],"setters":[],"getters":[],"options":{"default":false},"_index":null,"defaultValue":false},"_id":{"path":"_id","instance":"ObjectID","validators":[],"setters":[null],"getters":[],"options":{"auto":true},"_index":null}},"subpaths":{},"virtuals":{"id":{"path":"id","getters":[null],"setters":[],"options":{}}},"nested":{},"inherits":{},"callQueue":[],"_indexes":[],"methods":{},"statics":{},"tree":{"item_id":{"required":true,"ref":"pages"},"amount":{"default":0,"min":0},"percent":{"default":0,"max":100,"min":0},"is_mandatory":{"default":false},"_id":{"auto":true},"id":{"path":"id","getters":[null],"setters":[],"options":{}}},"_requiredpaths":["item_id"],"options":{"id":true,"noVirtualId":false,"_id":true,"noId":false,"read":null,"shardKey":null,"autoIndex":true,"minimize":true,"versionKey":"__v","capped":false,"bufferCommands":true,"strict":true}},"caster":{"_id":"51dc4050df0fd95431000005","is_mandatory":false,"percent":0,"amount":0},"path":"loot.items","validators":[],"setters":[],"getters":[],"options":{"type":[{"item_id":{"ref":"pages","required":true},"amount":{"min":0,"default":0},"percent":{"min":0,"max":100,"default":0},"is_mandatory":{"default":false}}]},"_index":null},"action_word":{"enumValues":[],"regExp":null,"path":"action_word","instance":"String","validators":[],"setters":[],"getters":[],"options":{},"_index":null},"_id":{"path":"_id","instance":"ObjectID","validators":[],"setters":[null],"getters":[],"options":{"auto":true},"_index":null}},"subpaths":{},"virtuals":{"id":{"path":"id","getters":[null],"setters":[],"options":{}}},"nested":{"rewards":true,"rewards.cash":true,"rewards.tokens":true,"rewards.morale":true,"rewards.reputation":true,"rewards.intimidation":true,"rewards.members":true,"loot":true},"inherits":{},"callQueue":[],"_indexes":[],"methods":{},"statics":{},"tree":{"rewards":{"xp":{"default":0},"cash":{"min":{"default":0,"min":0},"max":{"default":0,"min":0}},"tokens":{"min":{"default":0,"min":0},"max":{"default":0,"min":0}},"morale":{"min":{"default":0,"min":0},"max":{"default":0,"min":0}},"reputation":{"min":{"default":0,"min":0},"max":{"default":0,"min":0}},"intimidation":{"min":{"default":0,"min":0},"max":{"default":0,"min":0}},"members":{"min":{"default":0,"min":0},"max":{"default":0,"min":0}}},"loot":{"items":[{"is_mandatory":{"default":false},"percent":{"default":0,"max":100,"min":0},"amount":{"default":0,"min":0},"item_id":{"required":true,"ref":"pages"}}]},"action_word":{},"_id":{"auto":true},"id":{"path":"id","getters":[null],"setters":[],"options":{}}},"_requiredpaths":[],"options":{"id":true,"noVirtualId":false,"_id":true,"noId":false,"read":null,"shardKey":null,"autoIndex":true,"minimize":true,"versionKey":"__v","capped":false,"bufferCommands":true,"strict":true}},"caster":{"_id":"51dc4050df0fd95431000006","loot":{"items":[]},"rewards":{"members":{"max":0,"min":0},"intimidation":{"max":0,"min":0},"reputation":{"max":0,"min":0},"morale":{"max":0,"min":0},"tokens":{"max":0,"min":0},"cash":{"max":0,"min":0},"xp":0}},"path":"spilon_steps","validators":[],"setters":[],"getters":[],"options":{"type":[{"rewards":{"xp":{"default":0},"cash":{"min":{"min":0,"default":0},"max":{"min":0,"default":0}},"tokens":{"min":{"min":0,"default":0},"max":{"min":0,"default":0}},"morale":{"min":{"min":0,"default":0},"max":{"min":0,"default":0}},"reputation":{"min":{"min":0,"default":0},"max":{"min":0,"default":0}},"intimidation":{"min":{"min":0,"default":0},"max":{"min":0,"default":0}},"members":{"min":{"min":0,"default":0},"max":{"min":0,"default":0}}},"loot":{"items":[{"item_id":{"ref":"pages","required":true},"amount":{"min":0,"default":0},"percent":{"min":0,"max":100,"default":0},"is_mandatory":{"default":false}}]},"action_word":{}}]},"_index":null},"_id":{"path":"_id","instance":"ObjectID","validators":[],"setters":[null],"getters":[],"options":{"auto":true},"_index":null},"__v":{"path":"__v","instance":"Number","validators":[],"setters":[],"getters":[],"options":{},"_index":null}};
        var modelName = 'pages';
        var obj2 = [{options: {ref: modelName}}];
        var res = _.filter(obj, {'options.ref': modelName});
        var res2 = _.filter(obj2, {'options.ref': modelName});
        var res3 = _.filter(obj, function (innerModel) {return innerModel.options.ref == modelName;});
        var res4 = _.filter(obj2, function (innerModel) {return innerModel.options.ref == modelName;});
        var res5 = res3.map(_.partialRight(_.object, '333'));
        test.done();
    },

//    "http": function (test) {
//        test.expect(1);
//        nodeunit.utils.httputil(app.router, function (server, client) {
//            client.fetch('GET', '/', {}, function (resp) {
//                test.equals('hello world', resp.body);
//                test.done();
//            });
//        });
//    },


//    "Test Path shit": function (test) {
//        var url_join = require('../paths.js').testable_url_join;
//        test.equal(url_join(), '.', 'Empty Args');
//        test.equal(url_join(''), '.', 'empty string');
//        test.equal(url_join('/'), '/', 'Just root');
//        test.equal(url_join('/', '/'), '/', 'Empty Args');
//        test.equal(url_join('/s', '/'), '/s/', 'Empty Args');
//        test.equal(url_join('/s', '/g'), '/s/g', 'Empty Args');
//        test.equal(url_join('/s', '/g', ''), '/s/g', 'Empty Args');
//        test.equal(url_join('/s', '/g', '/'), '/s/g/', 'Empty Args');
//        test.equal(url_join('/s', '/g', '/g'), '/s/g/g', 'Empty Args');
//        test.equal(url_join('/s', 'g', '/g'), '/s/g/g', 'Empty Args');
//        test.equal(url_join('/s', '/g', 'g'), '/s/g/g', 'Empty Args');
//        test.equal(url_join('/s', 'g', 'g'), '/s/g/g', 'Empty Args');
//        test.equal(url_join('s', 'g', 'g'), 's/g/g', 'Empty Args');
//        test.equal(url_join('s', 'g', 'g'), 's/g/g', 'Empty Args');
//        test.equal(url_join(null, 'g'), 'g', 'Empty Args');
//        test.equal(url_join(null, 'g', 'g'), 'g/g', 'Empty Args');
//        test.done();
//    },


    "For the trick in AdminForm.index": function (test) {
        test.ok('gaga' in {'gigi': 1, 'gogo': 1, 'gaga': 1} === true, "In array");
        test.ok(Boolean(['gigi', 'gogo', 'gaga'].indexOf('gaga')) === true, "Might be a bug");
        test.ok(Boolean(['gigi', 'gogo', 'gaga'].indexOf('gigi')) === false, "When first it's false");
        test.ok(['gigi', 'gogo', 'gaga'].indexOf('gagu') === -1, "Not in array");
        test.ok(Boolean(['gigi', 'gogo', 'gaga'].indexOf('xxx')) !== false, "-1 when not in array");
        test.ok(Boolean(~['gigi', 'gogo', 'gaga'].indexOf('gigi')) === true, "Binary not");
        test.done();
    },


    "Minimal Mock to init": function (test) {
        var admin_module = require('..');

        var mock_mongoose = {
            model: function () {
            },
            Schema: function () {
                this.methods = {}
            }
        };

        //noinspection JSUnresolvedFunction
        var mock_app = {
            get: sinon.spy(),
            post: sinon.spy(),
            delete: sinon.spy(),
            use: sinon.spy()
        };

        var admin = admin_module.createAdmin(mock_app, null, mock_mongoose);
        test.done();
    },


    "Init with real app": function (test) {
        var express = require('express');
        var admin_module = require('..');

        var mock_mongoose = {
            model: function () {
            },
            Schema: function () {
                this.methods = {}
            }
        };

        var app = express();
        var admin = admin_module.createAdmin(app, null, mock_mongoose);
        var server = app.listen(3456, function () {
            server.close();
            test.done();
        });
    },


    "Init with supertest app": function (test) {
        var express = require('express');
        var admin_module = require('..');

        var mock_mongoose = {
            model: function () {
            },
            Schema: function () {
                this.methods = {}
            }
        };

        var app = express();
        var admin = admin_module.createAdmin(app, null, mock_mongoose);
        var server = supertest(app).get('/')
            .expect('Content-Type', 'text/html')
            .expect('Content-Length', '20')
            .expect(200)
            .end(function (err, res) {
                //test.equal(err, null);
                test.ok(res);
                test.done();
            });
    },



    "Mock test first page": function (test) {
        var admin_module = require('..');

        var mock_mongoose = {
            model: function () {},
            Schema: function () {
                this.methods = {}
            }
        };

        var app = express();
        var admin = admin_module.createAdmin(app, null, mock_mongoose);

        var mock_req = {session: {_mongooseAdminUser: {}}};
        var mock_res = {};
        app.admin_app.routes.get[0].callbacks[0](mock_req, mock_res, sinon.spy());
    }
};


