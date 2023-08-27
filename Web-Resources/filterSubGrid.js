/**
 * Entry point function that runs on tab state change of the Institution main form.
 *
 * @param {Object} executionContext - The execution context object.
 *
 * It does the following:
 *
 * 1. Gets the form context from the executionContext.
 * 2. Calls the handleSubgrid() function, passing it the formContext.
 *
 * This will start the logic to handle filtering the subgrid on form load.
 */
function onLoad(executionContext) {
    const formContext = executionContext.getFormContext();
    handleSubgrid(formContext);
}

/**
 * Handles logic to filter the student subgrid control.
 *
 * @param {Object} formContext - The form context object.
 *
 * It does the following:
 *
 * 1. Gets the student subgrid control from the formContext.
 *
 * 2. Checks if the subgrid is null:
 *    - If null, waits 2 seconds and retries filtering the subgrid. This handles async load.
 *    - If not null, calls filterStudentSubgrid() passing formContext and subgrid.
 *
 * This allows retrying the filter if the subgrid hasn't loaded yet.
 */
function handleSubgrid(formContext) {
    const subgrid = formContext.getControl("universitystudents_sg");

    if (subgrid === null) {
        // Retry after 2 seconds if subgrid is not loaded
        setTimeout(() => filterStudentSubgrid(formContext, subgrid), 2000);
    } else {
        filterStudentSubgrid(formContext, subgrid);
    }
}

/**
 * Fetches and applies filters to the student subgrid.
 *
 * @param {Object} formContext - The form context object.
 * @param {Object} subgrid - The student subgrid control.
 *
 * It does the following:
 *
 * 1. Calls fetchStudentIds() to get the list of student IDs for the institution.
 *
 * 2. Passes the student IDs to buildFetchXmlForStudents() to build the FetchXML filter.
 *
 * 3. Sets the filter on the subgrid with setFilterXml().
 *
 * 4. Refreshes the subgrid to apply the filter.
 *
 * This will filter the subgrid to only show students for the current institution.
 */
async function filterStudentSubgrid(formContext, subgrid) {
    const studentIds = await fetchStudentIds(formContext);
    const fetchXmlForStudents = buildFetchXmlForStudents(studentIds);

    subgrid.setFilterXml(fetchXmlForStudents);
    subgrid.refresh();
}

/**
 * Fetches the student IDs for the given institution.
 *
 * @param {Object} formContext - The form context object.
 *
 * It does the following:
 *
 * 1. Gets the institution ID from the form context.
 *
 * 2. Calls buildFetchXmlForStudentHistory() to build the FetchXML.
 *
 * 3. Executes a Web API retrieveMultipleRecords request with the FetchXML.
 *
 * 4. Maps the returned entities to extract just the student ID values.
 *
 * 5. Returns the array of student IDs.
 *
 * @returns {Array} The array of student ID values for the institution.
 */
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

/**
 * Builds a FetchXML query to get student history records for an institution.
 *
 * @param {string} institutionId - The institution ID to filter on.
 *
 * It does the following:
 *
 * 1. Sets the table as cfasms_studenteducationhistory.
 * 2. Retrieves the cfasms_student attribute.
 * 3. Adds a filter for the cfasms_institution equal to the institutionId.
 *
 * @returns {string} The FetchXML query string.
 */
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

/**
 * Builds a FetchXML query to filter students by their IDs.
 *
 * @param {Array} studentIds - Array of student ID values to filter on.
 *
 * It does the following:
 *
 * 1. Maps the studentIds to <value> nodes for the IN condition.
 * 2. Builds a FetchXML query for the cfasms_students table.
 * 3. Adds a filter condition for cfasms_studentsid IN the student IDs.
 *
 * @returns {string} The FetchXML query string.
 */
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
