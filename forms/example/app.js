var express = require('express'),
    mongoose = require('mongoose'),
    models = require('./models.js'),
    forms = require('../forms.js');

mongoose.connect('mongodb://localhost/forms_test');

var app = express();

app.use(express.bodyParser());
app.use(express.methodOverride());
app.set('views', require('path').join(__dirname, 'views'));
app.use(express.static(require('path').join(__dirname, '..', 'static')));

//var adm = new admin.Admin('/admin',app);

//adm.register_admin('books',new admin.MongooseAdminResource(models.Book,{list_fields:['id','name','author']}));
//adm.register_admin('authors',new admin.MongooseAdminResource(models.Author,{list_fields:['id','name']}));

app.get('/', function (req, res) {
    res.redirect('/new');
});

app.all('/new', function (req, res) {
    var form = new forms.MongooseForm(req, {
        empty: function (err) {
            res.render('form.ejs', {form: form});
        },
        success: function (err, result) {
            res.send('saved');
        },
        error: function (err) {
            res.render('form.ejs', {form: form});
        }
    }, models.Book);
});

//app.post('/new',function(req,res)
//{
//    var form = new forms.MongooseForm(req,{},models.Book);
//    form.is_valid(function(err,valid)
//    {
//        if(valid)
//        {
//            form.save(function(err,ent)
//            {
//                console.log(ent);
//                res.send('saved');
//            });
//        }
//        else
//        {
//            form.render_ready(function(err)
//            {
//                res.render('form.ejs',{form:form});
//            });
//        }
//    });
//});

app.post('/edit', function (req, res) {
    models.Book.findOne({}, function (err, book) {
        var form = new forms.MongooseForm(req, {instance: book}, models.Book);
        form.is_valid(function (err, valid) {
            if (valid) {
                form.save(function (err, ent) {
                    console.log(ent);
                    res.send('saved');
                });
            }
            else {
                form.render_ready(function (err) {
                    res.render('form.ejs', {form: form});
                });
            }
        });
    });
});

app.get('/edit', function (req, res) {
    models.Book.findOne({}, function (err, book) {
        var form = new forms.MongooseForm(req, {instance: book, exclude: ['genre']}, models.Book);
        form.render_ready(function (err) {
            res.render('form.ejs', {form: form});
        });
    });
});

app.listen(80);
console.log('up');