// Entry point for the script
function onLoad(executionContext) {
    const formContext = executionContext.getFormContext();
    handleSubgrid(formContext);
}

// Handle subgrid logic
function handleSubgrid(formContext) {
    const subgrid = formContext.getControl("universitystudents_sg");

    if (subgrid === null) {
        // Retry after 2 seconds if subgrid is not loaded
        setTimeout(() => filterStudentSubgrid(formContext, subgrid), 2000);
    } else {
        filterStudentSubgrid(formContext, subgrid);
    }
}

// Fetch and apply filters to the subgrid
async function filterStudentSubgrid(formContext, subgrid) {
    const studentIds = await fetchStudentIds(formContext);
    const fetchXmlForStudents = buildFetchXmlForStudents(studentIds);

    subgrid.setFilterXml(fetchXmlForStudents);
    subgrid.refresh();
}

// Fetch student IDs based on institution ID
async function fetchStudentIds(formContext) {
    const institutionId = formContext.data.entity.getId();
    const fetchXml = buildFetchXmlForStudentHistory(institutionId);

    let studentIds = [];
    try {
        const result = await Xrm.WebApi.retrieveMultipleRecords("cfasms_studenteducationhistory", "?fetchXml=" + fetchXml);
        studentIds = result.entities.map(entity => entity._cfasms_student_value);
        return studentIds;
    } catch (error) {
        console.log(error.message);
        return error.message;
    }
}

// Build FetchXML for student history
function buildFetchXmlForStudentHistory(institutionId) {
    return [
        "<fetch version='1.0' output-format='xml-platform' mapping='logical'>",
        "<entity name='cfasms_studenteducationhistory'>",
        "<attribute name='cfasms_student' />",
        "<filter>",
        `<condition attribute='cfasms_institution' operator='eq' value='${institutionId}'/>`,
        "</filter>",
        "</entity>",
        "</fetch>"
    ].join("");
}

// Build FetchXML for students
function buildFetchXmlForStudents(studentIds) {
    const studentIdFilters = studentIds.map(id => `<value>${id}</value>`).join("");
    return [
        "<fetch version='1.0' output-format='xml-platform' mapping='logical'>",
        "<entity name='cfasms_students'>",
        "<all-attributes />",
        "<filter>",
        "<condition attribute='cfasms_studentsid' operator='in'>",
        studentIdFilters,
        "</condition>",
        "</filter>",
        "</entity>",
        "</fetch>"
    ].join("");
}
