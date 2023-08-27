function onStudentChange(executionContext) {
    const formContext = executionContext.getFormContext();
    filterCourses(formContext).then({
    });
}

async function filterCourses(formContext) {
    const studentLookup = formContext.getAttribute("cfasms_student").getValue();
    if (!studentLookup) return; // Exit if no student is selected

    const studentId = studentLookup[0].id;

    // Step 1: Fetch the institution ID where the student is currently enrolled
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
    const institutionId = institutionResult.entities[0]._cfasms_institution_value;

    // Step 2: Fetch the courses available in the institution
    const fetchXmlForCourses = [
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
    // const coursesToDisplay = Xrm.WebApi.retrieveMultipleRecords("cfasms_studenteducationhistory", "?fetchXml=" + fetchXmlForCourses);
    const courseControl = formContext.getControl("cfasms_course");

    // Step 3: Set the available options for the cfasms_course lookup field
    // Step 3: Create Custom View
    const viewId = "{29483495-0FB7-46BD-955D-90836AEAB3B1}"; // Generate a new GUID
    const entityName = "cfasms_courses";
    const viewDisplayName = "Filtered Courses";
    const layoutXmlArray = [
        "<grid name='resultset' object='1' jump='cfasms_coursesid' select='1' icon='1' preview='1'>",
        "<row name='result' id='cfasms_coursesid'>",
        "<cell name='cfasms_coursename' width='300' />",
        "</row>",
        "</grid>"
    ];
    const layoutXml = layoutXmlArray.join("");

    courseControl.addCustomView(viewId, entityName, viewDisplayName, fetchXmlForCourses, layoutXml, true);
    courseControl.setDefaultView(viewId);

}