#!/usr/bin/env node
import 'source-map-support/register';
import { ImagePipelineStack } from '../lib/image-pipeline-stack';
import { ComponentStack } from '../lib/components-stack';
import { App } from 'aws-cdk-lib';
import { AmazonLinuxGeneration } from 'aws-cdk-lib/aws-ec2';

const app = new App();

const componentStack = new ComponentStack(app, 'ComponentStack');

const imagePipelineStack = new ImagePipelineStack(app, 'ImagePipelineStack', {
  baseImageProps: {
    generation: AmazonLinuxGeneration.AMAZON_LINUX_2,
  },
  customComponents: {
    bucket: componentStack.bucket,
    components: componentStack.components
  },
  managedComponents: [
    `arn:aws:imagebuilder:${process.env.CDK_DEFAULT_REGION}:aws:component/stig-build-linux-high/2022.4.0`
  ],
  recipeVersion: '1.0.0',
  schedule: 'cron(0 0 ? * * *)' // 'cron(0 10 ? * mon *)' // Every Monday at 10:00 UTC
});

imagePipelineStack.addDependency(componentStack);