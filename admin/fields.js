var util = require('util');

var _extends = function(base_class,constr)
{
    util.inherits(constr,base_class);
    return constr;
}

var BaseField = exports.BaseField = function(options) {
    this['default'] = options['default'];
    this.required = options.required || false;
    this.validators = options.validators || [];
    this.value = null;
    this.errors = [];
    this.name = '';
};

BaseField.prototype.render = function(res,callback)
{
    callback(null);
    return this;
};
BaseField.prototype.set = function(value)
{
    this.value = value || this['default'];
    return this;
};

BaseField.prototype.clean_value = function()
{
    if(this.value == null && this.required)
        this.errors.push('this field is required');
    for(var i=0; i<this.validators; i++)
    {
        var result = this.validators[i](this.value);
        if(result != true )
        {
            this.errors.push(result);
        }
    }
    return this;
};

BaseField.prototype.pre_render = function(callback) {
    callback(null);
};

var StringField = exports.StringField = _extends(BaseField,function(options)
{
     StringField.super_.call(this,options);
});

StringField.prototype.render = function(res)
{
    res.write('<input type="text" name="' + this.name + '" value="' + this.value + '" />');
    return this;
};

var BooleanField = exports.BooleanField = _extends(BaseField, function(options) {
    BooleanField.super_.call(this,options);
});

BooleanField.prototype.render = function(res)
{
    res.write('<input type="checkbox" name="' + this.name + '" ');
    if(this.value)
        res.write(' checked="checked" ');
    res.write(' />');
    return this;
};

BooleanField.prototype.clean_value = function()
{
    if(this.value && this.value != '')
        this.value = true;
    else
        this.value = false;
    BooleanField.super_.prototype.clean_value.call(this);
    return this;
}

var EnumField = exports.EnumField = _extends(BaseField,function(options,choices)
{
    EnumField.super_.call(this,options);
    this.choices = choices || [];
    this.required = true;
    this.names = [];
    for(var i=0; i<this.choices.length; i++)
    {
        if(typeof(this.choices[i]) == 'object')
        {
            this.choices[i] = this.choices[i][0];
            this.names[i] = this.choices[i][1];
        }
        else
            this.names[i] = this.choices[i];
    };
});

EnumField.prototype.clean_field = function()
{
    var found = false;
    for(var i=0; i<this.choices.length; i++)
    {
        if(this.choices[i] == this.value)
            found = true;
    }
    if(this.value === null || this.value == '')
    {
        this.value = null;
        found = true;
    }
    if(!found)
        this.errors = ['possible values are: ' + this.choices];
        this.value = null || this['default'];
    EnumField.super_.prototype.clean_value.call(this);
    return this;
};

EnumField.prototype.render = function(res)
{
    res.write('<select name="' + this.name + '">');
    if(!this.required)
    {
        var selected = this.value ? '' : 'selected="selected" ';
        res.write('<option ' + selected + 'value=""> ---- </option>');
    }
    for(var i=0; i<this.choices.length; i++)
    {
        var selected = this.value == this.choices[i] ? 'selected="selected" ' : '';
        res.write('<option ' + selected + 'value="' + this.choices[i] + '">' + this.choices[i] + '</option>');
    }
    res.write('</select>');
    return this;
};

var RefField = exports.RefField = _extends(EnumField,function(options,ref)
{
    this.ref = ref;
    RefField.super_.call(this,options,[]);
    this.required = options ? options.required : false;
});

RefField.prototype.pre_render = function(callback)
{
    var self = this;
    this.ref.find({},function(err,objects)
    {
        if(err)
            callback(err);
        else
        {
            self.choices = [];
            for(var i=0; i<objects.length; i++)
                self.choices.push([objects[i].id,objects[i] + '']);
             return RefField.super_.prototype.pre_render.call(self,callback);
        }
    });
};


var NumberField = exports.NumberField = _extends(StringField,function(options)
{
    NumberField.super_.call(this,options);
});

NumberField.prototype.render = function(res)
{
    res.write('<input type="number" name="' + this.name + '" value="' + this.value + '" />');
    return this;
};

NumberField.prototype.clean_value = function()
{
    if(this.value === null && this.value == '' && !this.required)
        this.value = null;
    else
        this.value = Number(this.value);
    NumberField.super_.prototype.clean_value.call(this);
    return this;
};