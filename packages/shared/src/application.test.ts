import { describe, it, expect } from "vitest";
import { createApplicationInputSchema, applicationStatusSchema } from "./application.js";

const validInput = {
  fullName: "Ana María Restrepo",
  idDocument: "1012345678",
  institution: "Universidad Nacional de Colombia",
  program: "Ingeniería de Sistemas",
  amount: 8_500_000,
  video: { contentType: "video/mp4", sizeBytes: 15_728_640 },
};

describe("createApplicationInputSchema", () => {
  it("acepta una solicitud completa y válida", () => {
    expect(createApplicationInputSchema.safeParse(validInput).success).toBe(true);
  });

  it.each(["fullName", "idDocument", "institution", "program", "amount", "video"])(
    "rechaza la solicitud si falta %s",
    (field) => {
      const { [field]: _omitted, ...incomplete } = validInput as Record<string, unknown>;
      expect(createApplicationInputSchema.safeParse(incomplete).success).toBe(false);
    },
  );
});

describe("monto solicitado", () => {
  it.each([1, 500_000, Number.MAX_SAFE_INTEGER])("acepta el monto %s", (amount) => {
    expect(createApplicationInputSchema.safeParse({ ...validInput, amount }).success).toBe(true);
  });

  it.each([0, -1, -500_000, 1500.5, Number.NaN])("rechaza el monto %s", (amount) => {
    expect(createApplicationInputSchema.safeParse({ ...validInput, amount }).success).toBe(false);
  });

  it("rechaza un monto fuera del rango de enteros seguros", () => {
    // No es una regla de negocio: más allá de este punto el número no sobreviviría
    // intacto a la ida y vuelta al almacenamiento.
    const result = createApplicationInputSchema.safeParse({
      ...validInput,
      amount: Number.MAX_SAFE_INTEGER + 2,
    });
    expect(result.success).toBe(false);
  });

  it("explica en español por qué rechaza un monto con decimales", () => {
    const result = createApplicationInputSchema.safeParse({ ...validInput, amount: 1500.5 });
    expect(result.error?.issues[0]?.message).toBe(
      "El monto solicitado debe ser un número entero, sin decimales",
    );
  });
});

describe("documento de identidad", () => {
  it.each(["12345", "12345678901234567890"])("acepta %s", (idDocument) => {
    expect(createApplicationInputSchema.safeParse({ ...validInput, idDocument }).success).toBe(
      true,
    );
  });

  it.each([
    ["con letras", "10123ABC78"],
    ["demasiado corto", "1234"],
    ["demasiado largo", "123456789012345678901"],
    ["con guiones", "1012-345-678"],
    ["vacío", ""],
  ])("rechaza un documento %s", (_caso, idDocument) => {
    expect(createApplicationInputSchema.safeParse({ ...validInput, idDocument }).success).toBe(
      false,
    );
  });
});

describe("rechazo de campos desconocidos", () => {
  it.each(["status", "userId", "videoKey"])(
    "rechaza la solicitud si el cliente intenta fijar %s",
    (field) => {
      const result = createApplicationInputSchema.safeParse({ ...validInput, [field]: "x" });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.code).toBe("unrecognized_keys");
    },
  );
});

describe("applicationStatusSchema", () => {
  it.each(["PENDING_VIDEO", "UNDER_REVIEW"])("acepta el estado %s", (status) => {
    expect(applicationStatusSchema.safeParse(status).success).toBe(true);
  });

  it.each(["APPROVED", "pending_video", "", "EN_REVISION"])("rechaza el estado %s", (status) => {
    expect(applicationStatusSchema.safeParse(status).success).toBe(false);
  });
});
