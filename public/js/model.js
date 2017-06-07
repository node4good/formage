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
        let ids = [];
        $('.select-row:checked').each(function(){
            ids.push($(this).closest('tr').attr('id'));
        });
        actionClicked($(this),ids);
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
