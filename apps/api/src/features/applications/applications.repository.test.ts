import { describe, it, expect, vi, beforeEach } from "vitest";

const enviar = vi.fn();

vi.mock("@aws-sdk/lib-dynamodb", async () => {
  const real =
    await vi.importActual<typeof import("@aws-sdk/lib-dynamodb")>("@aws-sdk/lib-dynamodb");
  return {
    ...real,
    DynamoDBDocumentClient: { from: () => ({ send: (c: unknown) => enviar(c) }) },
  };
});

const { createApplicationsRepository } = await import("./applications.repository.js");

const CONFIG = { awsRegion: "us-east-1", applicationsTableName: "tabla-de-prueba" };
const USUARIO = "947844e8-5031-701a-bdf1-6d13401f76e9";
const OTRO = "ffffffff-0000-0000-0000-000000000000";

const repositorio = createApplicationsRepository(CONFIG);

/** Reads the sent command input, to assert on what was queried. */
function ultimaConsulta(): Record<string, unknown> {
  return (enviar.mock.calls[0]?.[0] as { input: Record<string, unknown> }).input;
}

beforeEach(() => {
  enviar.mockReset();
  enviar.mockResolvedValue({ Items: [], LastEvaluatedKey: undefined });
});

describe("listApplications: cómo se consulta", () => {
  it("consulta por clave de partición, nunca recorriendo la tabla", async () => {
    await repositorio.listApplications(USUARIO, { limit: 20 });

    const input = ultimaConsulta();
    expect(input.KeyConditionExpression).toBe("PK = :pk");
    expect(input.ExpressionAttributeValues).toEqual({ ":pk": `USER#${USUARIO}` });
    // A FilterExpression would mean reading more and discarding afterwards.
    expect(input.FilterExpression).toBeUndefined();
  });

  it("recorre en orden descendente: las más recientes primero", async () => {
    // The sort key orders by time, so scanning backwards is enough.
    await repositorio.listApplications(USUARIO, { limit: 20 });

    expect(ultimaConsulta().ScanIndexForward).toBe(false);
  });

  it("aplica el límite recibido", async () => {
    await repositorio.listApplications(USUARIO, { limit: 5 });

    expect(ultimaConsulta().Limit).toBe(5);
  });
});

describe("listApplications: el puntero de continuación", () => {
  it("sin puntero no arranca desde ninguna posición", async () => {
    await repositorio.listApplications(USUARIO, { limit: 20 });

    expect(ultimaConsulta().ExclusiveStartKey).toBeUndefined();
  });

  it("devuelve un puntero cuando el almacenamiento indica que quedan más", async () => {
    enviar.mockResolvedValue({ Items: [], LastEvaluatedKey: { PK: "x", SK: "APP#01HXYZ" } });

    const { nextCursor } = await repositorio.listApplications(USUARIO, { limit: 1 });

    expect(nextCursor).toBeDefined();
    expect(Buffer.from(nextCursor ?? "", "base64url").toString()).toBe("APP#01HXYZ");
  });

  it("no devuelve puntero cuando no quedan más", async () => {
    const { nextCursor } = await repositorio.listApplications(USUARIO, { limit: 20 });

    expect(nextCursor).toBeUndefined();
  });

  it("continúa desde donde indica el puntero", async () => {
    const cursor = Buffer.from("APP#01HXYZ", "utf8").toString("base64url");

    await repositorio.listApplications(USUARIO, { limit: 20, cursor });

    expect(ultimaConsulta().ExclusiveStartKey).toEqual({
      PK: `USER#${USUARIO}`,
      SK: "APP#01HXYZ",
    });
  });
});

describe("listApplications: un puntero manipulado no da acceso a datos ajenos", () => {
  it("la partición se construye con la identidad recibida, NO con la del puntero", async () => {
    // The security point of the listing: even with a forged cursor naming another
    // partition, the query always runs against the caller's own.
    const cursorAjeno = Buffer.from(
      JSON.stringify({ PK: `USER#${OTRO}`, SK: "APP#01HXYZ" }),
      "utf8",
    ).toString("base64url");

    await repositorio.listApplications(USUARIO, { limit: 20, cursor: cursorAjeno });

    const input = ultimaConsulta();
    expect(input.ExpressionAttributeValues).toEqual({ ":pk": `USER#${USUARIO}` });
    expect(JSON.stringify(input)).not.toContain(OTRO);
  });

  it.each([
    ["no es base64 válido", "!!!no-es-base64!!!"],
    ["decodifica a algo que no es una clave", "cXVpZW4tc2FiZQ"],
    ["intenta nombrar otra partición", "VVNFUiNvdHJv"],
  ])("un puntero que %s se trata como primera página", async (_caso, cursor) => {
    // A corrupt cursor in a URL should not produce a server error.
    await expect(
      repositorio.listApplications(USUARIO, { limit: 20, cursor }),
    ).resolves.toBeDefined();

    expect(ultimaConsulta().ExclusiveStartKey).toBeUndefined();
  });
});
