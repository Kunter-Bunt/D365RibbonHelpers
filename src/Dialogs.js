function OpenDialog(pageName, entityName, entityIds, height, width, unit){
    if (!height)
        height = 80;

    if (!width)
        width = 80;

    if (!unit)
        unit = "%";

    if (typeof entityIds === "string")
        entityIds = entityIds.replace("{", "").replace("}","").toLowerCase();

    if (Array.isArray(entityIds))
        entityIds = entityIds.join(",").replace("{", "").replace("}","").toLowerCase();

    var options = {
        target: 2,
        width: {
            value: width,
            unit: unit
        },
        height: {
            value: height,
            unit: unit
        }
    }

    var input = {
        pageType: "custom",
        name: pageName,
        entityName: entityName,
        recordId: entityIds
    }
    
    Xrm.Navigation.navigateTo(input,options).then(
        () => console.log("Dialog opened"), 
        (error) => console.log(error)
    );
}