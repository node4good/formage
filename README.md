# <img src="http://i.imgur.com/9vVHCPY.png" align="top" /> Formage 

[Bootstraped](http://twitter.github.com/bootstrap/) Admin GUI addon for [Mongoose](http://mongoosejs.com/), [JugglingDB](https://github.com/1602/jugglingdb), or just as a form generator.
Originally forked from [mongoose-admin](https://github.com/marccampbell/mongoose-admin).

[![Build Status](https://travis-ci.org/Empeeric/formage.png?branch=master "Build Status")](https://travis-ci.org/Empeeric/formage) 

<!-- [![NPM](https://nodei.co/npm-dl/formage.png)](https://nodei.co/npm/formage/) -->

## Example Usage
```js
var express = require('express'),
    app = express();

require('formage').init(app, express, models]);
```

Look at the `\example` directory.

### Options
```js
// Site-wide options, and their default values
require('formage').init(app, express, models, {
    title: 'Admin',
    root: '/admin',
    default_section: 'main',
    username: 'admin',
    password: 'admin',
    admin_users_gui: true
});
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

#### Fields
Formage comes with the following built-in fields,
but [custom fields](https://github.com/Empeeric/formage/wiki/Custom-Fields) can be written if needed.
- String
- Boolean
- Number
- Date
- Time
- Enum ([select2](http://ivaynberg.github.io/select2/))
- Ref ([select2](http://ivaynberg.github.io/select2/))
- Text (`<textarea>`)
- HTML ([ckeditor](http://ckeditor.com/))
- FilePicker ([File Picker](https://www.inkfilepicker.com/))
- Picture ([Cloudinary](http://cloudinary.com/))
- GeoPoint ([Google Maps](https://maps.google.com/))

You can pass options to the underlying fields and widgets:
```js
var schema = new mongoose.Schema({
    artist: { type: String, label: 'Who made it?' },
    location: { type: Schema.Types.GeoPoint, widget_options: { lang: 'nl' }}
});
```
(The map widget lang setting is a two-letter [ISO 639-1](http://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) code.)

#### Hmm
- [Extend formage with your custom field](https://github.com/Empeeric/formage/wiki/Custom-Fields)
- [Embed a formage form outside of the admin](https://github.com/Empeeric/formage/wiki/Outing-Formage-Form)

License
-------
MIT

Sponsor
--------
<a id="stormlogo" href="http://www.jetbrains.com/webstorm/" alt="Smart IDE for web development with HTML Editor, CSS &amp; JavaScript support" title="Smart IDE for web development with HTML Editor, CSS &amp; JavaScript support">
  ![](http://i.imgur.com/ynQ6c.png)
</a>
