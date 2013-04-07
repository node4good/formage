![](http://i.imgur.com/9vVHCPY.png)

Formage Admin
=============

[Bootstraped](http://twitter.github.com/bootstrap/) admin forms for [Mongoose](http://mongoosejs.com/),
originally forked from [mongoose-admin](https://github.com/marccampbell/mongoose-admin).

Usage
-----
`npm install formage-admin`

```javascript
var admin = require('formage-admin').init(app, express, require('./models'), {
    title: 'Backoffice'
});
```

Also, look at `\example` directory.

Some Options
------------
```javascript
\\ model options
model.label = 'My Songs';
model.singular = 'Song';
model.static = {
   js: [ '/js/songs.js' ],
   css: ['/css/songs.css' ]
};

\\ field options
field.label = 'Song Title';
```

Sponsors
========
<hr />
<a id="stormlogo" href="http://www.jetbrains.com/webstorm/" alt="Smart IDE for web development with HTML Editor, CSS &amp; JavaScript support" title="Smart IDE for web development with HTML Editor, CSS &amp; JavaScript support">
  ![](http://i.imgur.com/ynQ6c.png)
</a>
