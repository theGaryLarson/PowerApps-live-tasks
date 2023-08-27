/**
 * This function is called when the student field value changes on the form.
 *
 * @param {Object} executionContext - The execution context object containing information about the form context.
 *
 * The function does the following:
 * 1. Gets the form context from the executionContext parameter.
 * 2. Calls the filterCourses() function, passing it the formContext.
 *
 * The filterCourses() function will then filter the list of courses based on the selected student.
 */
function onStudentChange(executionContext) {
    const formContext = executionContext.getFormContext();
    filterCourses(formContext);
}

/**
 * Filters the list of courses based on the selected student.
 *
 * @param {Object} formContext - The form context object.
 *
 * It does the following:
 *
 * 1. Gets the selected student lookup value. If no student is selected, returns early.
 *
 * 2. Gets the student ID from the first lookup value.
 *
 * 3. Calls fetchInstitutionId() to get the institution ID for the student.
 *
 * 4. Calls buildFetchXmlForCourses() to build the fetch XML for filtering courses by institution.
 *
 * 5. Passes the fetch XML to setCustomCourseView() to set a custom view on the courses control filtered by institution.
 */
async function filterCourses(formContext) {
    const studentLookup = formContext.getAttribute("cfasms_student").getValue();
    if (!studentLookup) return;

    const studentId = studentLookup[0].id;
    const institutionId = await fetchInstitutionId(studentId);
    const fetchXmlForCourses = buildFetchXmlForCourses(institutionId);

    setCustomCourseView(formContext, fetchXmlForCourses);
}

/**
 * Fetches the institution ID for the given student ID.
 *
 * @param {string} studentId - The student ID to get the institution for.
 *
 * It does the following:
 *
 * 1. Builds a FetchXML query to get the currently in-progress education history record for the student.
 *
 * 2. Calls the Web API retrieveMultipleRecords method to execute the FetchXML query.
 *
 * 3. Returns the institution ID value from the returned result.
 *
 * @returns {string} The institution ID for the given student.
 */
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

/**
 * Builds a FetchXML query to get courses for the given institution ID.
 *
 * @param {string} institutionId - The institution ID to filter courses on.
 *
 * It does the following:
 *
 * 1. Builds a FetchXML query with the cfasms_courses entity.
 * 2. Retrieves the cfasms_coursesid and cfasms_coursename attributes.
 * 3. Adds a filter for the cfasms_institution attribute equal to the passed in institutionId.
 *
 * @returns {string} The FetchXML query string.
 */
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

/**
 * Sets a custom view on the courses control filtered by the provided FetchXML.
 *
 * @param {Object} formContext - The form context object.
 * @param {string} fetchXmlForCourses - The FetchXML query to filter the courses by.
 *
 * It does the following:
 *
 * 1. Gets the courses form control.
 * 2. Generates a new view ID GUID.
 * 3. Sets the entity name to 'cfasms_courses'.
 * 4. Sets the view display name to 'Filtered Courses'.
 * 5. Defines the view layout XML to show the course name.
 * 6. Calls addCustomView() on the courses control to add the custom view.
 * 7. Sets the new view as the default view.
 *
 * This will show a filtered list of courses based on the provided FetchXML.
 */
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
