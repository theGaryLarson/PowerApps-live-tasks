using System;
using System.IdentityModel.Claims;
using System.ServiceModel;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;

namespace StudentManagementSystem.cfasms
{
    /// <summary>
    /// PostOperationcfasms_studenteducationhistory_progress Plugin.
    /// Fires when the following attributes are updated:
    /// cfasms_iscurrentlyinprogress
    /// </summary>    
    public class PostOperationcfasms_studenteducationhistory_progress : PluginBase
    {
        public PostOperationcfasms_studenteducationhistory_progress(string unsecure, string secure)
            : base(typeof(PostOperationcfasms_studenteducationhistory_progress))
        {
            // TODO: Implement your custom configuration handling.
        }

        protected override void ExecuteCdsPlugin(ILocalPluginContext localContext)
        {
            if (localContext == null)
            {
                throw new InvalidPluginExecutionException(nameof(localContext));
            }

            ITracingService tracingService = localContext.TracingService;

            try
            {
                IPluginExecutionContext context = (IPluginExecutionContext)localContext.PluginExecutionContext;
                IOrganizationService currentUserService = localContext.CurrentUserService;

                if (context.InputParameters.Contains("Target") && context.InputParameters["Target"] is Entity)
                {
                    Entity studentEducationHistory = (Entity)context.InputParameters["Target"];
                    ProcessStudentEducationHistory(localContext, context, currentUserService, studentEducationHistory);
                }
            }
            catch (Exception ex)
            {
                HandleException(ex, tracingService);
            }
        }

        private void ProcessStudentEducationHistory(ILocalPluginContext localContext, IPluginExecutionContext context, IOrganizationService currentUserService, Entity studentEducationHistory)
        {
            ITracingService tracingService = localContext.TracingService;

            if (studentEducationHistory.LogicalName != "cfasms_studenteducationhistory")
                return;

            Entity postImage = (Entity)context.PostEntityImages["PostImage"];
            CheckAndUpdateInProgressStatus(localContext, context, currentUserService, studentEducationHistory, postImage);
        }

        private void CheckAndUpdateInProgressStatus(ILocalPluginContext localContext, IPluginExecutionContext context, IOrganizationService currentUserService, Entity studentEducationHistory, Entity postImage)
        {
            ITracingService tracingService = localContext.TracingService;

            if (studentEducationHistory.Attributes.ContainsKey("cfasms_iscurrentlyinprogress") && studentEducationHistory.GetAttributeValue<bool>("cfasms_iscurrentlyinprogress"))
            {
                EntityReference studentReference = postImage.GetAttributeValue<EntityReference>("cfasms_student");
                Guid studentId = studentReference.Id;

                EntityCollection result = QueryActiveRecordsForStudent(currentUserService, studentId);

                if (result.Entities.Count > 1 && postImage.GetAttributeValue<bool>("cfasms_iscurrentlyinprogress"))
                {
                    studentEducationHistory["cfasms_iscurrentlyinprogress"] = false;
                    currentUserService.Update(studentEducationHistory);
                    throw new InvalidPluginExecutionException("Must set \"Is Currently In-Progress\" to No in student's other Active Student Ed Histories record.");
                }
            }
        }

        private EntityCollection QueryActiveRecordsForStudent(IOrganizationService currentUserService, Guid studentId)
        {
            var query = new QueryExpression("cfasms_studenteducationhistory")
            {
                Criteria = new FilterExpression
                {
                    FilterOperator = LogicalOperator.And,
                    Conditions =
                    {
                        new ConditionExpression("cfasms_student", ConditionOperator.Equal, studentId),
                        new ConditionExpression("cfasms_iscurrentlyinprogress", ConditionOperator.Equal, true)
                    }
                }
            };

            return currentUserService.RetrieveMultiple(query);
        }

        private void HandleException(Exception ex, ITracingService tracingService)
        {
            string message = ex is InvalidPluginExecutionException && ex.Message == "Must set \"Is Currently In-Progress\" to No in student's other Active Student Ed Histories record."
                ? ex.Message
                : String.Format("An error occurred executing Plugin StudentManagementSystem.cfasms.PreOperationcfasms_studenteducationhistoryUpdate : {0}", ex.ToString());

            tracingService?.Trace(message);
            throw new InvalidPluginExecutionException(message);
        }
    }
}
