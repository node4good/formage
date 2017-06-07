"use strict";

function actionClicked($button, ids) {
    const url = root + '/json/model/' + model;
    let action_id = $button.val();
    if (!action_id)
        return;

    if (!ids.length)
        return;

    const fireAction = (data)  => {
        $.ajax({
            url: url + '/action/' + action_id,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ids: ids, data: data})
        }).always(data => {
            if (data.responseText)
                data = JSON.parse(data.responseText);

            if (data.error) {
                return bootbox.dialog(data.error || 'Failed', [{
                    "label": "Error",
                    "class": "btn-danger",
                    "callback": function () {
                        location.reload();
                    }
                }]);
            }

            if (data.result) {
                if (data.result.redirect)
                    return location.href = data.result.redirect;
                return bootbox.alert(data.result, function () {
                    location.reload();
                });
            }
            location.reload()
        });
    }

    let dialogs = $button.data('dialogs');
    if (dialogs) {
        dialogs = dialogs.split(',');
        let i = 0;
        let allData = {};
        let cbk;
        cbk = data => {
            $.extend(allData, data);
            if (i < dialogs.length)
                formageDialog(dialogs[i++], cbk);
            else
                fireAction(allData);
        }
        return cbk();
    }
    let confirm = $button.data('confirm');
    if (confirm === 'false' || confirm === false)
        return fireAction();

    let msg = confirm && confirm != 'true' && typeof(confirm) == 'string' ? confirm : `Are you sure you want to ${$button.text().toLowerCase()}?`;
    bootbox.confirm(msg, result => {
        if (!result) return;
        fireAction();
    });

}