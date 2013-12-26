'use strict';
/*global dialogCallback,_dialog_response,isDialog,root,$,window,location */
var MINIMUM_ITEM_COUNT_TO_EXPAND = 1;


var btn = {
    'delete': function () {
        return $('<button type="button" class="nf_listfield_delete"><i class="icon-remove"></i></button>')
            .click(function (e) {
                e.stopPropagation();
                e.preventDefault();

                var t = $(this);
                t.parent().slideUp(400, function () {
                    $(this).remove();
                });
                updateListfield(t.closest('.nf_listfield_container'));
            });
    },
    drag: function () {
        return $('<div class="nf_listfield_drag"><i title="Drag to reorder" class="icon-resize-vertical"></i></div>');
    },
    add: function () {
        return $('<button type="button" class="nf_add btn btn-warning"><i class="icon-plus icon-white"></i> Add Item</button>');
    }
};


function initFieldSet(ctx) {
    // On first run, close all field-sets, open only those with errors
    if (!ctx) {
        $('.error').closest('.nf_fieldset > div, .nf_listfield_container > div').show();
    }

    $('.nf_fieldset, .nf_listfield_container', ctx).each(function () {
        if ($(this).data('nf_fieldset')) {
            return;
        }
        $(this).data('nf_fieldset', true);

        var t = $(this),
            isTopLevel = t.is('.toplevel'),
            h2 = $('> h2, > label', t),
            div = $('> div', t),
            i = $('<i class="icon-chevron-right" />').prependTo(t);

        t.find('label').add(i).add(h2).off('click').on('click', function chevronToggle(e) {
            e.stopPropagation();
            var is_open = div.is(':visible');
            var divs = isTopLevel ? t.find('div') : div;
            var im = isTopLevel ? t.find('i.icon-chevron-down, i.icon-chevron-right') : i;
            if (is_open) {
                im.removeClass('icon-chevron-down').addClass('icon-chevron-right');
                divs.stop(1, 1).slideUp('fast');
                t.addClass('closed');
            } else {
                im.removeClass('icon-chevron-right').addClass('icon-chevron-down');
                divs.stop(1, 1).slideDown('fast');
                t.removeClass('closed');
            }
        });

        // Only list-view
        if (t.is('.nf_listfield_container')) {
            if (updateListfield(t) <= MINIMUM_ITEM_COUNT_TO_EXPAND) {
                t.click();
            }
        }
    });
}


function updateListfield(t) {
    var length = $('> .nf_listfield > ul > li', t).length;
    t.find('.list_summary').text(length ? length + ' items' : 'No items');
    return length;
}


function initWidgets(ctx) {
    $('.nf_listfield', ctx).each(function () {
        $(this).data('listfield', new ListField(this));
    });
    initFieldSet(ctx);
    if ($.fn.select2) {
        $('.nf_ref', ctx).each(getQueryFunctionForSelect2);
        $('select', ctx).select2();
    }
    if ($.fn.datepicker) $('.nf_datepicker', ctx).datepicker({format: 'yyyy-mm-dd'});
    $('[data-ref]', ctx).each(refLink);

    // Wire FilePicker widget. FieldBinding is done automagicly by type="filepicker"
    $('input[type=filepicker]', ctx).on('change', function (e) {
        e.preventDefault();
        //noinspection JSUnresolvedVariable
        var file = e.originalEvent.fpfile;
        $(this).val(JSON.stringify(file));
        var a = $(this).parent().find('a').text(file.filename).attr('href', file.url);
    });
}


function refLink() {
    var $this = $(this);
    var $a = $('<a class="btn" ></a>')
        .insertAfter($this)
        .click(function () {
            var id = $this.val() || 'new';
            var refType = $this.data('ref').toLocaleLowerCase();
            var url = [root, '/model/', refType, '/document/', id, '?_dialog=yes'].join('');
            window.showDialog($this, url);
        });

    $this.change(function () {
        $a.text($this.val() ? 'Edit' : 'New');
    });

    $this.change();
}


