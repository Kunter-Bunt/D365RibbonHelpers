function TriggerFlow(entityName, entityIds, fieldLogicalName, successMessageForUser, displayDuration, workingMessageForUser) {
    if (!successMessageForUser)
        successMessageForUser = "Operation successfully started!";

    if (!workingMessageForUser)
        workingMessageForUser = "Starting Operation ...";

    if (!displayDuration)
        displayDuration = 5000;

    Xrm.Utility.showProgressIndicator(workingMessageForUser);

    var promises = [];
    if (Array.isArray(entityIds)) {
        entityIds.forEach((entityId) => promises.push(UpdateRecord(entityName, entityId, fieldLogicalName, displayDuration)));
    }
    else
        promises.push(UpdateRecord(entityName, entityIds, fieldLogicalName, displayDuration));

    Promise.all(promises)
        .then(() => {
            Xrm.Utility.closeProgressIndicator();
            GlobalNotification(1, successMessageForUser, displayDuration)
        })
        .catch(() => {
            Xrm.Utility.closeProgressIndicator();
            // No output here, it is done per error
        });
}

function UpdateRecord(entityName, entityId, fieldLogicalName, displayDuration) {
    var updateEntity = {};
    updateEntity[fieldLogicalName] = new Date();

    return Xrm.WebApi.updateRecord(entityName, entityId, updateEntity).then(
        (result) => {
            // No output here, it is done in total
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

function TriggerFlowQuery(gridContext, fieldLogicalName, optionsString) {
    var options = JSON.parse(optionsString ?? "{}");

    if (!options.successMessage)
        options.successMessage = "Operation successfully started!";

    if (!options.workingMessage)
        options.workingMessage = "Starting Operation ...";

    if (!options.confirmMessage)
        options.confirmMessage = "Do you want to start the Operation on {count} records?";

    if (!options.confirmTitle)
        options.confirmTitle = "Continue?";

    if (!options.displayDuration)
        options.displayDuration = 5000;

    var entityName = gridContext.getEntityName();
    var fetchXml = gridContext.getFetchXml();

    ProcessAllRecords(entityName, fetchXml, fieldLogicalName, options);
}

function ProcessAllRecords(entityName, fetchXml, fieldLogicalName, options) {
    Xrm.Utility.showProgressIndicator(options.workingMessage);
    retrieveAllRecords(entityName, fetchXml, null, 5000, null).then(
        function success(entities) {
            Xrm.Utility.closeProgressIndicator();

            var confirmStrings = {
                text: options.confirmMessage.replace("{count}", entities.length),
                title: options.confirmTitle,
            };

            Xrm.Navigation.openConfirmDialog(confirmStrings).then(
                function confirmed(success) {
                    if (!success.confirmed)
                        return;

                    Xrm.Utility.showProgressIndicator(options.workingMessage);

                    var promises = [];
                    entities.forEach((entity) => promises.push(UpdateRecord(entityName, entity[entityName + "id"], fieldLogicalName, options.displayDuration)));

                    Promise.all(promises)
                        .then(() => {
                            Xrm.Utility.closeProgressIndicator();
                            GlobalNotification(1, options.successMessage, options.displayDuration)
                        })
                        .catch(() => {
                            Xrm.Utility.closeProgressIndicator();
                            // No output here, it is done per error
                        });
                });
        }).catch(() => {
            Xrm.Utility.closeProgressIndicator();
            // No output here, it is done per error
        });
}

function CreateXml(fetchXml, pagingCookie, page, count) {
    var domParser = new DOMParser();
    var xmlSerializer = new XMLSerializer();

    var fetchXmlDocument = domParser.parseFromString(fetchXml, "text/xml");

    if (page) {
        fetchXmlDocument
            .getElementsByTagName("fetch")[0]
            .setAttribute("page", page.toString());
    }

    if (count) {
        fetchXmlDocument
            .getElementsByTagName("fetch")[0]
            .setAttribute("count", count.toString());
    }

    if (pagingCookie) {
        var cookieDoc = domParser.parseFromString(pagingCookie, "text/xml");
        var innerPagingCookie = domParser.parseFromString(
            decodeURIComponent(
                decodeURIComponent(
                    cookieDoc
                        .getElementsByTagName("cookie")[0]
                        .getAttribute("pagingcookie")
                )
            ),
            "text/xml"
        );
        fetchXmlDocument
            .getElementsByTagName("fetch")[0]
            .setAttribute(
                "paging-cookie",
                xmlSerializer.serializeToString(innerPagingCookie)
            );
    }

    return xmlSerializer.serializeToString(fetchXmlDocument);
}

function retrieveAllRecords(entityName, fetchXml, page, count, pagingCookie) {
    if (!page) {
        page = 0;
    }

    return retrievePage(entityName, fetchXml, page + 1, count, pagingCookie).then(
        function success(pageResults) {
            if (pageResults.fetchXmlPagingCookie) {
                return retrieveAllRecords(
                    entityName,
                    fetchXml,
                    page + 1,
                    count,
                    pageResults.fetchXmlPagingCookie
                ).then(
                    function success(results) {
                        if (results) {
                            return pageResults.entities.concat(results);
                        }
                    },
                    function error(e) {
                        throw e;
                    }
                );
            } else {
                return pageResults.entities;
            }
        },
        function error(e) {
            throw e;
        }
    );
}

function retrievePage(entityName, fetchXml, pageNumber, count, pagingCookie) {
    var fetchXml =
        "?fetchXml=" + CreateXml(fetchXml, pagingCookie, pageNumber, count);

    return Xrm.WebApi.online.retrieveMultipleRecords(entityName, fetchXml).then(
        function success(result) {
            return result;
        },
        function error(e) {
            throw e;
        }
    );
}