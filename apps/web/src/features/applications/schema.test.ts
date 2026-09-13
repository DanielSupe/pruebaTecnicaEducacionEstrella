import { describe, it, expect } from "vitest";
import { MAX_VIDEO_BYTES } from "@educacion-estrella/shared";
import { applicationFormSchema, montoATexto, tamanoLegible } from "./schema.js";

function archivo(tipo: string, bytes: number): File {
  // El contenido no importa: el esquema solo mira tipo y tamaño.
  return new File([new Uint8Array(Math.min(bytes, 1024))], "entrevista.mp4", {
    type: tipo,
    lastModified: Date.now(),
  });
}

/** File no permite fijar el tamaño, asi que se sustituye para los casos limite. */
function archivoDe(tipo: string, bytes: number): File {
  const f = archivo(tipo, 1);
  Object.defineProperty(f, "size", { value: bytes });
  return f;
}

const valido = {
  fullName: "Ana María Restrepo",
  idDocument: "1012345678",
  institution: "Universidad Nacional de Colombia",
  program: "Ingeniería de Sistemas",
  amount: 8_500_000,
  video: archivoDe("video/mp4", 15_728_640),
};

describe("applicationFormSchema: campos", () => {
  it("acepta un formulario completo y valido", () => {
    expect(applicationFormSchema.safeParse(valido).success).toBe(true);
  });

  it.each([
    ["nombre demasiado corto", { fullName: "An" }],
    ["documento con letras", { idDocument: "10ABC5678" }],
    ["documento demasiado corto", { idDocument: "123" }],
    ["institucion vacia", { institution: "" }],
    ["monto cero", { amount: 0 }],
    ["monto con decimales", { amount: 1500.5 }],
  ])("rechaza: %s", (_caso, cambio) => {
    expect(applicationFormSchema.safeParse({ ...valido, ...cambio }).success).toBe(false);
  });

  it("los mensajes llegan en español", () => {
    const resultado = applicationFormSchema.safeParse({ ...valido, idDocument: "abc" });
    expect(resultado.error?.issues[0]?.message).toMatch(/dígitos/);
  });
});

describe("applicationFormSchema: el video", () => {
  it("rechaza un formato no permitido", () => {
    const resultado = applicationFormSchema.safeParse({
      ...valido,
      video: archivoDe("video/avi", 1024),
    });

    expect(resultado.success).toBe(false);
    // El mensaje sale del esquema compartido, no de uno escrito aqui.
    expect(resultado.error?.issues[0]?.message).toMatch(/\.mp4 o \.webm/);
  });

  it("acepta un archivo EXACTAMENTE en el limite", () => {
    // El borde inclusivo importa: rechazarlo seria rechazar un archivo valido.
    const resultado = applicationFormSchema.safeParse({
      ...valido,
      video: archivoDe("video/mp4", MAX_VIDEO_BYTES),
    });

    expect(resultado.success).toBe(true);
  });

  it("rechaza un archivo un byte por encima del limite", () => {
    const resultado = applicationFormSchema.safeParse({
      ...valido,
      video: archivoDe("video/mp4", MAX_VIDEO_BYTES + 1),
    });

    expect(resultado.success).toBe(false);
    expect(resultado.error?.issues[0]?.message).toMatch(/200 MB/);
  });

  it("rechaza un archivo vacio", () => {
    expect(
      applicationFormSchema.safeParse({ ...valido, video: archivoDe("video/mp4", 0) }).success,
    ).toBe(false);
  });

  it("rechaza que no se haya elegido archivo", () => {
    expect(applicationFormSchema.safeParse({ ...valido, video: null }).success).toBe(false);
  });
});

describe("montoATexto", () => {
  it("convierte el texto del campo a numero", () => {
    expect(montoATexto("8500000")).toBe(8_500_000);
    expect(montoATexto("  8500000  ")).toBe(8_500_000);
  });

  it("deja el texto tal cual si no es un numero, para que el esquema lo rechace", () => {
    // Si se convirtiera a NaN o a 0 aqui, el mensaje de error perderia sentido.
    expect(montoATexto("ocho millones")).toBe("ocho millones");
  });

  it("traduce el campo vacio a ausencia, no a cadena vacia", () => {
    expect(montoATexto("")).toBeUndefined();
    expect(montoATexto("   ")).toBeUndefined();
  });

  it("un monto vacio dice que es obligatorio, no que tenga mal formato", () => {
    const resultado = applicationFormSchema.safeParse({ ...valido, amount: montoATexto("") });
    expect(resultado.error?.issues[0]?.message).toBe("El monto solicitado es obligatorio");
  });

  it("un texto no numerico hace fallar la validacion", () => {
    const resultado = applicationFormSchema.safeParse({
      ...valido,
      amount: montoATexto("ocho millones"),
    });

    expect(resultado.success).toBe(false);
  });
});

describe("tamanoLegible", () => {
  it.each([
    [15_728_640, "15.0 MB"],
    [2048, "2 KB"],
    [200 * 1024 * 1024, "200.0 MB"],
  ])("%s bytes se muestra como %s", (bytes, esperado) => {
    expect(tamanoLegible(bytes)).toBe(esperado);
  });
});
