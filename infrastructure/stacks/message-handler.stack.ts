import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from 'path';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';

interface Props extends StackProps {
  namePrefix: string;
}

export class MessageHandlerStack extends Stack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);
    const { namePrefix } = props;

    const handler = new lambda.Function(
      this,
      `${namePrefix}SimpleMessageHandlerLambda`,
      {
        functionName: `${namePrefix}message-handler-lambda`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset(
          path.join(__dirname, '../../services/message-handler')
        ),
        logRetention: logs.RetentionDays.ONE_WEEK
      }
    );

    new apigateway.LambdaRestApi(this, `${namePrefix}SimpleMessageGateway`, {
      restApiName: `${namePrefix}SimpleMessageGateway`,
      handler,
      deployOptions: {
        stageName: 'dev'
      }
    });
  }
}
