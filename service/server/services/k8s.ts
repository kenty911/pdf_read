import * as k8s from '@kubernetes/client-node'

const NAMESPACE = 'pdf-to-mp3'

function getBatchClient(): k8s.BatchV1Api {
  const kc = new k8s.KubeConfig()
  kc.loadFromCluster()
  return kc.makeApiClient(k8s.BatchV1Api)
}

export async function createConversionJob(jobId: string): Promise<void> {
  const workerImage = process.env.WORKER_IMAGE
  if (!workerImage) throw new Error('WORKER_IMAGE is not set')

  const batchV1 = getBatchClient()
  await batchV1.createNamespacedJob({
    namespace: NAMESPACE,
    body: {
      metadata: {
        name: `conversion-${jobId}`,
        namespace: NAMESPACE,
        labels: { app: 'worker', 'job-id': jobId },
      },
      spec: {
        ttlSecondsAfterFinished: 600,
        backoffLimit: 0,
        template: {
          spec: {
            restartPolicy: 'Never',
            containers: [
              {
                name: 'worker',
                image: workerImage,
                env: [
                  { name: 'JOB_ID', value: jobId },
                  {
                    name: 'DATABASE_URL',
                    valueFrom: {
                      secretKeyRef: {
                        name: 'pdf-to-mp3-secret',
                        key: 'DATABASE_URL',
                      },
                    },
                  },
                  { name: 'DATA_DIR', value: '/data' },
                ],
                envFrom: [{ configMapRef: { name: 'worker-config' } }],
                resources: {
                  requests: { cpu: '1', memory: '2Gi' },
                  limits: { cpu: '4', memory: '4Gi' },
                },
                volumeMounts: [{ name: 'app-data', mountPath: '/data' }],
              },
            ],
            volumes: [
              {
                name: 'app-data',
                persistentVolumeClaim: { claimName: 'app-data' },
              },
            ],
          },
        },
      },
    },
  })
}

export async function deleteConversionJob(jobId: string): Promise<void> {
  const batchV1 = getBatchClient()
  try {
    await batchV1.deleteNamespacedJob({
      name: `conversion-${jobId}`,
      namespace: NAMESPACE,
      body: { propagationPolicy: 'Background' },
    })
  } catch {
    // already gone
  }
}
