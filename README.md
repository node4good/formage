![](http://i.imgur.com/9vVHCPY.png) Formage Admin
=============

[Bootstraped](http://twitter.github.com/bootstrap/) admin forms for [Mongoose](http://mongoosejs.com/),
originally forked from [mongoose-admin](https://github.com/marccampbell/mongoose-admin).

Usage
-----
`npm install formage-admin`

```javascript
var admin = require('formage-admin').init(app, express);
```

Also, look at `\example` directory.

Some Options
------------
```javascript
// model options
model.label = 'My Songs';
model.singular = 'Song';
model.static = {
   js: [ '/js/songs.js' ],
   css: ['/css/songs.css' ]
};
model.formage = {
    filters: ['artist', 'year'],
    
    // Additional actions on this model
    actions: [
       {
          value: 'foo',
          label: 'Foo',
          func: function (user, ids, callback) {
             console.log('Foo models ' + ids);
             callback();
          }
       }
    ],
    
    // list of fields to be displayed by formage for this model
    list: ['foo', 'bar', 'field1', 'field2'],
    
    // list of order fields
    order_by: ['bar'],
    
    // list of fields that must be populated (see http://mongoosejs.com/docs/api.html#document_Document-populate)
    list_populate: ['field1']
};

// one-document models
model.single = true;

// field options
field.label = 'Song Title';
```

Sponsors
========
<a id="stormlogo" href="http://www.jetbrains.com/webstorm/" alt="Smart IDE for web development with HTML Editor, CSS &amp; JavaScript support" title="Smart IDE for web development with HTML Editor, CSS &amp; JavaScript support">
  ![](http://i.imgur.com/ynQ6c.png)
</a>
