import { Stack, StackProps } from 'aws-cdk-lib';
import { AmazonLinuxImageProps, MachineImage } from 'aws-cdk-lib/aws-ec2';
import { CfnInstanceProfile, ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { CfnImagePipeline, CfnComponent, CfnImageRecipe, CfnInfrastructureConfiguration } from 'aws-cdk-lib/aws-imagebuilder';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { Component } from './components-stack';

interface CustomComponents {
  bucket: IBucket,
  components: Component[],
}

interface ImagePipelineProps extends StackProps {
  baseImageAmiId?: string,
  baseImageProps?: AmazonLinuxImageProps,
  customComponents?: CustomComponents,
  managedComponents?: string[],
  recipeVersion: string,
  schedule: string,
}

export class ImagePipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: ImagePipelineProps) {
    super(scope, id, props);

    const { baseImageAmiId, baseImageProps, customComponents, managedComponents, recipeVersion, schedule } = props;

    const theBaseImageAmiId = (() => {
      if (baseImageAmiId) return baseImageAmiId;
      if (baseImageProps) return MachineImage.latestAmazonLinux(baseImageProps).getImage(this).imageId
      throw new Error('either baseImageAmiId or baseImageProps must be defined');
    })();

    const cfnComponents = (customComponents?.components || []).map((component) => {
      return new CfnComponent(this, `Component${component.name}`, {
        name: component.name,
        platform: 'Linux',
        version: component.version,
        uri: `s3://${customComponents?.bucket.bucketName}/${component.fileName}`
      });
    });

    const recipe = new CfnImageRecipe(this, 'ImageRecipe', {
      name: 'ImageRecipe',
      version: recipeVersion,
      parentImage: theBaseImageAmiId,
      components: (managedComponents || [])
        .map((arn) => ({ componentArn: arn }))
        .concat(cfnComponents.map((comonent) => ({ componentArn: comonent.attrArn })))
    });

    const role = new Role(this, 'ImagePipelineInstanceProfileRole', {
      assumedBy: new ServicePrincipal("ec2.amazonaws.com")
    });
    role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"));
    role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("EC2InstanceProfileForImageBuilder"));

    const instaceProfile = new CfnInstanceProfile(this, 'ImagePipelineInstanceProfile', {
      instanceProfileName: 'ImagePipelineInstanceProfile',
      roles: [role.roleName]
    });

    const infrastructureConfiguration = new CfnInfrastructureConfiguration(this, 'InfrastructureConfiguration', {
      name: 'InfrastructureConfiguration',
      instanceTypes: ['t3.small'],
      instanceProfileName: instaceProfile.instanceProfileName!,
    });
    infrastructureConfiguration.addDependency(instaceProfile);

    /*
    const distributionConfiguration = new CfnDistributionConfiguration(this, 'DistributionConfiguration', {
      name: 'DistributionConfiguration',
      distributions: [{
        region: 'eu-west-1',
        amiDistributionConfiguration: {
          name: ''
        }
      }]
    });
    */
    const imagePipeline = new CfnImagePipeline(this, 'ImagePipeline', {
      name: 'ImagePipeline',
      imageRecipeArn: recipe.attrArn,
      infrastructureConfigurationArn: infrastructureConfiguration.attrArn,
      schedule: {
        pipelineExecutionStartCondition: 'EXPRESSION_MATCH_AND_DEPENDENCY_UPDATES_AVAILABLE',
        scheduleExpression: schedule
      },
      // distributionConfigurationArn: distributionConfiguration.attrArn
    });
    imagePipeline.addDependency(infrastructureConfiguration);
    // imagePipeline.addDependency(distributionConfiguration);
  }
}
