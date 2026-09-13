import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";
import type {
  Application,
  ApplicationStatus,
  CreateApplicationInput,
} from "@educacion-estrella/shared";
import type { AppConfig } from "../../config/env.js";

/** Dias que sobrevive una solicitud que nunca llega a confirmarse. */
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

/**
 * Registra una solicitud pendiente de video.
 *
 * La clave compuesta resuelve la consulta "mis solicitudes" sin indices ni
 * recorridos: la particion es el solicitante y la ordenacion un identificador
 * ordenable por tiempo.
 *
 * El plazo de expiracion se alinea con la limpieza del almacenamiento. Si
 * divergieran, quedarian solicitudes apuntando a videos inexistentes.
 */
/** Solicitud tal y como esta guardada, con lo que solo conoce el servidor. */
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
};

/**
 * Fabrica el acceso a datos con la configuracion ya validada.
 *
 * Recibe la configuracion en lugar de leerla al cargarse el modulo, por dos
 * motivos: mantiene el patron que ya usa la aplicacion (server.ts valida y
 * inyecta) y permite importar este modulo sin exigir un entorno completo.
 *
 * El cliente se crea UNA vez por fabrica, no por peticion. En una funcion sin
 * servidor el modulo sobrevive entre invocaciones, asi que esto aprovecha el
 * arranque en caliente; crear un cliente por peticion anade decenas de
 * milisegundos a cada llamada sin aportar nada.
 */
export function createApplicationsRepository(
  config: Pick<AppConfig, "awsRegion" | "applicationsTableName">,
): ApplicationsRepository {
  const documentos = DynamoDBDocumentClient.from(new DynamoDBClient({ region: config.awsRegion }), {
    marshallOptions: { removeUndefinedValues: true },
  });

  return { createApplication, getApplication, markAsSubmitted };

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
        // Un identificador ordenable no colisiona en la practica, pero escribir
        // sin condicion permitiria sobreescribir en silencio si alguna vez lo
        // hiciera.
        ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)",
      }),
    );

    return { applicationId, userId, videoKey, createdAt };
  }

  /**
   * Lee una solicitud del solicitante indicado.
   *
   * La lectura va por clave, nunca recorriendo la tabla. Y la identidad forma
   * parte de la clave, asi que una solicitud ajena simplemente no aparece: no
   * hay que acordarse de comprobar el propietario despues.
   */
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

  /**
   * Da la solicitud por enviada.
   *
   * Devuelve null si la condicion no se cumple, es decir si ya no estaba
   * pendiente. Quien llama decide que significa eso: aqui, que el aviso llego
   * repetido, lo cual no es un error.
   *
   * Retirar el plazo de expiracion NO es opcional. Sin ese REMOVE, una solicitud
   * enviada desaparece a los siete dias sin ruido, sin error y sin rastro.
   */
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
}
