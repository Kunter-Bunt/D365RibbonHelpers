function TriggerFlow(entityName, entityId, fieldLogicalName, messageForUser, displayDuration) {
    if (!messageForUser)
        messageForUser = "Operation successfully started!";

    if (!displayDuration)
        displayDuration = 5000;

    var updateEntity = {};
    updateEntity[fieldLogicalName] = new Date();

    Xrm.WebApi.updateRecord(entityName, entityId, updateEntity).then(
        (result) => {
            GlobalNotification(1, messageForUser, displayDuration);
        },
        (error) => {
            GlobalNotification(2, error.message, displayDuration);
        }
    );
}


function GlobalNotification(level, messageForUser, displayDuration) {
    var notification = {
        level: level,
        message: messageForUser,
        showCloseButton: true,
        type: 2
    };

    Xrm.App.addGlobalNotification(notification).then(
        (id) => {
            window.setTimeout(ClearGlobalNotification.bind(this, id), displayDuration);
        },
        (error) => { console.log(error); });
}

function ClearGlobalNotification(id) {
    Xrm.App.clearGlobalNotification(id)
}

function TriggerFlowFormOnly(formContext, fieldLogicalName, messageForUser, displayDuration) {
    if (!messageForUser)
        messageForUser = "Operation successfully started!";

    if (!displayDuration)
        displayDuration = 5000;

    formContext.getAttribute(fieldLogicalName).setValue(new Date());

    formContext.data.save().then(
        (result) => {
            GlobalNotification(1, messageForUser, displayDuration);
        },
        (error) => {
            GlobalNotification(2, error.message, displayDuration);
        }
    );
}