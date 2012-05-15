var $;
try
{
   $ = require('jquery');
}
catch(e)
{
   $ = function() {  };
}
var mongoose = require('mongoose');

function Renderer() {

};

/** Builds HTML for an entire document
 *
 * @param {Array} models
 * @param {Object} fields
 * @param {Object} options
 * @param {Object} document
 * @param {Function} onReady
 *
 * @return {String}
 */
Renderer.renderDocument = function(models, fields, options, document, onReady) {
    var documentDiv = $('<div />');
    var form = $('<form />').attr('id', 'document');

    if (document) {
        form.append($('<input />').attr('id', 'document_id').attr('name', 'document_id').attr('type', 'hidden').val(document._id));
    } else {
        form.append($('<input />').attr('id', 'document_id').attr('name', 'document_id').attr('type', 'hidden').val(''));
    }

    for (field in fields) {
        if (!options.hidden || options.hidden.indexOf(field) == -1) {
            form.append(Renderer.renderDocumentField(models, field, fields, options, document, false, ''));
        }
    }

    documentDiv.append(form);
    onReady(documentDiv.html());
};

/**
 * Builds HTML component for a single field of a document
 *
 * @param {Array} models
 * @param {String} field
 * @param {Object} fields
 * @param {Object} options
 * @param {Object} document
 * @param {Boolean} isChild
 * @param{String} parentFieldName
 *
 * @return {Object}
 */
Renderer.renderDocumentField = function(models, field, fields, options, document, isChild, parentFieldName) {
    var isRequired = fields[field].required;
    var labelClassName = isRequired ? 'required_label' : 'optional_label';

    var span = $('<span />').addClass('document_label');
    if (isChild) {
        span.addClass('inline_element');
    }

    var label = $('<label />').attr('for', field).addClass(labelClassName).html(field);
    if (isChild) {
        label.addClass('inline_element');
    }
    span.append(label);

    var result = $('<p />');
    result.append(span);

    // nested objects
    var fieldValue = '';
    var fieldName = '';
    if (isChild) {
        fieldValue = (document && document[parentFieldName][field]) ? document[parentFieldName][field].toString() : '';
        fieldName = parentFieldName + '[' + field + ']';
    } else {
        fieldValue = (document && document[field]) ? document[field].toString() : '';
        fieldName = field;
    }


    if (fields[field].type === Date) {   
        // Objects defined in mongoose schema as type:Date
        result.append($('<input />').attr('id', fieldName).attr('name', fieldName).attr('type', 'text').attr('placeholder', 'Date or Date & Time').attr('value', fieldValue).addClass('document_input'));
    } else if (fields[field].type === Boolean){
        // a total hack
        var el = $('<input />').attr('type', 'text').attr('id', fieldName).attr('name', fieldName).addClass('document_input')
        el.attr('value', fieldValue)
        result.append(el);
    } else if (fields[field].type === String || fields[field].type === Number) {   
        // Objects defined in mongoose schema as type:String
        var el = {}
        if (fields[field].widget && fields[field].widget == 'textarea'){
            el = $('<textarea />')
        }
        else {
            el = $('<input />').attr('type', 'text')
        }
        result.append(el.attr('id', fieldName).attr('name', fieldName).attr('value', fieldValue).addClass('document_input'));
    } else if (fields[field].type === mongoose.Objectid) {   
        // Nested objects in mongoose schema
        var childDiv = $('<div />').attr('id', fieldName).attr('name', fieldName).addClass('document_object');
        for (childField in fields[field]) {
            if (childField != '0') {
                childDiv.append(Renderer.renderDocumentField(models, childField, fields[field], options, document, true, field));
            }
        } 
        childDiv.append($('<div />').addClass('clearfix'));
        result.append(childDiv).append($('<div />').addClass('clearfix'));
    } else if (fields[field].type.toString() == mongoose.Schema.ObjectId.toString()) {
        // Objects defined in mongoose schema as type:mongoose.Schema.ObjectId
        var modelSelect = $('<select />').addClass('linked_model').attr('id', fieldName + '_linked_model').attr('name', fieldName + '_linked_model').attr('rel', fieldName + '_linked_document');
        modelSelect.append($('<option />').attr('value', '').html('Select type...'));
        models.forEach(function(model) {
            var option = $('<option />').attr('value', model.collection.name).html(model.modelName);
            modelSelect.append(option);
        });
        var documentSelect = $('<select />').addClass('linked_document').attr('id', fieldName + '_linked_document').attr('name', fieldName + '_linked_document');
        result.append(modelSelect);
        result.append(documentSelect);
        result.append($('<div />').attr('style', 'clear:both;'));
    } else {
        // Objects which we don't know what they are
        result.append($('<span />').attr('id', fieldName).attr('name', fieldName).addClass('document_other').html(fieldValue.length === 0 ? '<em>Not set</em>' : fieldValue));
    }

    return result;
};

exports.Renderer = Renderer;
