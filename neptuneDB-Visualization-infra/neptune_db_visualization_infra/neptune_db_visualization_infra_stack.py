from aws_cdk import (
    # Duration,
    Stack,
    aws_ec2 as ec2,
    aws_lambda as lambda_,
    aws_apigateway as apigateway
    # aws_sqs as sqs,
)
from constructs import Construct
import aws_cdk.aws_neptune_alpha as neptune

class NeptuneDbVisualizationInfraStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        myVPC = ec2.Vpc(self, "Vpc",
            cidr="10.0.0.0/16"
        )

        myDefaultSG = ec2.SecurityGroup.from_security_group_id(self, "SG", myVPC.vpc_default_security_group)

        myNeptuneCluster = neptune.DatabaseCluster(self, "Cluster",
            vpc=myVPC,
            instance_type=neptune.InstanceType.R5_LARGE,
            auto_minor_version_upgrade=True
        )

        myNeptuneCluster.connections.allow_default_port_from(myDefaultSG)
        myNeptuneCluster.connections.allow_default_port_internally()


        myLambdaLayer = lambda_.LayerVersion(self, 'lambda-layer',
                  code = lambda_.AssetCode('gremlinLambdaLayer'),
                  compatible_runtimes = [lambda_.Runtime.NODEJS_16_X],
        )   

        myLambda = lambda_.Function(self, "Function",
            runtime=lambda_.Runtime.NODEJS_16_X,
            handler="index.handler",
            code=lambda_.Code.from_asset('getGraphInfoLambda'),
            layers = [myLambdaLayer],
            environment={
                'NEPTUNE_ENDPOINT': myNeptuneCluster.cluster_endpoint.socket_address.split(':')[0],
                'NEPTUNE_PORT':myNeptuneCluster.cluster_endpoint.socket_address.split(':')[1]
            },
            vpc = myVPC,
            security_groups = [myDefaultSG]
        )

        #cors policy to be changed
        myAPI = apigateway.RestApi(self, "neptune-api2",
                  rest_api_name="Neptune Service",
                  description="This service serves neptuneDB content.",
                  endpoint_configuration=apigateway.EndpointConfiguration(
                       types=[apigateway.EndpointType.REGIONAL]
                  ),
                  default_cors_preflight_options=apigateway.CorsOptions(
                    allow_headers=['*'],
                    allow_origins=apigateway.Cors.ALL_ORIGINS,
                    allow_methods=apigateway.Cors.ALL_METHODS)
        )

        myLambdaIntegration = apigateway.LambdaIntegration(myLambda,
                request_templates={"application/json": '{ "statusCode": "200" }'})


        myAPI.root.add_method("GET", myLambdaIntegration)   # GET /
       
        myPiecesRessource = myAPI.root.add_resource("pieces")
        myPieceRessource2 = myPiecesRessource.add_resource("{piece}")

        myPieceRessource2.add_method("GET",myLambdaIntegration)
