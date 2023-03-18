import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Architecture } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as dotenv from 'dotenv'
// import * as sqs from 'aws-cdk-lib/aws-sqs';
dotenv.config()

export class GoogleCalenderToSlackStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    const googleCalenderRemindlambda = new NodejsFunction(this, 'googleCalenderRemind', {
      entry: "./src/index.ts",
      handler: "handler",
      architecture: Architecture.ARM_64,
      environment: {
        'GOOGLE_API_KEY': process.env.API_KEY ?? '',
        'GOOGLE_PRIVATE_KEY': process.env.GOOGLE_PRIVATE_KEY ?? '',
        'GOOGLE_CLIENT_EMAIL': process.env.GOOGLE_CLIENT_EMAIL ?? '',
        'SLACK_TOKEN': process.env.SLACK_TOKEN ?? '',
        'SLACK_CHANNEL': process.env.SLACK_CHANNEL ?? '',
      }
    })
    
    new cdk.aws_events.Rule(this, "sampleRule", {
      // JST で　５分毎に実行
      // see https://docs.aws.amazon.com/ja_jp/AmazonCloudWatch/latest/events/ScheduledEvents.html#CronExpressions
      schedule: cdk.aws_events.Schedule.cron({minute: "*/5", hour: "*", day: "*"}),
      targets: [new cdk.aws_events_targets.LambdaFunction(googleCalenderRemindlambda, {retryAttempts: 3})],
    });

    //   // 集計結果を保存する DynamoDB テーブル
    //   const batchSampleTable = new Table(this, "batchSampleTable", {
    //     billingMode: BillingMode.PAY_PER_REQUEST,
    //     partitionKey: {
    //         name: "sample_id",
    //         type: AttributeType.NUMBER,
    //     },
    //     removalPolicy: RemovalPolicy.DESTROY
    // });
    // batchSampleTable.grantReadWriteData(sampleLambda);

    // example resource
    // const queue = new sqs.Queue(this, 'GoogleCalenderToSlackQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
