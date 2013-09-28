<img src="http://i.imgur.com/9vVHCPY.png" align="top" />  Formage [![Build Status](https://travis-ci.org/Empeeric/formage.png?branch=master)](https://travis-ci.org/Empeeric/formage)
=============

[Bootstraped](http://twitter.github.com/bootstrap/) Admin Forms for MongoDB via [Mongoose](http://mongoosejs.com/),
originally forked from [mongoose-admin](https://github.com/marccampbell/mongoose-admin).

Usage
-----
[![npm install formage](https://nodei.co/npm/formage.png?downloads=true)](https://nodei.co/npm/formage/)
<!-- [![NPM](https://nodei.co/npm-dl/formage.png)](https://nodei.co/npm/formage/) -->
```js
var express = require('express'),
    app = express();

require('formage').init(app, express [, models, options]);
```

Look at `\example` directory.

Options
-------
```js
// Site-wide options, and their default values
require('formage').init(app, express, models, {
    title: 'Admin',
    root: '/admin',
    default_section: 'main',
    username: 'admin',
    password: 'admin',
    admin_users_gui: ture
);
```

#### Model options
```js
var model = new mongoose.model('songs', schema);

model.label = 'My Songs';
model.singular = 'Song';

// external files specific to this model
model.static = {
   js: [ '/js/songs.js' ],
   css: ['/css/songs.css' ]
};

// one-document models
model.single = true;

model.formage = {
    filters: ['artist', 'year'],

    // additional actions on this model
    actions: [
       {
          value: 'release',
          label: 'Release',
          func: function (user, ids, callback) {
             console.log('You just released songs ' + ids);
             callback();
          }
       }
    ],

    // list of fields to be displayed by formage for this model
    list: ['number', 'title', 'album', 'artist', 'year'],

    // list of order fields
    order_by: ['-year', 'album', 'number'],

    // list of fields that must be populated
    // (see http://mongoosejs.com/docs/api.html#document_Document-populate)
    list_populate: ['album'],

    // list of fields on which full-text search is available
    search: ['title', 'album', 'artist']
};
```

#### Field options
```js
var schema = new mongoose.Schema({
    artist: { type: String, label: 'Who made it?' },
    // lang is a two letter ISO 639-1 code as recognized by google
    location: { type: Schema.Types.GeoPoint, widget_options: {lang: 'nl'}}
});
```
[ISO 639-1](http://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)

#### Extending
``` js
var ReversedWidget = formage.widgets.TextWidget.extend({
    render: function (res) {
        this.value = this.value.split("").reverse().join("");
        this.attrs.style = '-moz-transform: scale(-1, 1); -webkit-transform: scale(-1, 1); transform: scale(-1, 1);';
        this._super(res);
    }
});

var ReversedField = formage.fields.StringField.extend({
    init: function (options) {
        options = options || {};
        options.widget = ReversedWidget;
        this._super(options);
    },
    clean_value: function (req, callback) {
        this.value = this.value.split("").reverse().join("");
        this._super(req, callback);
    }
});

var schema = new mongoose.Schema({
    reversed: { type: String, formageField: ReversedField}
});
```
Shout-out to my man @jrowny

---

If we want to have a complex underlining type we need to "lie" to mongoose

```js
var TwoDWidget = formage.widgets.TextWidget.extend({
    render: function (res) {
        var value = this.value || {};
        var lat = value.lat;
        var lng = value.lng;
        var name = this.name;
        this.name = name + '_lat';
        this.value = lat;
        this._super(res);
        this.name = name + '_lng';
        this.value = lng;
        this._super(res);
    }
});


var TwoDField = formage.fields.StringField.extend({
    init: function (options) {
        options = options || {};
        options.widget = TwoDWidget;
        this._super(options);
    },
    to_schema: function () {
        return {
            lat: Number,
            lng: Number
        };
    },
    clean_value: function (req, callback) {
        var lat = Number(req.body[this.name + '_lat']);
        var lng = Number(req.body[this.name + '_lng']);
        this.value = { lat: lat, lng: lng};
        this._super(req, callback);
    }
});
var TwoD = function TwoD(path, options) {
    TwoD.super_.call(this, path, options);
};
util.inherits(TwoD, Schema.Types.Mixed);
Types.TwoD = Object;
Schema.Types.TwoD = TwoD;

var schema = new mongoose.Schema({
    two_d: { type: TwoD, formageField: TwoDField}
});
```

License
-------
MIT

Sponsor
--------
<a id="stormlogo" href="http://www.jetbrains.com/webstorm/" alt="Smart IDE for web development with HTML Editor, CSS &amp; JavaScript support" title="Smart IDE for web development with HTML Editor, CSS &amp; JavaScript support">
  ![](http://i.imgur.com/ynQ6c.png)
</a>
