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
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

interface Props extends StackProps {
  namePrefix: string;
}

export class MessageHandlerStack extends Stack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);
    const { namePrefix } = props;

    // SNS Topic
    const topic = new sns.Topic(this, `${namePrefix}Topic`, {
      topicName: `${namePrefix}MessageTopic`
    });

    // SQS Queue + DLQ (for sandbox safety)
    const dlq = new sqs.Queue(this, `${namePrefix}DLQ`, {
      queueName: `${namePrefix}MessageDLQ`,
      retentionPeriod: Duration.days(14),
      removalPolicy: RemovalPolicy.DESTROY
    });

    const queue = new sqs.Queue(this, `${namePrefix}Queue`, {
      queueName: `${namePrefix}MessageQueue`,
      visibilityTimeout: Duration.seconds(90), // >= 6x Lambda timeout is a good rule
      deadLetterQueue: { queue: dlq, maxReceiveCount: 5 },
      removalPolicy: RemovalPolicy.DESTROY
    });

    topic.addSubscription(new subscriptions.SqsSubscription(queue));

    // DynamoDB (document-y)
    const table = new dynamodb.Table(this, `${namePrefix}MessageTable`, {
      tableName: `${namePrefix}MessageTable`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: RemovalPolicy.DESTROY // sandbox
    });

    // Log groups (explicit to avoid CFN "already exists" clashes)
    const producerLogGroup = new logs.LogGroup(
      this,
      `${namePrefix}ProducerLambdaLogGroup`,
      {
        logGroupName: `/aws/lambda/${namePrefix}producer-lambda`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY
      }
    );

    const consumerLogGroup = new logs.LogGroup(
      this,
      `${namePrefix}ConsumerLambdaLogGroup`,
      {
        logGroupName: `/aws/lambda/${namePrefix}consumer-lambda`,
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
      },
      tracing: lambda.Tracing.ACTIVE
    });

    const consumer = new NodejsFunction(this, `${namePrefix}ConsumerLambda`, {
      functionName: `${namePrefix}consumer-lambda`,
      entry: path.join(__dirname, '../../services/message-consumer/index.js'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 256,
      timeout: Duration.seconds(15),
      logGroup: consumerLogGroup,
      bundling: {
        externalModules: [],
        minify: true,
        target: 'node20'
      },
      environment: {
        TABLE_NAME: table.tableName
      },
      tracing: lambda.Tracing.ACTIVE
    });

    consumer.addEventSource(
      new eventSources.SqsEventSource(queue, {
        batchSize: 10,
        reportBatchItemFailures: true // enables partial batch failure handling
      })
    );

    topic.grantPublish(producer);
    queue.grantConsumeMessages(consumer);
    table.grantReadWriteData(consumer);

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

    const api = new apigateway.LambdaRestApi(this, `${namePrefix}ApiGateway`, {
      restApiName: `${namePrefix}Api`,
      handler: producer,
      proxy: false,
      deployOptions: { stageName: 'dev' },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
        allowMethods: ['GET', 'POST', 'OPTIONS']
      }
    });

    api.root.addResource('uipath').addMethod('POST');

    api.root.addResource('roboyo').addMethod('POST');

    api.root.addResource('health').addMethod('GET');
  }
}
