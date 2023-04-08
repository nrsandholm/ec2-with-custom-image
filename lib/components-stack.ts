import * as cdk from 'aws-cdk-lib';
import { Bucket, IBucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

export interface Component {
  name: string,
  fileName: string,
  version: string
}

export class ComponentStack extends cdk.Stack {
  public readonly bucket: IBucket;
  public readonly components: Component[] = [{
    name: 'InstallJava',
    fileName: 'install-java.yml',
    version: '1.0.0'
  }];

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.bucket = new Bucket(this, 'ComponentBucket', {
      versioned: true
    });

    new BucketDeployment(this, 'ComponentBucketDeployment', {
      destinationBucket: this.bucket,
      sources: [
        Source.asset('./components')
      ]
    });
  }
}