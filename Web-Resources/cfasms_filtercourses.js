function onStudentChange(executionContext) {
    const formContext = executionContext.getFormContext();
    filterCourses(formContext);
}

async function filterCourses(formContext) {
    const studentLookup = formContext.getAttribute("cfasms_student").getValue();
    if (!studentLookup) return;

    const studentId = studentLookup[0].id;
    const institutionId = await fetchInstitutionId(studentId);
    const fetchXmlForCourses = buildFetchXmlForCourses(institutionId);

    setCustomCourseView(formContext, fetchXmlForCourses);
}

async function fetchInstitutionId(studentId) {
    const fetchXmlForInstitution = [
        "<fetch top='1'>",
        "<entity name='cfasms_studenteducationhistory'>",
        "<attribute name='cfasms_institution' />",
        "<filter>",
        `<condition attribute='cfasms_student' operator='eq' value='${studentId}'/>`,
        `<condition attribute='cfasms_iscurrentlyinprogress' operator='eq' value='1'/>`,
        "</filter>",
        "</entity>",
        "</fetch>"
    ].join("");

    const institutionResult = await Xrm.WebApi.retrieveMultipleRecords("cfasms_studenteducationhistory", "?fetchXml=" + fetchXmlForInstitution);
    return institutionResult.entities[0]._cfasms_institution_value;
}

function buildFetchXmlForCourses(institutionId) {
    return [
        "<fetch>",
        "<entity name='cfasms_courses'>",
        "<attribute name='cfasms_coursesid' />",
        "<attribute name='cfasms_coursename' />",
        "<filter>",
        `<condition attribute='cfasms_institution' operator='eq' value='${institutionId}'/>`,
        "</filter>",
        "</entity>",
        "</fetch>"
    ].join("");
}

function setCustomCourseView(formContext, fetchXmlForCourses) {
    const courseControl = formContext.getControl("cfasms_course");
    const viewId = "{29483495-0FB7-46BD-955D-90836AEAB3B1}"; // Generate a new GUID
    const entityName = "cfasms_courses";
    const viewDisplayName = "Filtered Courses";
    const layoutXml = [
        "<grid name='resultset' object='1' jump='cfasms_coursesid' select='1' icon='1' preview='1'>",
        "<row name='result' id='cfasms_coursesid'>",
        "<cell name='cfasms_coursename' width='300' />",
        "</row>",
        "</grid>"
    ].join("");

    courseControl.addCustomView(viewId, entityName, viewDisplayName, fetchXmlForCourses, layoutXml, true);
    courseControl.setDefaultView(viewId);
}
