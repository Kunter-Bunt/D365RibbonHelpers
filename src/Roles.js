function HasRole(roleNameToCheck) {
    var userRoles = Xrm.Utility.getGlobalContext().userSettings.roles;
    var roleNames = [];
    userRoles.forEach(item=>roleNames.push(item.name))

    console.log("Roles of the user: ", roleNames, "; checking against: ", roleNameToCheck);
    return roleNames.includes(roleNameToCheck);
}