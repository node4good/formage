'use strict';

var dep = require('../../lib/dependencies');

module.exports = {
    "0": function (test) {
        test.ok(true);
        test.done();
    },

    "no deps": function(test) {
        var models = {
            users: {},
            posts: {}
        };

        dep.check(models, 'users', 2341234, function(err, res) {
            console.log('result:', res);
            test.done(!!err);
        });
    },

    "one dep": function (test) {
        var id = 22512;

        var models = {
            users: {},
            posts: {
                model: {
                    schema: { paths: {
                        author: { options: { ref: 'users' } }
                    } },
                    find: function(query, cb) {
                        var res = models.posts.data.filter(function(item) {
                            return item.author == id;
                        });
                        cb(null, res);
                    }
                },
                data: [
                    { author: id },
                    { author: id },
                    { author: 2 }
                ]
            }
        };

        dep.check(models, 'users', 2341234, function(err, res) {
            console.log('result:', res);
            test.done(!!err);
        });
    },

    "two dep": function (test) {
        var id = 234298;

        var models = {
            users: {},
            message: {
                model: {
                    schema: { paths: {
                        from: { options: { ref: 'users' } },
                        to: { options: { ref: 'users' } }
                    } },
                    find: function(query, cb) {
                        console.log('query', query);
                        var res = models.message.data.filter(function(item) {
                            return item.from == id ||
                                item.to == id;
                        });
                        cb(null, res);
                    }
                },
                data: [
                    { from: id, to: 2 },
                    { from: 2, to: id }
                ]
            }
        };

        dep.check(models, 'users', id, function(err, res) {
            console.log('result:', res);
            test.done(!!err);
        });
    }
};


var registered_model = {
    "config": {
        "filters": [],
        "modelName": "config",
        "options": {
            "list": [
                "title",
                "email",
                "mail_sent.title"
            ],
            "list_populate": [],
            "cloneable": true,
            "section": "Configuration"
        },
        "label": "הגדרות",
        "is_single": true
    },
    "embed": {
        "filters": [],
        "modelName": "embed",
        "options": {
            "list": [
                "parent.child",
                "parent.child2",
                "number"
            ],
            "list_populate": [],
            "cloneable": true,
            "actions": [
                {
                    "value": "delete",
                    "label": "Delete"
                }
            ]
        },
        "label": "Embed"
    },
    "extend": {
        "filters": [],
        "modelName": "extend",
        "options": {
            "list": [
                "reversed",
                "two_d"
            ],
            "list_populate": [],
            "cloneable": true,
            "actions": [
                {
                    "value": "delete",
                    "label": "Delete"
                }
            ]
        },
        "label": "Extend"
    },
    "gallery": {
        "filters": [],
        "modelName": "gallery",
        "options": {
            "list": [
                "title",
                "picture",
                "file"
            ],
            "list_populate": [],
            "cloneable": true,
            "actions": [
                {
                    "value": "delete",
                    "label": "Delete"
                }
            ]
        },
        "label": "Gallery"
    },
    "geo": {
        "filters": [],
        "modelName": "geo",
        "options": {
            "list": ["map"],
            "list_populate": [],
            "cloneable": true,
            "actions": [
                {
                    "value": "delete",
                    "label": "Delete"
                }
            ]
        },
        "label": "Geo"
    },
    "lists": {
        "filters": [],
        "modelName": "lists",
        "options": {
            "list": [
                "fieldset.name",
                "fieldset.age"
            ],
            "list_populate": [],
            "cloneable": true,
            "actions": [
                {
                    "value": "delete",
                    "label": "Delete"
                }
            ]
        },
        "label": "Lists"
    },
    "pages": {
        "filters": [],
        "modelName": "pages",
        "options": {
            "list": [
                "title",
                "picture",
                "author"
            ],
            "list_populate": ["author"],
            "cloneable": true,
            "actions": [
                {
                    "value": "delete",
                    "label": "Delete"
                }
            ]
        },
        "label": "Pages"
    },
    "rate_filings": {
        "filters": [],
        "modelName": "rate_filings",
        "options": {
            "list": [
                "title",
                "data",
                "factors.BI"
            ],
            "list_populate": [],
            "cloneable": true,
            "actions": [
                {
                    "value": "delete",
                    "label": "Delete"
                }
            ]
        },
        "label": "Rate filings"
    },
    "spilon_user": {
        "filters": [],
        "modelName": "spilon_user",
        "options": {
            "list": [
                "is_rejected_during_alpha",
                "is_rejected_during_beta",
                "is_published"
            ],
            "list_populate": [
                "current_tier_id",
                "last_mission_played.mission_id",
                "fanclub.team_id",
                "fanclub.country_id",
                "last_mission_viewed.mission_id"
            ],
            "cloneable": true,
            "actions": [
                {
                    "value": "delete",
                    "label": "Delete"
                }
            ]
        },
        "label": "Spilon user"
    },
    "tests": {
        "filters": [
            {
                "key": "ref",
                "isString": false,
                "values": [
                    {
                        "value": "51e19aa8646812140e00000e",
                        "text": "a"
                    }
                ]
            }
        ],
        "modelName": "tests",
        "options": {
            "list": [
                "string",
                "date",
                "image"
            ],
            "list_populate": ["ref"],
            "cloneable": true,
            "filters": ["ref"],
            "order_by": ["order"],
            "sortable": "order",
            "actions": [
                {
                    "value": "delete",
                    "label": "Delete"
                }
            ]
        },
        "label": "Tests"
    },
    "users": {
        "filters": [],
        "modelName": "users",
        "options": {
            "list": [
                "name",
                "email"
            ],
            "list_populate": [],
            "cloneable": true,
            "order_by": ["order"],
            "sortable": "order",
            "actions": [
                {
                    "value": "delete",
                    "label": "Delete"
                }
            ]
        },
        "label": "Users"
    },
    "Admin Users": {
        "filters": [],
        "modelName": "Admin Users",
        "options": {
            "list": ["username"],
            "order_by": ["username"],
            "actions": [
                {
                    "value": "delete",
                    "label": "Delete"
                }
            ]
        },
        "label": "Admin Users"
    }
};
