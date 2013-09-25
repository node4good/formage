var async = require('async'),
    _ = require('lodash');

function extractSubFieldKeyAndName(field_name, prefix) {
    var pre_len = prefix.length;
    var next_ = field_name.indexOf('_', pre_len);
    var key = field_name.substring(pre_len, next_);
    var name = field_name.substring(next_ + 1);
    return {key: key, name: name};
}


module.exports = function (formage) {
    var ListField = exports.ListField = formage.fields.BaseField.extend({
        init: function (options, fields, fieldsets) {
            options = options || {};
            options['default'] = options['default'] || [];
            options.widget = options.widget || formage.widgets.ListWidget;
            this._super(options);
            this.fields = fields;
            this.fieldsets = fieldsets;
            this.head = _(fields).pluck('widget').compact().pluck('head').flatten().concat(this.widget.head).compact().valueOf();
        },
        set:function(value){
            return this._super(Array.isArray(value)?value:value&&[value]);
        },
        to_schema: function () {
            var schema = this._super();
            schema['type'] = Array;
            return schema;
        },
        clean_value: function (req, callback) {
            // casting and validation
            var self = this;
            var base = self._super;
            var prefix = self.name + '_li';
            var old_list_value = self.value || {};
            self.value = [];
            var clean_funcs = [];
            self.children_errors = [];

            function create_clean_func(field_name, post_data, file_data, output_data, old_value, parent_errors)
            {
                return function (cbk) {
                    var inner_field = _.defaults({errors:[], name:field_name}, self.fields[field_name]);
                    // lodash doesn't clone the prototype;
                    inner_field.__proto__ = self.fields[field_name].__proto__;
                    var request_copy = _.defaults({body:post_data, files:file_data}, req);
                    var old_field_value = post_data[field_name] || (old_value.get ? old_value.get(field_name) : old_value[field_name]);
                    inner_field.set(old_field_value);
                    inner_field.clean_value(request_copy, function (err) {
                        if (err) console.trace(err);
                        if (inner_field.errors && inner_field.errors.length) {
                            self.errors = _.union(self.errors, inner_field.errors);
                            parent_errors[field_name] = _.clone(inner_field.errors);
                        }
                        else {
                            output_data[field_name] = inner_field.value;
                        }
                        cbk(null);
                    });
                }
            }

            // First subset req.files according to subfield prefix
            var inner_files = Object.keys(req.files)
                .filter(function (field_name) {return ~field_name.indexOf(prefix, 0);})
                .reduce(function (seed, field_name) {
                    var pair = extractSubFieldKeyAndName(field_name, prefix);
                    var key = pair.key;
                    var name = pair.name;
                    seed[key] = seed[key] || {};
                    seed[key][name] = req.files[field_name];
                    return seed;
                }, {});

            // Subset req.body according to subfield prefix and extract the submitted list order
            var new_key_order = [];
            var inner_body = Object.keys(req.body)
                .filter(function (field_name) {return ~field_name.indexOf(prefix, 0);})
                .reduce(function (seed, field_name) {
                    var pair = extractSubFieldKeyAndName(field_name, prefix);
                    var key = pair.key;
                    var name = pair.name;

                    // Order the "old" and new list items according to the submitted order (but only once per old index)
                    !~new_key_order.indexOf(key) && new_key_order.push(key);

                    seed[key] = seed[key] || {};
                    seed[key][name] = req.body[field_name];
                    return seed;
                }, {});

            // Setup the embedded fields according the new order
            new_key_order.forEach(function (key) {
                var output_data = {};
                var output_errors = {};
                self.value.push(output_data);
                self.children_errors.push(output_errors);
                Object.keys(self.fields).forEach(function (field_name) {
                    clean_funcs.push(create_clean_func(
                        field_name,
                        inner_body[key] || {},
                        inner_files[key] || {},
                        output_data,
                        old_list_value[key] || {},
                        output_errors
                    ));
                });
            });

            async.parallel(clean_funcs, function () {
                for (var i = 0; i < self.value.length; i++) {
                    var new_dict = {};
                    for (var key in self.value[i])
                        self.deep_write(new_dict, key, self.value[i][key]);
                    self.value[i] = new_dict;
                    if ('__self__' in self.value[i])
                        self.value[i] = self.value[i].__self__;
                }
                base.call(self, req, callback);
            });
            return self;
        },
        pre_render: function (callback) {
            var funcs = [];
            var self = this;

            self.widget.name = self.name;
            self.widget.value = self.value;

            function pre_render_partial(field_key) {
                return function (cbk) {
                    var field = self.fields[field_key];
                    field.set(_.map(self.value || [], function (obj) {
                        return (obj && obj[field_key]) || '';
                    }));
                    field.pre_render(function (err, results) {
                        cbk(err, results);
                    });
                };
            }

            for (var field in self.fields) {
                funcs.push(pre_render_partial(field));
            }

            funcs.push(self.widget.pre_render.bind(self.widget));
            async.parallel(funcs, function (err, results) {
                callback(err, results);
            });
            return self;
        },
        render: function (res) {
            var self = this;

            var children_errors = self.children_errors || [];

            function render_template(res) {
                var prefix = self.name + '_tmpl_';
                self.render_list_item(res, self.fields, self.fieldsets, prefix);
            }

            function render_item(res, i) {
                var prefix = self.name + '_li' + i + '_';
                self.render_list_item(res, self.fields, self.fieldsets, prefix, self.value[i], children_errors[i]);
            }

            this.widget.name = this.name;
            this.widget.value = this.value;
            self.widget.render(res, render_template, render_item);
            return self;
        },
        deep_write: function (object, name, value) {
            var parent = object;
            var parts = name.split('.');
            for (var i = 0; i < parts.length - 1; i++) {
                var child = parent[parts[i]] || {};
                parent[parts[i]] = child;
                parent = child;
            }
            parent[_.last(parts)] = value;
        },
        deep_read: function (object, name) {
            var parent = object;
            if (!parent)
                return null;
            var parts = name.split('.');
            for (var i = 0; i < parts.length - 1; i++) {
                parent = parent[parts[i]];
                if (!parent)
                    return null;
            }
            if (!parent)
                return null;
            return parent[_.last(parts)];
        },
        render_list_item: function (res, fields, fieldsets, prefix, value, errors) {
            var self = this;
            errors = errors || {};

            function render_fields(fields) {
                for (var i = 0; i < fields.length; i++) {
                    var field_name = fields[i];
                    if (typeof(field_name) === 'object')
                        render_fieldset(field_name);
                    else
                        render_field(field_name);
                }
            }

            function render_field(field_name) {
                var field = fields[field_name];
                if (!field)
                    return;
                field.name = prefix + field_name;
                field.errors = errors[field_name] || [];
                // This is for array in template
                if (field_name === '__self__') {
                    field.set(value);
                    field.render(res);
                } else {
                    field.set(value ? self.deep_read(value, field_name) : null);
                    field.render_with_label(res);
                }
            }

            function render_fieldset(fieldset) {
                var has_title = fieldset['title'] && fieldset['title'] !== '';
                if (has_title)
                    res.write('\n<div class="nf_fieldset">\n<h2>' + fieldset['title'] + '</h2>\n');
                if (fieldset.fields)
                    render_fields(fieldset.fields);
                if (has_title)
                    res.write("\n</div>\n");
            }

            var fields_to_render = fieldsets ? fieldsets[0].fields : Object.keys(fields);
            render_fields(fields_to_render);
        }

    });


    return ListField;
};
