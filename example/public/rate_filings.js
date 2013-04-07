$.fn.addSelectAll = function() {
    var boxes = $('input[type=checkbox]', this),
        num = boxes.length;

    var all =
        $('<div class="field">' +
            '<label class="field_label"><strong>Select All</strong></label>' +
            '<input type="checkbox" class="select-all" />' +
        '</div>')
        .prependTo(this)
        .find('input')
        .on('change', function() {
            boxes.prop('checked', $(this).prop('checked'));
        });

    boxes.on('change', function() {
        var checked = boxes.filter(':checked').length;
        if (checked < num)
            all.prop('checked', false);
        else if (checked == num)
            all.prop('checked', true);
    });

    return this;
};

$(function() {
    $('.nf_fieldset').click();

    $('.nf_fieldset:first > div').addSelectAll()
        .append('<br class="clear" />')
        .addClass('factors');
});