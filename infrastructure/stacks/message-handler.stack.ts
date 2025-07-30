import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from 'path';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as iam from 'aws-cdk-lib/aws-iam';

interface Props extends StackProps {
  namePrefix: string;
}

export class MessageHandlerStack extends Stack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);
    const { namePrefix } = props;

    const topic = new sns.Topic(this, `${namePrefix}Topic`, {
      topicName: `${namePrefix}MessageTopic`
    });

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
        environment: {
          TOPIC_ARN: topic.topicArn
        }
      }
    );

    topic.grantPublish(handler);

    handler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents'
        ],
        resources: ['*']
      })
    );

    topic.addSubscription(new subscriptions.LambdaSubscription(handler));

    new apigateway.LambdaRestApi(this, `${namePrefix}SimpleMessageGateway`, {
      restApiName: `${namePrefix}SimpleMessageGateway`,
      handler: handler,
      deployOptions: { stageName: 'dev' }
    });
  }
}
