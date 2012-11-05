var btn = {
    delete: function () {
        return $('<button class="nf_listfield_delete"><i class="icon-remove"></i></button>')
            .click(function (e) {
                e.preventDefault();
                $($(this).parent()).slideUp(400, function () {
                    $(this).remove();
                });
            });
    },
    drag: function () {
        return $('<div class="nf_listfield_drag"><i title="Drag to reorder" class="icon-resize-vertical"></i></div>');
    },
    add: function() {
        return $('<button class="nf_add btn btn-warning"><i class="icon-plus icon-white"></i> Add Item</button>');
    }
};

var fieldset = function (ctx) {
    if (ctx == document.body) {
        $('.nf_fieldset').addClass('closed');
        $('.error').parents('.nf_fieldset > div').show();
    }

    $('.nf_fieldset', ctx).each(function() {
        if ($(this).data('nf_fieldset'))
            return;
        $(this).data('nf_fieldset', true);

        var t = $(this),
            h2 = $('> h2', t),
            div = $('> div', t),
            i = $('<i class="icon-chevron-right" />').prependTo(t);

        t.css('min-height', h2.height());

        t.off('click').click(function(e) {
            if (!(t.is('.closed') || $(e.target).is(h2) || $(e.target).is(i)))
                return;

            i.toggleClass('icon-chevron-right')
                .toggleClass('icon-chevron-down');

            t.toggleClass('closed');
            div.stop(1,1).slideToggle('fast');
        });
    });
};

var ListField = function(el) {
    var self = this;
    self.el = $(el);

    self.init = function() {
        if (self.el.data('processed') == 'true')
            return;
        self.el.data('processed','true');

        var container = self.el.closest('.field').addClass('nf_listfield_container');

        self.name = self.el.attr('name');

        var tpl = $('> .nf_hidden_template', el);
        self.template = tpl.html();
        tpl.remove();

        self.list = $('> ul', el)
            .prepend(btn.add().click(self.add));

        self.length = $('> li', self.list)
            .prepend(btn.drag())
            .prepend(btn.delete())
            .length;

        self.list.sortable({
            items: 'li:not(.new_li)',
            handle: '.nf_listfield_drag',
            update: function() {
                var i = 0;

                $('>li', this).each(function(){
                    var li = this;
                    $('[name]', li).each(function() {
                        var input = $(this);
                        input.attr('name', input.attr('name').replace(new RegExp(self.name + '_li[0-9]+_'), self.name + '_li' + i + '_'));
                    });
                    i++;
                });
            }
        });

        widgets(this);
    };

    self.add = function(e) {
        e.preventDefault();

        var li = $('<li />').hide()
            .append(self.template)
            .prepend(btn.delete())
            .prepend(btn.drag())
            .insertAfter(this)
            .slideDown(function() {
                $('input:first', li).focus();
            });

        $('[name]', li).each(function() {
            var input = $(this);
            input.attr(
                'name',
                input.attr('name')
                    .replace(self.name + '_tmpl_',self.name + '_li' + self.length + '_')
            );
        });

        self.length++;

        // load nested widgets
        widgets(li);
    };

    self.init();
};

var widgets = function(ctx) {
    ctx = ctx || document.body;

    $('.nf_listfield', ctx).each(function() {
        $(this).data('listfield', new ListField(this));
    });

    fieldset(ctx);

//    if ($.fn.datetimepicker)
//        $('.nf_datepicker', ctx).datetimepicker();

    if ($.fn.select2)
        $('select', ctx).select2();

    if ($.fn.datepicker)
        $('.nf_datepicker', ctx).datepicker({
            format: 'dd/mm/yyyy'
        });

    if ($.fn.timepicker)
        $('.nf_timepicker', ctx).timepicker();

    $('.nf_timepicker, .nf_datepicker, input[type=checkbox]')
        .closest('label').css('display', 'inline-block');
};


$(function(){
    $('p.error').hide().slideDown();

    $('.optional_label').each(function() {
        $('label[for="' + this.id  + '"]').addClass('optional_label');
    });

    widgets();

    $('form#document').submit(function(e) {
        $('p.submit button').prop('disabled', true);
        var btn = $('#saveButton');
//        btn.text(btn.data('saving-text'));
    });
});