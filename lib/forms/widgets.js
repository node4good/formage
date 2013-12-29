'use strict';
var Class = require('./sji'),
    util = require('util'),
    _ = require('lodash-contrib');

var Widget = exports.Widget = Class.extend({
    init: function (options) {
        this.limit = options.limit || 50;
        this.validators = options.validators;
        this.attrs = _.assign({class: []}, options.attrs);
        this.attrs.class.push(options.required || options.attrs.required ? 'required' : 'optional');
        this.data = options.data || {};
        this.name = '';
        this.value = null;
    },

    render: function () { },

    getID: function () {return 'id_' + (this.name || '').replace(/[\.\#\[\]]/g, '_');}
});


exports.InputWidget = Widget.extend({
    init: function (type, options) {
        options.attrs.type = options.attrs.type || type;
        this._super(options);
    },
    render: function (res) {
        var attr_string = render_attributes(this.name, this.getID(), this.value, this.data, this.attrs);
        res.write('<input ' + attr_string + ' />\n');
        return this;
    }
});


exports.HiddenWidget = exports.InputWidget.extend({
    init: function (options) {
        this._super('hidden', options);
    }
});


exports.TextWidget = exports.InputWidget.extend({
    init: function (options) {
        this._super('text', options);
    }
});


exports.PasswordWidget = exports.InputWidget.extend({
    init: function (options) {
        this._super('password', options);
    }
});


exports.TextAreaWidget = Widget.extend({
    render: function (res) {
        var attr_string = render_attributes(this.name, this.getID(), undefined, this.data, this.attrs);
        res.write('<textarea ' + attr_string + ' >\n');
        res.write(_.escape(this.value));
        res.write('</textarea>\n');
        return this;
    }
});


exports.RichTextAreaWidget = exports.TextAreaWidget.extend({
    init: function (options) {
        this._super(options);
        this.attrs.class.push('ckeditor');
    },
    render: function (res) {
        res.write('<div class="nf_widget">\n');
        this._super(res);
        res.write('</div>\n');
    }
});


exports.DateWidget = exports.InputWidget.extend({
    init: function (options) {
        this._super('date', options);
    },
    render: function (res) {
        res.write('<div class="input-append date">\n');
        this.value = this.value && this.value.toISOString().split('T')[0];
        this._super(res);
        res.write('<span class="add-on"><i class="icon-calendar"></i></span>\n');
        res.write('</div>\n');
    }
});


exports.DateTimeWidget = exports.InputWidget.extend({
    init: function (options) {
        this._super('text', options);
        this.attrs['data-format'] = "yyyy-MM-dd hh:mm";
    },
    render: function (res) {
        var widget_id = 'datetimepicker' + this.getID();
        res.write('<div class="input-append date" id="' + widget_id + '">\n');
        this._super(res);
        res.write('<span class="add-on">\n<i data-time-icon="icon-time" data-date-icon="icon-calendar"></i>\n</span>\n</div>\n');
        var script = "$('#" + widget_id + "').datetimepicker();";
        res.write('<script>' + script + '</script>');
    }
});


exports.TimeWidget = exports.InputWidget.extend({
    init: function (options) {
        this._super('time', options);
    },
    render: function (res) {
        res.write('<div class="input-append" >\n');
        this._super(res);
        res.write('<span class="add-on"><i class="icon-time"></i></span>\n');
        res.write('</div>\n');
    }
});


exports.NumberWidget = exports.InputWidget.extend({
    init: function (options) {
        options.attrs.min = options.min;
        options.attrs.max = options.max;
        options.attrs.step = options.attrs.step || options.step || 'any';
        this._super('number', options);
    }
});


exports.CheckboxWidget = exports.InputWidget.extend({
    init: function (options) {
        this._super('checkbox', options);
    },
    render: function (res) {
        var old_value = this.value;
        if (this.value) {
            this.attrs['checked'] = 'checked';
        }
        this.value = 'on';
        var ret = this._super(res);
        this.value = old_value;
        return ret;

    }
});


exports.ChoicesWidget = Widget.extend({
    init: function (options) {
        this.choices = options.choices || [];
        this._super(options);
    },


    isSelected: function (choice) {
        if (Array.isArray(this.value)) {
            return Boolean(~this.value.indexOf(choice));
        } else {
            return choice == this.value;
        }
    },


    prepareValues: function () {
        if (!this.names) {
            this.names = new Array(this.choices.length);
            for (var i = 0; i < this.choices.length; i++) {
                if (typeof(this.choices[i]) == 'object') {
                    this.names[i] = this.choices[i][1];
                    this.choices[i] = this.choices[i][0];
                } else {
                    this.names[i] = this.choices[i];
                }
            }
        }
    },


    render: function (res) {
        this.prepareValues();
        var attr_string = render_attributes(this.name, this.getID(), this.value, this.data, this.attrs);
        res.write('<select ' + attr_string + ' />\n');
        var found_selected = false;
        if (!this.attrs.required) {
            var selected = this.value ? '' : 'selected="selected" ';
            if (selected) {
                found_selected = true;
            }
            res.write('<option ' + selected + 'value=""> ... </option>\n');
        }
        for (var i = 0; i < this.choices.length; i++) {
            var selected2 = this.isSelected(this.choices[i]) ? 'selected="selected" ' : '';
            if (selected2) {
                found_selected = true;
            }
            res.write('<option ' + selected2 + 'value="' + this.choices[i] + '">' + this.names[i] + '</option>\n');
        }
        if (!found_selected && this.value) {
            res.write('<option selected="selected" value="' + this.value + '">Current</option>\n');
        }
        res.write('</select>\n');
        return this;
    }
});


exports.RefWidget = exports.ChoicesWidget.extend({
    init: function (options) {
        this.ref = options.ref;
        if (!this.ref) {
            throw new TypeError('model was not provided');
        }
        this._super(options);
        this.refForm = options.refForm || options.ref.label;
        this.attrs['data-ref'] = this.refForm;
    }
});


exports.FileWidget = exports.InputWidget.extend({
    init: function (options) {
        this._super('file', options);
    },
    render: function (res) {
        this._super(res);
        if (this.value && this.value.path) {
            res.write('<a href="' + this.value.url + '">' + this.value.path + '</a>\n<input type="checkbox" class="file-clear" name="' + this.name + '_clear" value="Clear" /> Clear\n');
        }
    }
});

exports.FilepickerWidget = exports.InputWidget.extend({
    init: function (options) {
        this._super('filepicker', options);
        this.attrs['data-fp-button-class'] = "btn btn-primary";
    },

    render: function (res) {
        var raw_value = this.value || '';
        this.value = JSON.stringify(raw_value);
        this._super(res);
        res.write(util.format('<a href="%s" target="_blank">%s</a>\n', raw_value.url || '#', raw_value.filename || ''));
        if (raw_value && raw_value.url) {
            res.write(util.format('<input type="checkbox" class="file-clear" name="%s_clear" value="false" /> Clear\n', this.name));
        }
    }
});



exports.FilepickerPictureWidget = exports.InputWidget.extend({
    init: function (options) {
        this._super('hidden', options);
        this.picker_class = 'picker'
    },
    render: function (res) {
        var raw_value = this.value || '';
        this.value = JSON.stringify(raw_value);
        this._super(res);
        var file_url = raw_value.url || 'javascript:void(0)';
        var thumb_url = (raw_value.url) ? raw_value.url + '/convert?w=150&h=110' : 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D';
        res.write(util.format(
            "<a href='%s' target='_blank' class='file-link'>\n" +
                "<img id='%s_thumb' class='thumb-picker' src='%s' width='150' height='110'/>\n" +
                "</a>\n",
            file_url, this.getID(), thumb_url)
        );
        var pick_caption = "Pick File";
        var show_edit = 'style="display:none"';
        var show_clear = 'style="display:none"';
        if (raw_value && raw_value.url) {
            pick_caption = "Pick New File";
            show_edit = '';
            show_clear = '';
        }
        res.write(util.format(
            '<div class="btn-group">\n' +
                '<button type="button" class="btn btn-primary %s" id="%s_button1">%s</button>\n' +
                '<button type="button" class="btn btn-primary editor" id="%s_button2" %s>Edit</button>\n' +
                '<button type="button" class="btn btn-danger clearer" id="%s_button3" %s>Clear</button>\n' +
                '</div>\n',
            this.picker_class, this.getID(), pick_caption, this.getID(), show_edit, this.getID(), show_clear)
        );
    }
});


exports.AviaryWidget = exports.FilepickerPictureWidget.extend({
    init: function (options) {
        this._super(options);
        this.picker_class = 'aviary-picker';
    }
});


exports.PictureWidget = exports.InputWidget.extend({
    init: function (options) {
        this._super('file', options);
    },

    render: function (res) {
        if (this.value && this.value.url) {
            // formating directly so it's cross account
            var thumbnail_url = util.format(
                "<img src='%s/upload/c_fill,h_110,w_150/%s.png' alt='%s' height='110' title='%s' width='150'/>\n",
                this.value.url.split('/upload/')[0],
                this.value.public_id,
                this.value.original_name,
                this.value.original_name
            );
            res.write(util.format('<a href="%s" target="_blank">%s</a>\n', this.value.url, thumbnail_url));
            res.write(util.format('<input type="checkbox" class="file-clear" name="%s_clear" value="false" /> Clear\n', this.name));
        }
        var outVal = (this.value) ? _.escape(JSON.stringify(this.value)) : '';
        res.write(util.format('<input type="hidden" name="%s" value="%s" />\n', this.name, outVal));
        var origName = this.name;
        this.value = '';
        this.name += "_file";
        this._super(res);
        this.name = origName;
    }
});


exports.MapWidget = exports.InputWidget.extend({
    init: function (options) {
        this.hide_address = options.hide_address;
        this._super('hidden', options);
        this.attrs.class.push('nf_mapview');
    },

    render: function (res) {
        res.write('<div class="nf_widget">\n');
        //noinspection JSUnresolvedVariable
        if (!this.hide_address) {
            var address = this.value ? this.value.address : '';
            this.attrs['address_field'] = 'id_' + this.name + '_address';
            res.write('<input type="text" name="' + this.name + '_address" id="id_' + this.name + '_address" value="' + address + '" />\n');
        }
        var old_value = this.value;
        var lat = this.value && this.value.geometry ? this.value.geometry.lat : '';
        var lng = this.value && this.value.geometry ? this.value.geometry.lng : '';
        this.value = lat + ',' + lng;
        this._super(res);
        this.value = old_value;
        res.write('</div>\n');
    }
});


exports.ComboBoxWidget = exports.ChoicesWidget.extend({
    init: function (options) {
        this._super(options);
        this.attrs.class.push('nf_comb');
    }
});


exports.AutocompleteWidget = exports.TextWidget.extend({
    init: function (options) {
        if (!options.url) throw new Error('must specify url');
        if (!options.ref) throw new TypeError('model was not provided');

        this._super(options);
        this.attrs.class.push('nf_ref');
        this.attrs['data-ref'] = options.refForm || options.ref.label;

        this.data = this.data || {};
        this.data.url = this.data.url || options.url;
        this.data.data = this.data.data || options.data;

        this.ref = options.ref;
    },


    render: function (res) {
        var self = this;
        var name = self.value;
        if (self.doc) {
            if (Array.isArray(self.doc)) {
                var elem = self.doc.filter(function (d) {return d.id == self.value;})[0];
                name = (elem || '').toString()
            } else {
                name = self.doc.toString();
            }
        }
        self.data.name = name || '';
        self._super(res);
    }
});

function render_attributes(name, id, value, data, attrs) {
    var valueString = (value === undefined) ? '' : ' value="' + _.escape(value) + '" ';

    var attrString = _(data)
        .pairs()
        .forEach(function (pair) {pair[0] = 'data-' + pair[0];})
        .concat(_.pairs(attrs), [
            ['name', name],
            ['id', id]
        ])
        .map(function (pair) {
            var name = pair[0];
            var value = pair[1];
            if (name in {required: 1, selected: 1, hidden: 1} && !value) return '';
            value = Array.isArray(value) ? value.join(' ') : value;
            return util.format('%s="%s"', _.escape(name), _.escape(value));
        })
        .join(' ');

    return valueString + attrString;
}
