![](http://i.imgur.com/9vVHCPY.png) Formage [![Build Status](https://travis-ci.org/Empeeric/formage.png?branch=master)](https://travis-ci.org/Empeeric/formage)
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

require('formage').init(app, express);
```

Look at `\example` directory.

Options
------------
Here are some options you can set on the mongoose model.
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
    
    // list of fields that must be populated (see http://mongoosejs.com/docs/api.html#document_Document-populate)
    list_populate: ['album'],
    
    // list of fields on which full-text search is available
    search: ['title', 'album', 'artist']
};
```

#### Field options
```js
var schema = new mongoose.Schema({
    artist: { type: String, label: 'Who made it?' }
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
