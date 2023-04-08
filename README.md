# EC2 instance with custom image

This is a project about building and using a custom EC2 image built with EC2 image builder.

The image must be built before it can be used by an EC2 instance. This mean the stack containing the image pipeline needs to be deployed and run once before deploying the EC2 instance stack.

## Useful commands

* `npm run build`       compile typescript to js
* `npm run watch`       watch for changes and compile
* `npm run test`        perform the jest unit tests
* `npm run cdk deploy`  deploy this stack to your default AWS account/region
* `npm run cdk diff`    compare deployed stack with current state
* `npm run cdk synth`   emits the synthesized CloudFormation template
