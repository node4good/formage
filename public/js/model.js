$(function() {
    $('.free_search').click(function() {
        var value = $(this).siblings('input').val();
        var href = $(this).data('href').replace('__replace__', encodeURIComponent(value));
        window.location.href = href;
    });

    $('#go_button').click(function(){
        var action_id = $('.actions').val();
        if(action_id)
        {
            var ids = [];
            $('.select_row input[type=checkbox]:checked').each(function(){
                ids.push($(this).parents('tr').attr('elm_id'));
            });

            $.post('#{rootPath}/json/model/#{modelName}/action/' + action_id ,{ids:ids},function(data){

                window.location.href = window.location.href;
            });
        }
    });

    $('tbody').sortable({
        update:function()
        {
            /*var new_li = $('li.new_li',list).remove();
             new_li.appendTo(list);
             var i = 0;
             $('>li',this).each(function(){
             var li = this;
             //                   if($(this).is('.new_li'))
             //                       return;
             $('[name]',li).each(function() {
             var input = $(this);
             input.attr('name',input.attr('name').replace(RegExp(name + '_li[0-9]+_'),name + '_li' + i + '_'));
             });
             i++;
             });
             */
            if($('p.buttons button#reorder').length == 0)
            {
                var save_button = $('<button id="reorder" type="button">Save order</button>').click(function(){
                    var data = {};
                    $('tr:has(td.sortable)').each(function(index,ui){
                        var id = $(this).attr('elm_id');
                        data[id] = index + startIndex;
                    });
                    $.post('#{rootPath}/json/model/#{modelName}/order',data,function(err){
                        alert('saved');
                    });
                    $(this).remove();
                }).appendTo('p.buttons');

            }
        },
        items:'tr:has(td.sortable)',
        handle:'div.nf_listfield_drag'
    });
});