function ListField(el) {
    var self = this;
    self.el = $(el);

    self.add = function (e) {
        e.preventDefault();

        var li = $('<li />').hide()
            .append(self.template)
            .append(btn.delete())
            .append(btn.drag())
            [appendToFunc](self.list)
            .slideDown(function () {
                $('input:first', li).focus();
            });

        $('[name]', li).each(function () {
            var input = $(this),
                name = input.attr('name').replace(self.name + '_tmpl_', self.name + '_li' + self.length + '_');

            input.attr('name', name);
        });

        self.length++;

        // load nested widgets
        initWidgets(li);

        li.find('.nf_fieldset');
        li.find('> .nf_fieldset').click();

        li.find('> ul').sortable({
            items: 'li:not(.new_li)',
            handle: '.nf_listfield_drag'
        });
        $('.list_summary', self.el.parent()).text(self.length ? self.length + ' items' : 'No items');
    };

    if (self.el.data('processed') == 'true') {
        return;
    }
    self.el.data('processed', 'true');

    self.el.closest('.field').addClass('nf_listfield_container');

    self.name = self.el.attr('name');

    var tpl = $('> .nf_hidden_template', el);
    tpl.find('.nf_listfield');
    self.template = tpl.html();
    tpl.remove();

    self.list = $('> ul', el);
    var appendFunc = (self.list.data('stack-dir') === 'top') ? 'prepend' : 'append';
    var appendToFunc = (self.list.data('stack-dir') === 'top') ? 'prependTo' : 'appendTo';

    self.el
        [appendFunc](btn.add().click(self.add))
        .append('<label class="list_summary" />');

    self.length = $('> li', self.list)
        .append(btn.drag())
        .append(btn.delete())
        .length;

    self.list.sortable({
        items: 'li:not(.new_li)',
        handle: '.nf_listfield_drag'
    });

    initWidgets(this);
}


function getQueryFunctionForSelect2() {
    var jElem = $(this);
    var query_url = jElem.data('url');
    var query_data = decodeURIComponent(jElem.data('data'));

    jElem.select2({query: function (options) {
        var term = options.term;
        //var page = options.page;
        var context = options.context;
        var callback = options.callback;
        $.get(query_url, {
            data: query_data,
            query: term
        }).success(function (rsp) {
                var result = {
                    results: rsp['objects'] || rsp,
                    more: false,
                    context: context
                };
                callback(result);
            });
    },
        initSelection: function (element, callback) {
            var id = $(element).val();
            if (id !== "") {
                $.get(query_url, {
                    data: query_data,
                    id: id
                }).done(function (rsp) {
                        callback(rsp);
                    });
            }
        }
    });
}


function deleteDocument(callback) {
    $('#deleteButton').button('loading');
    var depsUrl = [root, 'json', 'model', window.model, 'document', window.docId, 'dependencies'].join('/');
    $.get(depsUrl).done(function (result) {
        var msg = result.length ? 'there are other entities dependent on this document:<ul><li>' + result.join('</li><li>') + '</li></ul>' : '';
        msg += 'Are you sure you want to delete?';
        bootbox.confirm(msg, function (res) {
            if (!res) return $('#deleteButton').button('reset');
            return $.ajax({
                type: 'POST',
                url: root + '/json/model/' + model + '/action/delete',
                data: {ids: [docId]},
                success: function () {
                    $('#deleteButton').button('reset');
                    if (callback) callback();
                },
                error: function (xhr, textStatus) {
                    $('#deleteButton').button('reset');
                    bootbox.alert(textStatus);
                    console.error('Deleting error', arguments);
                }
            });
        })
    });
}


function initActions() {
    $('button.action').click(function (e) {
        e.preventDefault();

        var action_id = $(this).val();
        if (!action_id) return;

        var ids = [window.docId];

        var msg = 'Are you sure you want to ' + $(this).text().toLowerCase() + ' this document? Changes made will not be saved!';

        bootbox.confirm(msg, function (result) {
            if (!result) return;

            $.post(root + '/json/model/' + window.model + '/action/' + action_id, { ids: ids }).always(function (data) {
                if (data.responseText) data = JSON.parse(data.responseText);
                if (data.error) {
                    bootbox.dialog("Some documents failed: " + data.error, [
                        {
                            "label": "Error",
                            "class": "btn-danger",
                            "callback": location.reload.bind(location)
                        }
                    ]);
                } else {
                    if (isDialog) {
                        dialogCallback({});
                    } else {
                        location.href = location.href.split('/document/')[0];
                    }
                }
            });
        });
    });

}


