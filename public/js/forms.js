(function () {
    'use strict';
    var MINIMUM_ITEM_COUNT_TO_EXPAND = 1;
    var btn = {
        delete:function () {
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
        drag:function () {
            return $('<div class="nf_listfield_drag"><i title="Drag to reorder" class="icon-resize-vertical"></i></div>');
        },
        add:function () {
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

            const onClick = () => {
                i.toggleClass('icon-chevron-right icon-chevron-down');
                t.toggleClass('closed');
                div.stop(1, 1).slideToggle('fast');
            }

            h2.off('click').click(onClick);
            i.off('click').click(onClick);

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
        if ($.fn.datepicker) {
            $('.nf_datepicker:not([readonly])', ctx).each(function(){
                if($(this).data('original'))
                    return;
                $(this).data('original',$(this).val());
                $(this).datepicker({format:'mm/dd/yyyy'});
            });
        }
        if($.fn.datetimepicker)
            $('.nf_timepicker:not([readonly])').on('changeDate',function(e){
                $(this).data('time', e.localDate);
            });
//        if ($.fn.timepicker) $('.nf_timepicker', ctx).timepicker({format:'MM/dd/yyyy HH:mm:ss PP'}).on('change', function(e) {
//            var val = $(this).val();
//            console.log(val);
//        });
        $('[data-ref]', ctx).each(refLink);
    }

    function createDialogCallback(win){
        return function(event){

        }
    }

    function refLink(){
        var sel = $(this);
        $('<a href="#">' + (sel.val() ? 'Edit' : 'New') + '</a>')
            .insertAfter(sel)
            .click(function () {
                var id = sel.val();
                var qry = $.map({
                    width:$(window).width() - 100,
                    height:$(window).height() - 100,
                    top:50,
                    left:50,
                    scrollbars:1
                },function (v, k) {
                    return k + '=' + v;
                }).join(',');
                var url = root + '/model/' + sel.data('ref') + '/document/' + (id || 'new') + '?_dialog=yes';
                var win = window.open(url, 'Edit ' + sel.data('ref'), qry);
                var onDialogMessage = function(event){
                    if(event.source != win)
                        return;
                    win = null;
                    window.removeEventListener('message',onDialogMessage);
                    var rsp = event.data;
                    // on delete
                    if(rsp.deleted){
                        if(sel.is('select'))
                            $('option[value="' + id + '"]',sel).remove();
                        else
                            sel.select2('val','');
                        sel.change();
                    }
                    // on create
                    if(rsp.id && !id){
                        if(sel.is('select')) {
                            $('option[selected]',sel).removeAttr('selected');
                            $('<option selected value="' + rsp.id + '" >' + rsp.label + '</option>').appendTo(sel);
                        }
                        else{
                            sel.select2('val',rsp.id);
                        }
                        sel.change();
                    }
                    // on update
                    if(rsp.id && id){
                        if(sel.is('select'))
                            $('option[value="' + id + '"]',sel).text(rsp.label);
                    }
                }
                window.addEventListener('message',onDialogMessage,false);
            });
        sel.change(function () {
            $(this).siblings('a').text(sel.val() ? 'Edit' : 'New');
        });
    }


    function ListField(el) {
        var self = this;
        self.el = $(el);

        self.add = function (e) {
            e.preventDefault();
            e.stopPropagation();
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
                items:'li:not(.new_li)',
                handle:'.nf_listfield_drag'
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
            items:'li:not(.new_li)',
            handle:'.nf_listfield_drag'
        });

        initWidgets(this);
    }


    var getQueryFunctionForSelect2 = function () {
        var jElem = $(this);

		var allowCustom = jElem.data('allowcustom');
        var required = jElem.is('.required_label');
        var query_url = jElem.data('url');
        var query_data = decodeURIComponent(jElem.data('data'));

        var initResult;
        jElem.select2({query:function (options) {
            var term = options.term;
            var page = options.page;
            var context = options.context;
            var callback = options.callback;
            query_data = decodeURIComponent(jElem.data('data'));
            $.get(query_url, {
                data:query_data,
                query:term
            }).success(function (rsp) {
                    var result = {
                        results:rsp.objects || rsp,
                        more:false,
                        context:context
                    };
                    if(initResult && result.results.filter(function(obj){
                        return obj.id == initResult.id;
                    }) == 0)
                        result.results.unshift(initResult);
					if(allowCustom){
						result.results.push({id:term,text:term});
					}
                    if(!required)
                        result.results.unshift({id:'',text:''});
                    callback(result);
                });
        },
            initSelection:function(element,callback){
                var id=$(element).val();
                if (id!=="") {
                    $.get(query_url, {
                        data:query_data,
                        id:id
                    }).done(function (rsp) {
                            initResult = rsp;
                            callback(rsp);
                        });
                }
            },
            minimumInputLength:0
        });
    };

    var deleteDocument = function () {
        $('#deleteButton').button('loading');
        $.post(
            root + '/json/dependencies',
            {
                model:model,
                id:$('#document_id').val()
            },
            function (result) {
                var msg = result.length
                    ? 'there are some entities related to this entity: "' + result.join(', ') + '"'
                    : 'Are you sure you want to delete?';

                if (confirm(msg))
                    $.ajax({
                        type:'DELETE',
                        url:root + '/json/model/' + model + '/document?document_id=' + encodeURIComponent($('#document_id').val()),
                        success:function (result) {
                            $('#deleteButton').button('reset');
                            if(dialog){
                                dialogCallback({deleted:true});
                            }
                            else
                                location.href = location.href.split('/document/')[0];
                        },
                        error:function (xhr, textStatus) {
                            $('#deleteButton').button('reset');
                            alert('Unable to delete');
                            console.error('Deleting error', arguments);
                        }
                    });
                else
                    $('#deleteButton').button('reset');
            }
        );
    };

    function dialogCallback(rsp){
        window.opener.postMessage(rsp,window.location.protocol + '//' + window.location.hostname);
        setTimeout(function(){
            window.close();
        },500);
    }

    function initActions(){
        $('button.action').click(function(e) {
            e.preventDefault();
            let ids = [$('#document_id').val()];
            actionClicked($(this),ids);
        });

    }

    $(function () {
        initWidgets();

        $('form#document').submit(function () {
            $('input[readonly],textarea[readonly]').remove();
            $('.nf_datepicker,.nf_timepicker').each(function(){
                if($(this).is('[readonly]'))
                    return;
                if(!$(this).val())
                    return;
                var $input = this.tagName == 'INPUT' ? $(this) : $('input',this);
                if($(this).val() == $(this).data('original')){
                    $input.remove();
                    return;
                }
                var data = $(this).data('datepicker') || $(this).data('datetimepicker');
                if(data){
                    var date = $(this).data('time') || data.date || data._date;
                    if(date && date != new Date()){
                        $input.val(Number(date));
                    }
                }
            });
            $('select[multiple]').each(function(){
                var val = $(this).val();
                if(!val){
                    $('<input type="hidden" name="' + $(this).attr('name') + '" value="">').insertAfter(this);
                    $(this).remove();
                }
            })
            $('p.submit button').prop('disabled', true);
        });
        if(dialog){
            $('#cancelButton').click(function(e){
                e.preventDefault();
                window.close();
            });
        }
        $('#deleteButton').click(deleteDocument);
        $('a.subCollection').click(function(event){
            event.preventDefault();
            var href = $(this).attr('href');
            var qry = $.map({
                width:$(window).width() - 100,
                height:$(window).height() - 100,
                top:50,
                left:50,
                scrollbars:1
            },function (v, k) {
                return k + '=' + v;
            }).join(',');
            var win = window.open(href +'&_dialog=yes',$(this).text().split('-')[0],qry);
        });
        initActions();

        if(hooks){
            let isSaved = location.search.indexOf('saved=true') > -1;
            let isCreated = location.search.indexOf('_created=true') > -1;
            if(isCreated && hooks.afterCreate){
                if(hooks.afterCreate.action){
                    $(`.action[value="${hooks.afterCreate.action}"]`).click();
                }
            }
        }
    });



})();
