import { describe, it, expect, vi, beforeEach } from "vitest";

const postApi = vi.fn();
const postAlmacenamiento = vi.fn();

/** Registro del orden real de las llamadas, para poder afirmar sobre la secuencia. */
const orden: string[] = [];

/**
 * Se simula http.js POR COMPLETO, sin ejecutar el modulo real.
 *
 * Tanto http.js como upload.ts llaman a axios.create(): si se dejara correr el
 * real, ambos recibirian el mismo doble y la prueba que separa los dos clientes
 * dejaria de probar nada. Asi cada uno queda claramente identificado.
 *
 * ApiError se define aqui porque upload.ts la importa de este mismo modulo, de
 * modo que el `instanceof` sigue siendo coherente.
 */
vi.mock("../../lib/http.js", () => {
  class ApiError extends Error {
    readonly code: string;
    readonly retriable: boolean;
    constructor(message: string, code = "API_ERROR") {
      super(message);
      this.name = "ApiError";
      this.code = code;
      this.retriable = true;
    }
  }

  return { http: { post: (...args: unknown[]) => postApi(...args) }, ApiError };
});

vi.mock("axios", async () => {
  const real = await vi.importActual<typeof import("axios")>("axios");
  return {
    ...real,
    default: {
      ...real.default,
      create: () => ({ post: (...args: unknown[]) => postAlmacenamiento(...args) }),
      isCancel: real.default.isCancel,
    },
  };
});

const {
  registrarSolicitud,
  transferirVideo,
  avisarSubidaCompletada,
  renovarAutorizacion,
  esCancelacion,
} = await import("./upload.js");

const AUTORIZACION = {
  url: "https://bucket.s3.amazonaws.com/",
  fields: { key: "videos/u/01HXYZ.mp4", tagging: "<Tagging/>", Policy: "abc" },
};

const DATOS = {
  fullName: "Ana Restrepo",
  idDocument: "1012345678",
  institution: "Universidad Nacional",
  program: "Ingeniería",
  amount: 8_500_000,
  videoContentType: "video/mp4",
};

function video(): File {
  return new File([new Uint8Array(64)], "entrevista.mp4", { type: "video/mp4" });
}

beforeEach(() => {
  orden.length = 0;
  postApi.mockReset();
  postAlmacenamiento.mockReset();

  postApi.mockImplementation((ruta: string) => {
    orden.push(ruta.includes("complete-upload") ? "avisar" : "registrar");
    return Promise.resolve({
      data: { applicationId: "01HXYZ", upload: AUTORIZACION, status: "UNDER_REVIEW" },
    });
  });

  postAlmacenamiento.mockImplementation(() => {
    orden.push("transferir");
    return Promise.resolve({ data: "" });
  });
});

describe("el flujo usa el cliente correcto en cada paso", () => {
  it("la transferencia NO pasa por el cliente de la API", async () => {
    // Ese cliente adjunta el token de acceso: usarlo para el almacenamiento
    // entregaria nuestras credenciales a un tercero que no las necesita.
    await transferirVideo(AUTORIZACION, video(), {
      onProgreso: () => {},
      signal: new AbortController().signal,
    });

    expect(postAlmacenamiento).toHaveBeenCalledOnce();
    expect(postApi).not.toHaveBeenCalled();
  });

  it("el registro y el aviso sí pasan por el cliente de la API", async () => {
    await registrarSolicitud(DATOS);
    await avisarSubidaCompletada("01HXYZ");

    expect(postApi).toHaveBeenCalledTimes(2);
    expect(postAlmacenamiento).not.toHaveBeenCalled();
  });
});

describe("el formulario multiparte", () => {
  it("incluye todos los campos de la autorización y el archivo AL FINAL", async () => {
    // El almacenamiento ignora todo lo que venga despues del archivo.
    await transferirVideo(AUTORIZACION, video(), {
      onProgreso: () => {},
      signal: new AbortController().signal,
    });

    const formulario = postAlmacenamiento.mock.calls[0]?.[1] as FormData;
    const claves = [...formulario.keys()];

    expect(claves).toEqual([...Object.keys(AUTORIZACION.fields), "file"]);
    expect(claves.at(-1)).toBe("file");
  });

  it("envía a la dirección de la autorización, no a la de la API", async () => {
    await transferirVideo(AUTORIZACION, video(), {
      onProgreso: () => {},
      signal: new AbortController().signal,
    });

    expect(postAlmacenamiento.mock.calls[0]?.[0]).toBe(AUTORIZACION.url);
  });
});

describe("orden de los pasos", () => {
  it("registra, transfiere y avisa, en ese orden", async () => {
    const { applicationId, upload } = await registrarSolicitud(DATOS);

    await transferirVideo(upload, video(), {
      onProgreso: () => {},
      signal: new AbortController().signal,
    });

    await avisarSubidaCompletada(applicationId);

    expect(orden).toEqual(["registrar", "transferir", "avisar"]);
  });

  it("si la transferencia falla, NO se avisa", async () => {
    postAlmacenamiento.mockRejectedValue(new Error("red caída"));

    await expect(
      transferirVideo(AUTORIZACION, video(), {
        onProgreso: () => {},
        signal: new AbortController().signal,
      }),
    ).rejects.toThrow();

    expect(orden).not.toContain("avisar");
  });
});

describe("errores", () => {
  it("indica en qué paso falló la transferencia", async () => {
    postAlmacenamiento.mockRejectedValue(new Error("red caída"));

    await expect(
      transferirVideo(AUTORIZACION, video(), {
        onProgreso: () => {},
        signal: new AbortController().signal,
      }),
    ).rejects.toMatchObject({ paso: "transferencia" });
  });

  it("no propaga el mensaje técnico del error original", async () => {
    postAlmacenamiento.mockRejectedValue(new Error("ECONNRESET socket hang up"));

    await expect(
      transferirVideo(AUTORIZACION, video(), {
        onProgreso: () => {},
        signal: new AbortController().signal,
      }),
    ).rejects.toThrow(/conexión/);
  });
});

describe("reintento", () => {
  it("pide una autorización nueva sin registrar otra solicitud", async () => {
    // Registrar otra dejaria una solicitud huerfana por cada intento fallido.
    postApi.mockResolvedValue({ data: { upload: AUTORIZACION } });

    await renovarAutorizacion("01HXYZ");

    expect(postApi).toHaveBeenCalledOnce();
    expect(postApi.mock.calls[0]?.[0]).toBe("/applications/01HXYZ/video-url");
  });
});

describe("cancelacion", () => {
  it("se distingue de un fallo, para no avisar de algo que el usuario acaba de hacer", async () => {
    // Sin esta distincion, cancelar mostraba una ventana de error con el texto
    // crudo "canceled". Cancelar es deliberado: no hay nada que reportar.
    const axios = (await import("axios")).default;
    const cancelacion = new axios.CanceledError("canceled");

    expect(esCancelacion(cancelacion)).toBe(true);
    expect(esCancelacion(new Error("red caída"))).toBe(false);
  });

  it("la cancelacion se propaga tal cual, sin envolverla como fallo de transferencia", async () => {
    const axios = (await import("axios")).default;
    postAlmacenamiento.mockRejectedValue(new axios.CanceledError("canceled"));

    const error = await transferirVideo(AUTORIZACION, video(), {
      onProgreso: () => {},
      signal: new AbortController().signal,
    }).catch((e: unknown) => e);

    // Si se envolviera en UploadError, quien llama no podria distinguirla.
    expect(esCancelacion(error)).toBe(true);
  });
});