function initModal() {
    var modal = $('#myModal');
    window.showDialog = function (parentSelector, url) {
        modal.on('show', function () {
            modal.parentSelector = parentSelector;
            modal.find('h3').text(parentSelector.data('ref') + " Editor");
            modal.find('iframe').attr("src", url);
        });
        modal.modal('show');
    };

    window.hideDialog = function (response) {
        modal.response = response;
        modal.modal('hide');
    };

    modal.on('hide', function () {
        var response = modal.response;
        delete  modal.response;
        if (!response) return;
        if (response.cancel) return;
        // on delete
        if (response.delete) {
            modal.parentSelector.find("option[selected]").remove();
            modal.parentSelector.select2('val', '');
            modal.parentSelector.change();
            return;
        }
        // on create
        var id = modal.parentSelector.val();
        if (response.id && !id) {
            modal.parentSelector.find('option[selected]').removeAttr('selected');
            modal.parentSelector.append('<option selected value="' + response.id + '" >' + response.label + '</option>');
        }
        // on update
        if (response.id == id) {
            modal.parentSelector.find('option[value="' + id + '"]').text(response.label);
        }
        modal.parentSelector.select2('val', response.id);
        modal.parentSelector.change();
    });

    modal.on('hidden', function () {
        modal.find('iframe').attr("src", "about:blank");
        delete modal.parentSelector;
    });
}


if (window.Aviary) window.featherEditor = new Aviary.Feather({
    apiKey: window.AVIARY_API_KEY,
    apiVersion: 3,
    theme: 'dark', // Check out our new 'light' and 'dark' themes!
    tools: 'resize,crop,enhance',
    appendTo: '',
    onSave: function (imageID, newURL) {
        var $image = $(document.getElementById(imageID));
        var OrigInkBlob = $image[0].InkBlob;
        window.filepicker.writeUrl(OrigInkBlob, newURL, function (NewInkBlob) {
            $image.attr('src', NewInkBlob.url + '?' + Date.now());
            var $input = $image.parent().parent().find('input');
            $input.val(JSON.stringify(NewInkBlob));
            $input.parent().find('a.file-link').attr('href', NewInkBlob.url);
            featherEditor.close();
        });
    }
});


function handle_file_picked($field, InkBlob) {
    var $image = $field.find('img.thumb-picker');
    $image.attr('src', InkBlob.url);
    $image[0].InkBlob = InkBlob;
    $field.find(".picker").text('Pick New File');
    $field.find(".editor").show();
    $field.find(".clearer").show();
    $field.find('input').val(JSON.stringify(InkBlob));
}


function handle_file_picked_aviary($field, InkBlob) {
    handle_file_picked($field, InkBlob);
    var $image = $field.find('img.thumb-picker');
    featherEditor.launch({image: $image[0], url: InkBlob.url});
}


function trigger_picturepicker(e) {
    e.preventDefault();
    var $field = $(e.target).parent().parent();
    window.filepicker.pick({mimetype: 'image/*'}, handle_file_picked.bind(null, $field));
}


function trigger_aviarypicker(e) {
    e.preventDefault();
    var $field = $(e.target).parent().parent();
    window.filepicker.pick({mimetype: 'image/*'}, handle_file_picked_aviary.bind(null, $field));
}


function trigger_refilepicker(e) {
    e.preventDefault();
    var $field = $(e.target).parent().parent();
    var serInkBlob = $field.find('input').val();
    var InkBlob = JSON.parse(serInkBlob);
    handle_file_picked($field, InkBlob);
}


function trigger_clearpicker(e) {
    e.preventDefault();
    var $field = $(e.target).parent().parent();
    $field.find('input').val('');
    $field.find(".picker").text('Pick File');
    $field.find(".editor").hide();
    $field.find(".clearer").hide();
    $field.find('img.thumb-picker').attr('src', 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D');
    $field.find('a.file-link').attr('href', '#')
}


$(function () {
    window.docId = location.pathname.split('/').pop();

    initWidgets();

    initModal();

    $('form#document').submit(function (e) {
        $('p.submit button').prop('disabled', true);
        if (isDialog) {
            e.preventDefault();
            var upsertURL = [root, 'json', 'model', window.model, 'document', window.docId].join('/');
            $.post(upsertURL, $(this).serialize()).done(function (docInfo) {
                window.parent.hideDialog({id: docInfo.id, label: docInfo.label});
            });
        }
    })
        .on('click', 'button.picker', trigger_picturepicker)
        .on('click', 'button.aviary-picker', trigger_aviarypicker)
        .on('click', 'button.editor', trigger_refilepicker)
        .on('click', 'button.clearer', trigger_clearpicker);

    if (isDialog) {
        $('#cancelButton').click(function (e) {
            e.preventDefault();
            window.parent.hideDialog({cancel: true});
        });
    }

    $('#deleteButton').click(function () {
        deleteDocument(function () {
            if (isDialog) {
                window.parent.hideDialog({delete: true})
            } else {
                location.href = location.href.split('/document/')[0];
            }
        });
    });

    initActions();
});

