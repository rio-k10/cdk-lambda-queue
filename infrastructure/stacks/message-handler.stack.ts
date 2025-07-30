import { Stack, StackProps, RemovalPolicy, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from 'path';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as eventSources from 'aws-cdk-lib/aws-lambda-event-sources';
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

    const queue = new sqs.Queue(this, `${namePrefix}Queue`, {
      queueName: `${namePrefix}MessageQueue`,
      visibilityTimeout: Duration.seconds(30),
      removalPolicy: RemovalPolicy.DESTROY
    });

    topic.addSubscription(new subscriptions.SqsSubscription(queue));

    const producer = new lambda.Function(this, `${namePrefix}ProducerLambda`, {
      functionName: `${namePrefix}producer-lambda`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../../services/message-handler')
      ),
      environment: {
        TOPIC_ARN: topic.topicArn
      }
    });

    const consumer = new lambda.Function(this, `${namePrefix}ConsumerLambda`, {
      functionName: `${namePrefix}consumer-lambda`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../../services/message-consumer')
      )
    });

    // Attach SQS event source to consumer Lambda
    consumer.addEventSource(
      new eventSources.SqsEventSource(queue, {
        batchSize: 1
      })
    );

    // Allow logging
    const lambdas = [producer, consumer];
    lambdas.forEach((fn) => {
      fn.addToRolePolicy(
        new iam.PolicyStatement({
          actions: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents'
          ],
          resources: ['*']
        })
      );
    });

    // Allow producer to publish to SNS
    topic.grantPublish(producer);

    new apigateway.LambdaRestApi(this, `${namePrefix}ApiGateway`, {
      restApiName: `${namePrefix}Api`,
      handler: producer,
      deployOptions: { stageName: 'dev' }
    });
  }
}
