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
        return $('<div class="nf_listfield_drag"><i class="icon-resize-vertical"></i></div>');
    },
    add: function () {
        return $('<button class="nf_listfield_append"><i class="icon-plus"></i></button>');
    }
};

var updateFieldset = function () {
    $('.nf_fieldset').each(function() {
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
//        $('<i class="icon-chevron-right" />').appendTo(container);

        self.name = self.el.attr('name');
        self.template = $('> .nf_hidden_template', el).hide();
        self.list = $('> ul', el);
        self.length = $('> li', self.list)
            .prepend(btn.drag())
            .prepend(btn.delete())
            .length;

        self.add(true);

        self.list.sortable({
            items: 'li:not(.new_li)',
            handle: '.nf_listfield_drag',
            update: function() {
                var i = 0;

                $('>li', this).each(function(){
                    var li = this;
                    //                   if ($(this).is('.new_li'))
                    //                       return;
                    $('[name]', li).each(function() {
                        var input = $(this);
                        input.attr('name', input.attr('name').replace(new RegExp(self.name + '_li[0-9]+_'), self.name + '_li' + i + '_'));
                    });
                    i++;
                });
            }
        });

        if ($().datetimepicker)
            $('.nf_datepicker', this).datetimepicker();
    };

    self.add = function(init) {
        var el = $('<li class="new_li" />').hide()
            .prepend(btn.add().click(self.addClick))
            .append(self.template.html())
            .prependTo(self.list)
            .slideDown(init ? 0 : 'normal');

        if($().datetimepicker)
            $('.nf_datepicker', el)
                .attr('id', '')
                .removeClass('hasDatepicker')
                .removeData('datepicker')
                .off()
                .datetimepicker();

//        self.init();

        if (window.loadAutocomplete) {
            destroyAutocomplete(el);
            loadAutocomplete(el);
        }
    };

    self.addClick = function() {
        var li = $($(this).closest('li'))
            .prepend(btn.delete())
            .prepend(btn.drag())
            .removeClass('new_li');

        $('[name]', li).each(function() {
            var input = $(this);
            input.attr(
                'name',
                input.attr('name')
                    .replace(self.name + '_tmpl_',self.name + '_li' + self.length + '_')
            );
        });

        self.length++;
        $(this).remove();

        self.add();
        updateFieldset();
    };

    self.init();
};


$(function(){
    $('.nf_fieldset').addClass('closed');
    $('.error').parents('.nf_fieldset > div').show();
    $('p.error').hide().slideDown();

    $('.optional_label').each(function() {
        $('label[for="' + this.id  + '"]').addClass('optional_label');
    });

    $('form#document').submit(function(e) {
        $('p.submit button').prop('disabled', true);
        var btn = $('#saveButton');
//        btn.text(btn.data('saving-text'));
    });

    $('.nf_listfield').each(function() {
        $(this).data('listfield', new ListField(this));
    });
    updateFieldset();

    if ($().datetimepicker)
        $('.nf_datepicker').datetimepicker();

    if (window.loadAutocomplete)
        loadAutocomplete();
});