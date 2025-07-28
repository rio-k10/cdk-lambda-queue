#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkLambdaQueuePrototypeStack } from '../lib/cdk-lambda-queue-prototype-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION
};
const userInitials = app.node.tryGetContext('user_initials');
if (!userInitials) {
  throw new Error('Missing required context: user_initials');
}

new CdkLambdaQueuePrototypeStack(
  app,
  `${userInitials}-CdkLambdaQueuePrototypeStack`,
  { env }
);
