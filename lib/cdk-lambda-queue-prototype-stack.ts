import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { MessageHandlerStack } from '../infrastructure/stacks/message-handler.stack';

// import * as sqs from 'aws-cdk-lib/aws-sqs';
export class CdkLambdaQueuePrototypeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const awsEnv = {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION
    };
    const userInitials = this.node.tryGetContext('user_initials');
    const namePrefix = `${userInitials}-`;

    if (!userInitials) {
      throw new Error('Missing required context: user_initials');
    }
    new MessageHandlerStack(this, `${namePrefix}SimpleMessageHandlerStack`, {
      env: awsEnv,
      namePrefix
    });
  }
}
