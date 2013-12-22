'use strict';
/*global root,model*/
$(function () {
    var url = root + '/json/model/' + model;

    $('.free_search').click(function () {
        var $this = $(this);
        var $input = $this.parent().siblings('input');
        var value = encodeURIComponent($input.val());
        var name = $input.attr('name');
        var q = $.parseQueryString();
        q[name] = value;
        location.search =  '?' + $.param(q);
    });


    // highlight rows
    $('tbody tr').each(function () {
        var tr = $(this);
        $('.select-row', tr).change(function () {
            tr.toggleClass('warning', $(this).prop('checked'));
        });
    });

    $('.select-all-rows').click(function () {
        $(this).closest('table').find('.select-row')
            .prop('checked', $(this).prop('checked'))
            .trigger('change');
    });

    var $actions = $('#actions');
    $('.select-row').on('change', function () {
        if ($('.select-row:checked').length) {
            $actions.fadeIn('fast');
        }
        else {
            $actions.fadeOut('fast');
        }
    });

    $actions.find('button').click(function (e) {
        e.preventDefault();

        var action_id = $(this).val();
        if (!action_id) return;

        var ids = $('.select-row:checked').closest('tr').map(function () {return this.id;}).get();
        if (!ids.length) return;

        var msg = 'Are you sure you want to ' + $(this).text().toLowerCase() + ' ' + ids.length + ' documents?';

        bootbox.confirm(msg, function (result) {
            if (!result) return;

            $.post(url + '/action/' + action_id, { ids: ids })
                .done(function (data) {
                    bootbox.dialog(data.join('<br>'), [{"label": "Notice", "callback": location.reload.bind(location)}]);
                })
                .fail(function (data) {
                    if (data.responseText) data = JSON.parse(data.responseText);
                    if (!data.error) { location.reload(); return; }
                    bootbox.dialog(
                        "Some documents failed: <br>" + data.error,
                        [{"label": "Error", "class": "btn-danger", "callback": location.reload.bind(location)}]
                    );
                });
        });
    });


    var btn = $('button#reorder');
    $('tbody.sortable').sortable({
        items: 'tr',
        handle: '.list-drag',
        placeholder: 'sortable-placeholder',
        axis: 'y',
        create: function (e) {
            btn.click(function () {
                btn.button('loading');

                var data = {};
                $('tr', e.target).each(function (index) {
                    var id = $(this).attr('id');
                    //noinspection JSUnresolvedVariable
                    data[id] = index + startIndex;
                });

                $.post(
                    url + '/order',
                    data,
                    function () {
                        window.onbeforeunload = null;
                        btn.button('saved')
                            .delay(1000)
                            .fadeOut('slow')
                            .queue(function (next) {
                                btn.button('reset');
                                next();
                            });
                    }
                );
            })
        },
        change: function () {
            btn.fadeIn('fast');
            window.onbeforeunload = function () {
                return 'Are you sure you want to leave before you click save.';
            };
        }
    });
});
