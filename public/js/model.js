$(function() {
    //noinspection JSUnresolvedVariable
    var url = root + '/json/model/' + model;

    $('.free_search').click(function() {
        var value = $(this).siblings('input').val();
        location.href = $(this).data('href').replace('__replace__', encodeURIComponent(value));
    });


    // highlight rows
    $('tbody tr').each(function() {
        var tr = $(this);
        $('.select-row', tr).change(function() {
            tr.toggleClass('warning', $(this).prop('checked'));
        });
    });

    $('.select-all-rows').click(function() {
        $(this).closest('table').find('.select-row')
            .prop('checked', $(this).prop('checked'))
            .trigger('change');
    });

    var $actions = $('#actions');
    var shownCount = 0;
    $('.select-row').on('change', function() {
        var selectCount = $('.select-row:checked').length;
        var shownButtons = $('#actions button' + (selectCount > 1 ? '[data-multi="true"]' : ''));
        var newShownCount = selectCount ? shownButtons.length : 0;
        if(newShownCount != shownCount){
            if(!shownCount){
                shownButtons.show();
                $('#actions button').not(shownButtons).hide();
                $actions.fadeIn('fast');

            }
            else {
                if(newShownCount){
                    $actions.fadeOut('fast',function(){
                        shownButtons.show();
                        $('#actions button').not(shownButtons).hide();
                        $actions.fadeIn('fast');
                    });
                }
                else
                    $actions.fadeOut('fast');
            }
        }
        shownCount = newShownCount;
    });

    $actions.find('button').click(function(e) {
        e.preventDefault();

        var action_id = $(this).val();
        if (!action_id) return;

        var ids = [];
        $('.select-row:checked').each(function(){
            ids.push($(this).closest('tr').attr('id'));
        });
        if (!ids.length) return;

        var dialogs = $(this).data('dialogs');

        if(dialogs){
            dialogs = dialogs.split(',');
            var i=0;
            var allData = {};
            var cbk = function(data){
                $.extend(allData,data);
                if(i < dialogs.length)
                    formageDialog(dialogs[i++],cbk);
                else
                    fireAction(allData);
            }
            return cbk();
        }
        var msg = 'Are you sure you want to ' + $(this).text().toLowerCase() + ' ' + ids.length + ' documents?';

        function fireAction(data){
            $.post(url + '/action/' + action_id, { ids: ids,data:data }).always(function(data) {
                if (data.responseText) data = JSON.parse(data.responseText);
                if (data.error) {
                    bootbox.dialog("Some documents failed: " + data.error, [{
                        "label" : "Error",
                        "class" : "btn-danger",
                        "callback": function() {
                            location.reload();
                        }}]);
                } else {
                    if(data.result)
                        bootbox.alert(data.result,function(){
                            location.reload();
                        });
                    else
                        location.reload()
                };
            });
        }

        bootbox.confirm(msg, function(result) {
            if (!result) return;
            fireAction();
        });
    });

    var btn = $('button#reorder');
    $('tbody.sortable').sortable({
        items: 'tr',
        handle: '.list-drag',
        placeholder: 'sortable-placeholder',
        axis: 'y',
        create: function(e) {
            btn.click(function(){
                btn.button('loading');

                var data = {};
                $('tr', e.target).each(function(index){
                    var id = $(this).attr('id');
                    //noinspection JSUnresolvedVariable
                    data[id] = index + startIndex;
                });

                $.post(
                    url + '/order',
                    data,
                    function() {
                        btn.button('saved')
                            .delay(1000)
                            .fadeOut('slow')
                            .queue(function(next) {
                                btn.button('reset');
                                next();
                            });
                    }
                );
            })
        },
        change: function() {
            btn.fadeIn('fast');
        }
    });
});
