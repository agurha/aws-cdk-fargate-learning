import { App, Construct, Stack, StackProps } from '@aws-cdk/core';
import * as ecs from '@aws-cdk/aws-ecs';
import * as patterns from '@aws-cdk/aws-ecs-patterns';
import * as ec2 from '@aws-cdk/aws-ec2';


export interface FargateServiceProps {
  readonly vpc?: ec2.IVpc
}

export class FargateService extends Construct {
  /**
   *
   */
  constructor(scope: Construct, id: string, props: FargateServiceProps = {}) {
    super(scope, id);

    const vpc = props.vpc ?? new ec2.Vpc(this, 'Vpc');
    const cluster = new ecs.Cluster(this, 'Cluster', {vpc})

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'Task', {
      cpu: 256,
      memoryLimitMiB: 512
    });

    const sampleserver = taskDefinition.addContainer('sample', {
      image : ecs.ContainerImage.fromRegistry('sample-app:latest'),
      
    });

    sampleserver.addPortMappings({containerPort : 80})
    new patterns.NetworkLoadBalancedFargateService(this, 'Service', {
      taskDefinition,
      cluster
    });
    
  }
}
export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    new FargateService(this, 'FargateService', {
      vpc: getOrCreateVpc(this)


    })

    // define resources here...
  }
}

function getOrCreateVpc(scope: Construct): ec2.IVpc {

  return scope.node.tryGetContext('use_default_vpc') === '1' ?
    ec2.Vpc.fromLookup(scope, 'Vpc', { isDefault: true }) :
    scope.node.tryGetContext('use_vpc_id') ?
      ec2.Vpc.fromLookup(scope, 'Vpc', { vpcId: scope.node.tryGetContext('use_vpc_id') }) :
      new ec2.Vpc(scope, 'Vpc', { maxAzs: 3 });
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MyStack(app, 'my-stack-dev', { env: devEnv });
// new MyStack(app, 'my-stack-prod', { env: prodEnv });

app.synth();