import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";
import type {
  Application,
  ApplicationStatus,
  CreateApplicationInput,
} from "@educacion-estrella/shared";
import type { AppConfig } from "../../config/env.js";

// Must stay aligned with the storage cleanup rule. If they diverged, applications
// would point at videos that no longer exist.
const DIAS_HASTA_EXPIRAR = 7;

export type NewApplication = {
  applicationId: string;
  userId: string;
  videoKey: string;
  createdAt: string;
};

function segundosHastaExpirar(desde: Date): number {
  return Math.floor(desde.getTime() / 1000) + DIAS_HASTA_EXPIRAR * 24 * 60 * 60;
}

export type StoredApplication = Application & {
  videoKey: string;
};

export type ApplicationsRepository = {
  createApplication: (
    userId: string,
    datos: CreateApplicationInput,
    videoKeyFor: (applicationId: string) => string,
  ) => Promise<NewApplication>;

  getApplication: (userId: string, applicationId: string) => Promise<StoredApplication | null>;

  markAsSubmitted: (
    userId: string,
    applicationId: string,
    videoSizeBytes: number,
  ) => Promise<StoredApplication | null>;

  listApplications: (
    userId: string,
    opciones: { limit: number; cursor?: string },
  ) => Promise<{ items: StoredApplication[]; nextCursor?: string }>;
};

// The cursor carries ONLY the sort key. The partition key does not travel in it:
// it is always rebuilt from the token identity, so tampering cannot reach another
// user's partition.
function codificarCursor(sk: string): string {
  return Buffer.from(sk, "utf8").toString("base64url");
}

function decodificarCursor(cursor: string | undefined): string | null {
  if (!cursor) return null;

  try {
    const sk = Buffer.from(cursor, "base64url").toString("utf8");
    // A malformed cursor is treated as absence, not as a failure: a corrupt value
    // in a URL should not produce a server error.
    return sk.startsWith("APP#") ? sk : null;
  } catch {
    return null;
  }
}

// Config is injected rather than read at module load: that keeps this module
// importable without a full environment. The client is created ONCE per factory,
// not per request, so warm starts reuse it.
export function createApplicationsRepository(
  config: Pick<AppConfig, "awsRegion" | "applicationsTableName">,
): ApplicationsRepository {
  const documentos = DynamoDBDocumentClient.from(new DynamoDBClient({ region: config.awsRegion }), {
    marshallOptions: { removeUndefinedValues: true },
  });

  return { createApplication, getApplication, markAsSubmitted, listApplications };

  async function createApplication(
    userId: string,
    datos: CreateApplicationInput,
    videoKeyFor: (applicationId: string) => string,
  ): Promise<NewApplication> {
    const applicationId = ulid();
    const videoKey = videoKeyFor(applicationId);
    const ahora = new Date();
    const createdAt = ahora.toISOString();
    const status: ApplicationStatus = "PENDING_VIDEO";

    await documentos.send(
      new PutCommand({
        TableName: config.applicationsTableName,
        Item: {
          PK: `USER#${userId}`,
          SK: `APP#${applicationId}`,
          applicationId,
          userId,
          fullName: datos.fullName,
          idDocument: datos.idDocument,
          institution: datos.institution,
          program: datos.program,
          amount: datos.amount,
          status,
          videoContentType: datos.videoContentType,
          videoKey,
          createdAt,
          updatedAt: createdAt,
          ttl: segundosHastaExpirar(ahora),
        },
        // A time-ordered id does not collide in practice, but writing without a
        // condition would allow a silent overwrite if it ever did.
        ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)",
      }),
    );

    return { applicationId, userId, videoKey, createdAt };
  }

  // The identity is part of the key, so someone else's application simply does not
  // appear. There is no ownership check to remember.
  async function getApplication(
    userId: string,
    applicationId: string,
  ): Promise<StoredApplication | null> {
    const { Item } = await documentos.send(
      new GetCommand({
        TableName: config.applicationsTableName,
        Key: { PK: `USER#${userId}`, SK: `APP#${applicationId}` },
      }),
    );

    return (Item as StoredApplication | undefined) ?? null;
  }

  // Removing the expiry is NOT optional. Without that REMOVE, a submitted
  // application disappears days later with no noise, no error and no trace.
  // Returns null when the condition fails, i.e. it was no longer pending.
  async function markAsSubmitted(
    userId: string,
    applicationId: string,
    videoSizeBytes: number,
  ): Promise<StoredApplication | null> {
    const pendiente: ApplicationStatus = "PENDING_VIDEO";
    const enviada: ApplicationStatus = "UNDER_REVIEW";

    try {
      const { Attributes } = await documentos.send(
        new UpdateCommand({
          TableName: config.applicationsTableName,
          Key: { PK: `USER#${userId}`, SK: `APP#${applicationId}` },
          UpdateExpression:
            "SET #status = :enviada, videoSizeBytes = :tamano, updatedAt = :ahora REMOVE #ttl",
          ConditionExpression: "attribute_exists(PK) AND #status = :pendiente",
          ExpressionAttributeNames: { "#status": "status", "#ttl": "ttl" },
          ExpressionAttributeValues: {
            ":enviada": enviada,
            ":pendiente": pendiente,
            ":tamano": videoSizeBytes,
            ":ahora": new Date().toISOString(),
          },
          ReturnValues: "ALL_NEW",
        }),
      );

      return (Attributes as StoredApplication | undefined) ?? null;
    } catch (error) {
      if (error instanceof Error && error.name === "ConditionalCheckFailedException") {
        return null;
      }
      throw error;
    }
  }

  // Ordering is free: the sort key is a ULID, which orders lexicographically by
  // time, so scanning it backwards is enough. No secondary index, no sorting in
  // memory.
  async function listApplications(
    userId: string,
    opciones: { limit: number; cursor?: string },
  ): Promise<{ items: StoredApplication[]; nextCursor?: string }> {
    const sk = decodificarCursor(opciones.cursor);

    const { Items, LastEvaluatedKey } = await documentos.send(
      new QueryCommand({
        TableName: config.applicationsTableName,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": `USER#${userId}` },
        // Backwards: most recent first.
        ScanIndexForward: false,
        Limit: opciones.limit,
        // Built ALWAYS from the received identity, never from the cursor. This is
        // what stops a forged cursor reaching another user's partition.
        ExclusiveStartKey: sk ? { PK: `USER#${userId}`, SK: sk } : undefined,
      }),
    );

    const items = (Items ?? []) as StoredApplication[];
    const siguienteSk = LastEvaluatedKey?.SK as string | undefined;

    return {
      items,
      nextCursor: siguienteSk ? codificarCursor(siguienteSk) : undefined,
    };
  }
}
