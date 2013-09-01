'use strict';
var MINIMUM_ITEM_COUNT_TO_EXPAND = 1;
var btn = {
    delete: function () {
        return $('<button type="button" class="nf_listfield_delete"><i class="icon-remove"></i></button>')
            .click(function (e) {
                e.preventDefault();
                $($(this).parent()).slideUp(400, function () {
                    $(this).remove();
                });
                var length = $(this).parents('.nf_listfield').find('> ul > li').length;
                $(this).parents('.nf_listfield_container').find('.list_summary').text(length ? length + ' items' : 'No items');
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
    if (!ctx) {
        $('.nf_fieldset,.nf_listfield_container').addClass('closed');
        $('.error')
            .parents('.nf_fieldset > div,.nf_listfield_container > div').show()
            .parents('.nf_fieldset,.nf_listfield_container').removeClass('closed');
    }

    $('.nf_fieldset, .nf_listfield_container', ctx).each(function () {
        if ($(this).data('nf_fieldset'))
            return;
        $(this).data('nf_fieldset', true);

        var t = $(this),
            h2 = $('> h2, > label', t),
            div = $('> div', t),
            i = $('<i class="icon-chevron-right" />').prependTo(t);

        t.css('min-height', h2.height());

        t.off('click').click(function (e) {
            var is_closed = t.is('.closed');
            if (!(is_closed || $(e.target).is(h2) || $(e.target).is(i)))
                return;

            i.toggleClass('icon-chevron-right icon-chevron-down');

            t.toggleClass('closed');
            div.stop(1, 1).slideToggle('fast');
        });
        if (t.is('.nf_listfield_container')) {
            var length = $('.nf_listfield > ul > li', t).length;
            var summary = length ? length + ' items' : 'No items';
            t.append('<label class="list_summary">' + summary + '</label>');
            if (length <= MINIMUM_ITEM_COUNT_TO_EXPAND)
                t.click();
        }
    });
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
    if ($.fn.timepicker) $('.nf_timepicker', ctx).timepicker();
    $('[data-ref]', ctx).each(refLink);

    // Wire FilePicker widget. FieldBinding is done automagicly by type="filepicker"
    $('input[type=filepicker]', ctx).on('change', function (e) {
        e.preventDefault();
        //noinspection JSUnresolvedVariable
        var file = e.originalEvent.fpfile;
        $(this).val(JSON.stringify(file));
        var a = $(this).parent().find('a').text(file.filename).attr('href', file.url);
    })
}

function refLink() {
    var $this = $(this);
    $('<a href="#">' + ($this.val() ? 'Edit' : 'New') + '</a>')
        .insertAfter($this)
        .click(function () {
            var id = $this.val();
            var qry = $.map({
                width: $(window).width() - 100,
                height: $(window).height() - 100,
                top: 50,
                left: 50,
                scrollbars: 1
            },function (v, k) {
                return k + '=' + v;
            }).join(',');
            var url = root + '/model/' + $this.data('ref').toLocaleLowerCase() + '/document/' + (id || 'new') + '?_dialog=yes';
            var modal = $('#myModal');
            modal.on('show', function () {
                modal.find('iframe').attr("src", url);
                modal.find('h3').text('Edit ' + $this.data('ref'));
            });
            modal.modal({show:true});
            modal.on('hide', function (event) {
                var rsp = event.data;
                // on delete
                if (rsp.deleted) {
                    if ($this.is('select'))
                        $('option[value="' + id + '"]', $this).remove();
                    else
                        $this.select2('val', '');
                    $this.change();
                }
                // on create
                if (rsp.id && !id) {
                    if ($this.is('select')) {
                        $('option[selected]', $this).removeAttr('selected');
                        $('<option selected value="' + rsp.id + '" >' + rsp.label + '</option>').appendTo($this);
                    } else {
                        $this.select2('val', rsp.id);
                    }
                    $this.change();
                }
                // on update
                if (rsp.id && id && $this.is('select'))
                    $('option[value="' + id + '"]', $this).text(rsp.label);
            });
        });

    $this.change(function () {
        $(this).siblings('a').text($this.val() ? 'Edit' : 'New');
    });
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
            .appendTo($(this).prev())
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

        li.find('.nf_fieldset').toggleClass('closed');
        li.find('> .nf_fieldset').click();

        li.find('> ul').sortable({
            items: 'li:not(.new_li)',
            handle: '.nf_listfield_drag'
        });
        $('.list_summary', self.el.parent()).text(self.length ? self.length + ' items' : 'No items');
    };

    if (self.el.data('processed') == 'true')
        return;
    self.el.data('processed', 'true');

    self.el.closest('.field').addClass('nf_listfield_container');

    self.name = self.el.attr('name');

    var tpl = $('> .nf_hidden_template', el);
    tpl.find(".nf_listfield").addClass('closed');
    self.template = tpl.html();
    tpl.remove();

    self.list = $('> ul', el)
        .after(btn.add().click(self.add));

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
                    results: rsp.objects || rsp,
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

function deleteDocument() {
    $('#deleteButton').button('loading');
    $.post(
        root + '/json/dependencies',
        {
            model: window.model,
            id: $('#document_id').val()
        },
        function (result) {
            var msg = result.length
                ? 'there are some entities related to this entity: "' + result.join(', ') + '"'
                : 'Are you sure you want to delete?';

            bootbox.confirm(msg, function (res) {
                if (!res) return $('#deleteButton').button('reset');
                return $.ajax({
                    type: 'DELETE',
                    url: root + '/json/model/' + model + '/document?document_id=' + encodeURIComponent($('#document_id').val()),
                    success: function () {
                        $('#deleteButton').button('reset');
                        location.href = location.href.split('/document/')[0];
                    },
                    error: function (xhr, textStatus) {
                        $('#deleteButton').button('reset');
                        alert('Unable to delete');
                        console.error('Deleting error', arguments);
                    }
                });
            })
        }
    );
}

function initActions() {
    $('button.action').click(function (e) {
        e.preventDefault();

        var action_id = $(this).val();
        if (!action_id) return;

        var ids = [$('#document_id').val()];

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
                    if (dialog) {
                        dialogCallback({});
                    } else {
                        location.href = location.href.split('/document/')[0];
                    }
                }
            });
        });
    });

}

$(function () {
    initWidgets();

    $('form#document').submit(function () {
        $('p.submit button').prop('disabled', true);
    });
    if (dialog) {
        $('#cancelButton').click(function (e) {
            e.preventDefault();
            window.close();
        });
    }
    $('#deleteButton').click(deleteDocument);
    $('a.subCollection').click(function (event) {
        event.preventDefault();
        var href = $(this).attr('href');
        var qry = $.map({
            width: $(window).width() - 100,
            height: $(window).height() - 100,
            top: 50,
            left: 50,
            scrollbars: 1
        },function (v, k) {
            return k + '=' + v;
        }).join(',');
        var win = window.open(href + '&_dialog=yes', $(this).text().split('-')[0], qry);
    });

    initActions();
});
