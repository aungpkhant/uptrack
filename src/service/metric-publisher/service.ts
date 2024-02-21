import {
  CloudWatchClient,
  PutMetricDataCommand,
  PutMetricDataInput,
} from '@aws-sdk/client-cloudwatch';

export class MetricPublisherService {
  private cloudwatch: CloudWatchClient;
  private readonly NAMESPACE = 'UptrackMetrics';
  private promises: Promise<any>[] = [];

  constructor(cloudWatchClient: CloudWatchClient) {
    this.cloudwatch = cloudWatchClient;
  }

  async recordExternalAPILatency(apiName: string, latencyInMilliseconds: number) {
    const input: PutMetricDataInput = {
      Namespace: this.NAMESPACE,
      MetricData: [
        {
          MetricName: 'ExternalAPILatency',
          Dimensions: [
            {
              Name: 'APIName',
              Value: apiName,
            },
          ],
          Timestamp: new Date(),
          Unit: 'Milliseconds',
          Value: latencyInMilliseconds,
        },
      ],
    };
    const command = new PutMetricDataCommand(input);
    const p = this.cloudwatch.send(command).catch((e) => {
      console.error('Error putting metric data', e);
    });
    this.promises.push(p);
    return p;
  }

  async flush() {
    await Promise.allSettled(this.promises);
    this.promises = [];
  }
}
