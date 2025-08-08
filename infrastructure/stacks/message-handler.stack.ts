import { Stack, StackProps, RemovalPolicy, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as eventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

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

    const producerLogGroup = new logs.LogGroup(
      this,
      `${namePrefix}ProducerLambdaLogGroup`,
      {
        logGroupName: `/aws/lambda/${namePrefix}producer-lambda`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY
      }
    );

    const producer = new NodejsFunction(this, `${namePrefix}ProducerLambda`, {
      functionName: `${namePrefix}producer-lambda`,
      entry: path.join(__dirname, '../../services/message-handler/index.js'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 256,
      timeout: Duration.seconds(10),
      logGroup: producerLogGroup,
      bundling: {
        externalModules: [],
        minify: true,
        target: 'node20'
      },
      environment: {
        TOPIC_ARN: topic.topicArn
      }
    });

    const consumerLogGroup = new logs.LogGroup(
      this,
      `${namePrefix}ConsumerLambdaLogGroup`,
      {
        logGroupName: `/aws/lambda/${namePrefix}consumer-lambda`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY
      }
    );

    const consumer = new NodejsFunction(this, `${namePrefix}ConsumerLambda`, {
      functionName: `${namePrefix}consumer-lambda`,
      entry: path.join(__dirname, '../../services/message-consumer/index.js'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 256,
      timeout: Duration.seconds(10),
      logGroup: consumerLogGroup,
      bundling: {
        externalModules: [],
        minify: true,
        target: 'node20'
      },
      environment: {}
    });

    consumer.addEventSource(
      new eventSources.SqsEventSource(queue, {
        batchSize: 1
      })
    );

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

    topic.grantPublish(producer);

    new apigateway.LambdaRestApi(this, `${namePrefix}ApiGateway`, {
      restApiName: `${namePrefix}Api`,
      handler: producer,
      deployOptions: { stageName: 'dev' }
    });
  }
}
