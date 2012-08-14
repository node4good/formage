
var j_forms =  require('j-forms')
    ,fields = j_forms.fields
    ,widgets = j_forms.widgets
    ,mongoose = require('mongoose')
    ,_ = require('underscore')
    ,jest = require('jest');

var api_loaded = false;
var api_path;

var AdminForm = exports.AdminForm = j_forms.forms.MongooseForm.extend({
    init: function(request,options,model)
    {
        this._super(request,options,model);
        this.static['js'].push('/node-forms/js/jquery-ui-1.8.22.custom.min.js');
        this.static['css'].push('/node-forms/css/ui-lightness/jquery-ui-1.8.22.custom.css');
        this.static['css'].push('/node-forms/css/forms.css');
    },
    get_fields: function() {
        this._super();
        _.each(this.fields,function(value,key) {
            if(value instanceof fields.RefField) {
                if( value.options.url || api_loaded) {
                    value.options.widget_options.url = value.options.url || api_path;
                    value.options.widget_options.data = value.options.widget_options.data || {};
                    value.options.widget_options.data.data = encodeURIComponent(JSON.stringify({
                        model: value.options.ref,
                        query: value.options.query || '/__value__/i.test(this.name || this.title || this._id.toString())'
                    }));
                    value.widget = new widgets.AutocompleteWidget(value.options.widget_options);
                }
            }
            else if(value instanceof fields.EnumField)
                value.widget = new widgets.ComboBoxWidget(value.options.widget_options);
        });
    }
});

exports.loadApi = function(app,path) {

    var api = new jest.Api(path || 'admin_api',app);


    var Resource = jest.Resource.extend({
        init:function(){
            this._super();

            this.fields = {
                value:null,
                label:null
            };

            this.allowed_methods = ['get'];

            this.filtering = {
                data:null,
                query:null
            };
        },
        mapObjects: function(objects) {
            return objects.map(function(object) {
                return { value: object.id, label:object.toString() };
            });
        },
        get_objects:function(req,filters,sorts,limit,offset,callback) {
            var self = this;
            var data = JSON.parse(filters.data);
            var model = mongoose.model(data.model);
            var query = data.query.replace('__value__',escapeRegex(filters.query));
            model.find({$where:query},function(err,results) {
                if(results) {
                    if(results.objects)
                        results.objects = self.mapObjects(results.objects);
                    else
                        results = self.mapObjects(results);
                }
                callback(err,results);
            });
        }
    });

    api.register('ref',new Resource());

    api_path = '/' + api.path + 'ref';

    api_loaded = true;
};

function escapeRegex (a){
    return a.replace(/[-[\]{}()*+?.,\\^$|#\s]/g,"\\$&");
}