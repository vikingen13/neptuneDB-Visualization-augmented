import aws_cdk as core
import aws_cdk.assertions as assertions

from neptune_db_visualization_infra.neptune_db_visualization_infra_stack import NeptuneDbVisualizationInfraStack

# example tests. To run these tests, uncomment this file along with the example
# resource in neptune_db_visualization_infra/neptune_db_visualization_infra_stack.py
def test_sqs_queue_created():
    app = core.App()
    stack = NeptuneDbVisualizationInfraStack(app, "neptune-db-visualization-infra")
    template = assertions.Template.from_stack(stack)

#     template.has_resource_properties("AWS::SQS::Queue", {
#         "VisibilityTimeout": 300
#     })
