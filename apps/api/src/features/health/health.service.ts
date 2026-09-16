export type HealthStatus = {
  status: "ok";
  timestamp: string;
};

export type HealthService = {
  check: () => HealthStatus;
};

// Deliberately does NOT query DynamoDB, S3 or Cognito. A check that interrogates
// its dependencies turns one of them being slow into "the service is down", and
// causes cascading restarts that worsen what it meant to detect.
export function createHealthService(): HealthService {
  return {
    check: () => ({ status: "ok", timestamp: new Date().toISOString() }),
  };
}
