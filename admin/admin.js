var util = require('util')
    ,mongoose = require('mongoose')
    ,forms = require('./forms')
    ,express = require('express')
    ,Models = require('../Models');




function make_admin_auth(root_path)
{
    return function(req,res,next)
    {
        console.log('in admin auth');
        if(req.session.admin)
            next();
        else
            res.redirect('/' + root_path + 'login/?next=' + req.path);
    };
}

var register_admin = exports.register_admin = function(admin,auth)
{
    return {
        show : function(req,res) { return admin.show(req,res,auth); },
        index : function(req,res) { return admin.index(req,res); },
        new : function(req,res) { return admin.new(req,res,auth); },
        edit : function(req,res) { return admin.edit(req,res,auth); },
        create : function(req,res) {
            var method = req.body._method.toLowerCase();
            if(method == 'put')
                return admin.update(req,res,auth);
            if(method == 'delete')
                return admin.delete(req,res,auth);
            if(method == 'none')
                return admin.show(req,res,auth);
            return admin.create(req,res,auth);
        },
        update : function(req,res) { return admin.update(req,res,auth); },
        delete : function(req,res) { return admin.delete(req,res,auth); },
        load: function(req,id,fn) { return admin.load(req,id,fn); }
    };
};

var Admin = exports.Admin = function(path,app,options)
{
    app.set('views', __dirname + '/views');
    this.path = path;
    if(this.path[this.path.length-1] != '/')
        this.path += '/';
    if(this.path[0] == '/')
        this.path = this.path.substr(1);
    this.name = this.path.replace('/','');
    this.app = app;
    this.resources = [];
    options = options || {};
    var self = this;
    this.app.get(path,function(req,res)
    {
        res.render('admin_main',{resources:self.resources});
    },make_admin_auth(this.path));
    this.app.get('/' + path + 'login/',function(req,res){

    });
    this.app.post('/' + path + 'login/',function(req,res){
        req.session.admin = true;
        req.session.save(function(err)
        {
           res.redirect(req.query.next || self.path);
        });
    });
};

Admin.prototype.register_admin = function(names,resource)
{
    this.resources.push(names);
    this.app.resource(this.path + names,register_admin(resource,make_admin_auth(this.path)));
    console.log(this.path + names);
}


var MongooseAdminResource = exports.MongooseAdminResource = function(model,options)
{
    this.model = model;
    this.fields = null;
    var self = this;
    options = options || {};
    this.list_fields = options.list_fields;
    this.form = function(options)
    {
        console.log(options);
        self.form.super_.call(this,options,self.model);
    };
    util.inherits(this.form,forms.MongooseForm);

};
MongooseAdminResource.prototype.load = function(req,id,fn)
{
    req._id = id;
    fn(null,id);
};

MongooseAdminResource.prototype.index = function(req,res)
{
    var self = this;
    this.model.find({},function(err,objects)
    {
        if(err)
            self.internal_error(err,req,res);
        else
        {
            res.render('admin_index',{objects:objects,model:self.model,list_fields:self.list_fields});
        }
    });
};

MongooseAdminResource.prototype.edit = function(req,res)
{
    var self = this;
    var id = req._id;
    this.model.findById(id,function(err,object)
    {
        if(err)
            self.internal_error(err,req,res);
        else
        {
            var form = new self.form({instance:object});
            self.render_edit_form(form,{action:req.path.replace('edit',''),method:'PUT',status:'edit'},res);
        }
    });
};

var ejs = require('ejs')
    ,fs = require('fs');

MongooseAdminResource.prototype.render_edit_form = function(form,context,res)
{
//    var stream = new Buffer(16096);
//    var pointer = 0;
//    var stream_res = {
//        write:function(stuff)
//        {
//            pointer += stream.write(stuff,pointer, encoding='utf8');
//        }
//    };
    form.render_ready(function(err)
    {
        if(err)
            res.send('error',500);
        else
        {
            res.write(ejs.render(fs.readFileSync(__dirname + '/views/admin_edit_top.ejs', 'ascii'),context));
            form.render(res);
            res.write(ejs.render(fs.readFileSync(__dirname + '/views/admin_edit_bottom.ejs', 'ascii'),context));
            res.end();
        }
    });
};

MongooseAdminResource.prototype.update = function(req,res)
{
    var self = this;
    var fields = req.body;
    this.model.findById(req._id,function(err,object)
    {
        if(err)
            self.internal_error(err,req,res);
        else
        {
            var form = new self.form({instance:object,data:fields});
            if(form.is_valid())
            {
                form.save(function(err,object)
                {
                    if(err)
                        self.render_edit_form(form,{action:req.path,method:'PUT',status:'failed'},res);
                    else
                        self.render_edit_form(form,{action:req.path,method:'None',status:'done'},res);

                });
            }
            else
                self.render_edit_form(form,{action:req.path,method:'None',status:'done'},res);
        }
    });
};

MongooseAdminResource.prototype.new = function(req,res)
{
    var self = this;
    var form = new this.form();
    self.render_edit_form(form,{action:req.path.replace('new',''),method:'POST',status:'edit',is_new:true},res);
};

MongooseAdminResource.prototype.create = function(req,res)
{
    var self = this;
    var form = new this.form({data:req.body});
    if(form.is_valid())
    {
        form.save(function(err)
        {
           if(err)
               self.render_edit_form(form,{action:req.path,method:'POST',status:'failed',is_new:true},res);
           else
               self.render_edit_form(form,{action:req.path,method:'POST',status:'done',is_new:true},res);
        });
    }
    else
        self.render_edit_form(form,{action:req.path,method:'POST',status:'failed',is_new:true},res);
};

MongooseAdminResource.prototype.delete = function(req,res)
{
    var self = this;
    this.model.findById(req._id,function(err,object)
    {
        if(err)
            self.interal_error(err,req,res);
        else
           object.delete(err,function(err)
           {
                if(err)
                    self.internal_error(err,req,res);
                else
                    res.render('admin_deleted',{});
           });
    });
};

//function render_field(field, model, object,data,refs)
//{
//    if( field.options.type == mongoose.Schema.ObjectId)
//    {
//        return render_ref_field(field,model,object,data,refs);
//    }
//    if(field.options.enum)
//    {
//        return render_enum_field(field,model,object,data);
//    }
//    if(field.options.type == Boolean)
//    {
//        return render_boolean_field(field,model,object,data);
//    }
//    return render_text_field(field,model,object,data);
//};
//
//function render_text_field(field,model,object,data)
//{
//    return '<input type="text" name="' + field.path + '"/>';
//}
//
//function render_boolean_field(field,model,object,data)
//{
//    var id = field.path;
//    return '<input type="checkbox"  name="' + id + '" />';
//}
//
//function render_enum_field(field,model,object,data,refs)
//{
//    var str = '<select name="' + field.path + '">';
//    var list = field.options.enum;
//    if(list)
//    {
//        for(var i=0; i<list.length; i++)
//        {
//            str += '<option value="' + list[i] + '">' + list[i] +'</option>';
//        }
//    }
//    str += '</select>';
//    return str;
//}
//
//function render_ref_field(field,model,object,data,refs)
//{
//    var str = '<select name="' + field.path + '">';
//    if(!field.options.required)
//    {
//        str += '<option value=""> ---- </option>';
//    }
//    var list = refs[field.options.ref];
//    if(list)
//    {
//        for(var i=0; i<list.length; i++)
//        {
//            str += '<option value="' + list[i].id + '">' + list[i] +'</option>';
//        }
//    }
//    str += '</select>';
//    return str;
//}