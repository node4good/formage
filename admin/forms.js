var util = require('util')
    ,Models = require('../Models')
    ,fields = require('./fields');

var async = require('async');

var BaseForm = exports.BaseForm = function(options) {
    this.fields = {};
    options = options || {};
    this.data = options.data || {};
    this.files = options.files || {};
    this._fields_ready = false;
    this.errors = {};
};

BaseForm.prototype.get_fields = function()
{
    for(var attr in this)
    {
        if(this[attr] instanceof fields.BaseField)
        {
            this.fields[attr] = this[attr];
        }
    }
};

BaseForm.prototype.get_value = function(field_name)
{
    return this.data[field_name];
};

BaseForm.prototype.init_fields = function()
{
    this.get_fields();
    for(var field_name in this.fields)
    {
        var value = this.get_value(field_name);
        this.fields[field_name].set(value).name = field_name;
    }
    this._fields_ready = true;
};

BaseForm.prototype.save = function(callback)
{
    if(!this._fields_ready)
        this.init_fields();
    // not implemented
    if(!this.error)
        this.is_valid();
    if(Object.keys(this.errors) > 0)
        callback({message:'form did not validate'});
    else
        this.actual_save(callback);
};

BaseForm.prototype.actual_save = function(callback)
{
    callback({message:'not implmeneted'});
};

BaseForm.prototype.is_valid = function()
{
    if(!this._fields_ready)
        this.init_fields();
    this.errors = {};
    this.clean_values = {};
    for(var field_name in this.fields)
    {
        this.fields[field_name].clean_value();
        if(this.fields[field_name].errors && this.fields[field_name].errors.length)
            this.errors[field_name] = this.fields[field_name].errors;
        else
            this.clean_values[field_name] = this.fields[field_name].value;
    }
    return Object.keys(this.errors).length == 0;
};

BaseForm.prototype.render_ready = function(callback)
{
    if(!this._fields_ready)
        this.init_fields();
    var funcs = [];
    var self = this;
    function render_func(field)
    {
        return function(cb)
        {
            field.pre_render(cb);
        };
    }
    for(var field_name in this.fields)
    {
        funcs.push(render_func(this.fields[field_name]));
    }
    async.parallel(funcs,function(err,results)
    {
        if(err)
            callback(err);
        else
            callback(null);
    });
};


BaseForm.prototype.render = function(res)
{
    for(var field_name in this.fields)
    {
        res.write(this.fields[field_name].name + ': ');
        this.render_error(res,field_name);
        this.fields[field_name].render(res);
        res.write('<br />');
    }
};

BaseForm.prototype.render_error = function(res,field_name)
{
    if(this.errors[field_name])
        res.write(this.errors[field_name] + '<br />');
};


var MongooseForm = exports.MongooseForm = function(options,model) {
    options = options || {};
    MongooseForm.super_.call(this,options);
    this.model = model;
    console.log(options.instance);
    this.instance = options.instance || new this.model();
};

util.inherits(MongooseForm,BaseForm);

MongooseForm.prototype.get_fields = function()
{
    for(var field in this.model.schema.paths)
    {
        if(field == 'id' || field == '_id')
            continue;
        this.fields[field] = this.mongoose_field_to_form_field(this.model.schema.paths[field]);
    }
    MongooseForm.super_.prototype.get_fields.call(this);
};

MongooseForm.prototype.mongoose_field_to_form_field = function(mongoose_field)
{
    var is_required = mongoose_field.options.required ? true : false;
    var def = mongoose_field.options['default'] || null;
    var validators = [];
    if(mongoose_field.options.validate)
    {
        validators.push(function(value)
        {
            var result = mongoose_field.options.validate[0](value);
            return result ? true : mongoose_field.options.validate[1];
        });
    }
    if(mongoose_field.options.min)
        validators.push(function(value)
        {
            if(value >= mongoose_field.options.min)
                return true;
            else
                return 'value must be equal or greater than ' + mongoose_field.options.min;
        });
    if(mongoose_field.options.max)
        validators.push(function(value)
        {
            if(value <= mongoose_field.options.max)
                return true;
            else
                return 'value must be equal or lower than ' + mongoose_field.options.max;
        });
    var options = {required:is_required,'default':def,validators:validators};
    if(mongoose_field.options.ref)
    {
        return new fields.RefField(options,Models[mongoose_field.options.ref]);
    }
    if(mongoose_field.options.enum)
    {
        return new fields.EnumField(options,mongoose_field.options.enum);
    }
    if(mongoose_field.options.type == Boolean)
        return new fields.BooleanField(options);
    if(mongoose_field.options.type == Number)
        return new fields.NumberField(options);
    return new fields.StringField(options);
};

MongooseForm.prototype.get_value = function(field_name)
{
    return this.data[field_name] || this.instance.get(field_name);
};

MongooseForm.prototype.actual_save = function(callback)
{
    for(var field_name in this.clean_values)
        this.instance.set(field_name,this.clean_values[field_name]);
    this.instance.save(function(err,object)
    {

       if(err)
       {
           this.errors = err.errors;
           callback({message:'failed'});
       }
       else
       {
           callback(null,object);
       }
    });
};

