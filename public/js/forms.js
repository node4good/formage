var update_fieldset_behavior = function () {
    $('.nf_fieldset').each(function() {
        var t = $(this),
            h2 = $('> h2', this),
            div = $('> div', this),
            i = $('<i class="icon-chevron-right" />').prependTo(this);

        t.click(function(e) {
            if (!(t.is('.closed') || $(e.target).is(h2) || $(e.target).is(i)))
                return;

            console.log(this);

            i.toggleClass('icon-chevron-right')
                .toggleClass('icon-chevron-down');

            t.toggleClass('closed');
            div.stop(1,1).slideToggle('fast');
        });
    });
};

var init_listfield = function () {
    $('.nf_listfield').each(function()
    {
        if($(this).attr('processed') == 'true')
            return;
        $(this).attr('processed','true');
        $('<br />').insertBefore($(this).parent());
        var name = $(this).attr('name');
        var template = $('>.nf_hidden_template',this).hide();
        var list = $('>ul',this);
        function make_delete_button()
        {
            return $('<button class="nf_listfield_delete" type="button"></button>').click(function()
            {
                $($(this).parent()).slideUp(400,function()
                {
                    $(this).remove();
                });
                //                ,function(){
                //                    $(this).remove();
                //                });
            });
        }
        function make_drag_button()
        {
            return $('<div class="nf_listfield_drag" type="button"></div>');
        }
        var length = $('>li',list).prepend(make_drag_button()).prepend(make_delete_button()).length;
        function add_new()
        {
            var new_elm = $('<li></li>');
            new_elm.append(template.html()).addClass('new_li').prepend($('<button class="nf_listfield_append" type="button"></button>').click(function()
            {

                var li = $($(this).parent('li')).prepend(make_drag_button()).prepend(make_delete_button()).removeClass('new_li');
                $('[name]',li).each(function()
                {
                    var input = $(this);
                    input.attr('name',input.attr('name').replace(name + '_tmpl_',name + '_li' + length + '_'));
                });
                length++;
                $(this).remove();
                add_new();
                update_fieldset_behavior();
            }));
            list.prepend(new_elm);
            if($().datetimepicker)
                $('.nf_datepicker',new_elm).attr("id", "")
                    .removeClass('hasDatepicker')
                    .removeData('datepicker')
                    .unbind()
                    .datetimepicker();
            init_listfield();
            if(window.loadAutocomplete){
                destroyAutocomplete(new_elm);
                loadAutocomplete(new_elm);
            }
        }
        add_new();
        list.sortable({
            update:function()
            {
                //                var new_li = $('li.new_li',list).remove();
                //                new_li.appendTo(list);
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
            },
            items:'li:not(.new_li)',
            handle:'.nf_listfield_drag'
        });
        if($().datetimepicker)
            $('.nf_datepicker',this).datetimepicker();

    });
};

var go_back = function () {
    location.href = location.href.split('/document/')[0];
};

$(function(){
    $('.nf_fieldset > div').hide();
    $('.nf_fieldset').addClass('closed');
    $('.error').parents('.nf_fieldset > div').show();
    $('p.error').hide().slideDown();

    $('.optional_label').each(function() {
        $('label[for="' + this.id  + '"]').addClass('optional_label');
    });

    init_listfield();
    update_fieldset_behavior();

    if ($().datetimepicker)
        $('.nf_datepicker').datetimepicker();

    if (window.loadAutocomplete)
        loadAutocomplete();
});