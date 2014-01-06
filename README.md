<img src="http://i.imgur.com/9vVHCPY.png" align="top" />  Formage

[![Build Status](https://travis-ci.org/Empeeric/formage.png?branch=master "Build Status")](https://travis-ci.org/Empeeric/formage) 
[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/Empeeric/formage/trend.png "Bitdeli Badge")](https://bitdeli.com/free) 
[![githalytics.com alpha](https://cruel-carlota.pagodabox.com/b3ef5b297ff96ba6b5c573e376debd1d "githalytics.com")](http://githalytics.com/Empeeric/formage) 

=============

[Bootstraped](http://twitter.github.com/bootstrap/) Admin GUI addon for [Mongoose](http://mongoosejs.com/), [JugglingDB](https://github.com/1602/jugglingdb), or just as a form generator.
Originally forked from [mongoose-admin](https://github.com/marccampbell/mongoose-admin).

Example Usage
-----
[![npm install formage](https://nodei.co/npm/formage.png?downloads=true)](https://nodei.co/npm/formage/)
<!-- [![NPM](https://nodei.co/npm-dl/formage.png)](https://nodei.co/npm/formage/) -->
```js
var express = require('express'),
    app = express();

require('formage').init(app, express [, models, options]);
```

Look at the `\example` directory.

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
    admin_users_gui: true
);
```

#### Model options
```js
var model = new mongoose.model('songs', schema);

// external files specific to this model
model.header_lines = [
   '<script src="/js/songs.js"></script>',
   '<style href="/css/songs.css"></style>'
];

model.formage = {
    // one-document models
    is_single: true,

    // labels
    label: 'My Songs',
    singular: 'Song',

    filters: ['artist', 'year'],

    // additional actions on this model
    actions: [
       {
          id: 'release',
          label: 'Release',
          func: function (user, ids, callback) {
             console.log('You just released songs ' + ids);
             callback();
          }
       }
    ],

    // list of fields to be displayed by formage for this model
    list: ['number', 'title', 'album', 'artist', 'year'],
    
    // order documents, save order in this field (type: Number)
    sortable: 'order',

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
