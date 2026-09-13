import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";
import type { ApplicationStatus, CreateApplicationInput } from "@educacion-estrella/shared";
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
export type ApplicationsRepository = {
  createApplication: (
    userId: string,
    datos: CreateApplicationInput,
    videoKeyFor: (applicationId: string) => string,
  ) => Promise<NewApplication>;
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

  return { createApplication };

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
}
