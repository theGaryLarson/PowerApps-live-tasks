using System;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;

namespace StudentManagementSystem.cfasms
{
    public class PostOperationcfasms_studentcoursehistoryUpdate : PluginBase
    {
        public PostOperationcfasms_studentcoursehistoryUpdate(string unsecure, string secure)
            : base(typeof(PostOperationcfasms_studentcoursehistoryUpdate))
        {
            // TODO: Implement custom configuration handling.
        }

        protected override void ExecuteCdsPlugin(ILocalPluginContext localContext)
        {
            ValidateLocalContext(localContext);

            ITracingService tracingService = localContext.TracingService;

            try
            {
                IPluginExecutionContext context = localContext.PluginExecutionContext;
                IOrganizationService currentUserService = localContext.CurrentUserService;

                if (IsTargetEntity(context, out Entity studentcoursehistory))
                {
                    Entity postImage = GetPostImage(context);
                    EntityReference studentReference = GetStudentReference(studentcoursehistory, postImage);

                    int activeCourseCount = CountActiveCourses(currentUserService, studentReference);

                    if (activeCourseCount > 6)
                    {
                        throw new InvalidPluginExecutionException("A student cannot have more than 6 active courses.");
                    }
                }
            }
            catch (Exception ex)
            {
                HandleException(ex, tracingService);
            }
        }

        private void ValidateLocalContext(ILocalPluginContext localContext)
        {
            if (localContext == null)
            {
                throw new InvalidPluginExecutionException(nameof(localContext));
            }
        }

        private bool IsTargetEntity(IPluginExecutionContext context, out Entity studentcoursehistory)
        {
            studentcoursehistory = null;

            if (context.InputParameters.Contains("Target") && context.InputParameters["Target"] is Entity entity)
            {
                if (entity.LogicalName != "cfasms_studentcoursehistory")
                {
                    return false;
                }

                studentcoursehistory = entity;
                return true;
            }

            return false;
        }

        private Entity GetPostImage(IPluginExecutionContext context)
        {
            return context.PostEntityImages.Contains("PostImage") ? (Entity)context.PostEntityImages["PostImage"] : null;
        }

        private EntityReference GetStudentReference(Entity studentcoursehistory, Entity postImage)
        {
            return postImage != null ? postImage.GetAttributeValue<EntityReference>("cfasms_student") : studentcoursehistory.GetAttributeValue<EntityReference>("cfasms_student");
        }

        private int CountActiveCourses(IOrganizationService service, EntityReference studentReference)
        {
            var query = new QueryExpression("cfasms_studentcoursehistory")
            {
                TopCount = 7,
                ColumnSet = new ColumnSet("cfasms_iscurrentlyinprogress", "cfasms_student"),
                Criteria = new FilterExpression
                {
                    FilterOperator = LogicalOperator.And,
                    Conditions =
                    {
                        new ConditionExpression("cfasms_student", ConditionOperator.Equal, studentReference.Id),
                        new ConditionExpression("cfasms_iscurrentlyinprogress", ConditionOperator.Equal, true)
                    }
                }
            };

            EntityCollection result = service.RetrieveMultiple(query);
            return result.Entities.Count;
        }

        private void HandleException(Exception ex, ITracingService tracingService)
        {
            string message = ex is InvalidPluginExecutionException && ex.Message == "A student cannot have more than 6 active courses."
                ? ex.Message
                : $"An error occurred executing Plugin StudentManagementSystem.cfasms.PostOperationcfasms_studentcoursehistoryUpdate : {ex}";

            tracingService?.Trace(message);
            throw new InvalidPluginExecutionException(message);
        }
    }
}
