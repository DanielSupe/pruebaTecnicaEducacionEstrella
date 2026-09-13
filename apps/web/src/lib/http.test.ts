import { describe, it, expect } from "vitest";
import { AxiosError, AxiosHeaders, CanceledError } from "axios";
import { toApiError, ApiError } from "./http.js";

function errorConRespuesta(status: number, data: unknown): AxiosError {
  const error = new AxiosError("Request failed with status code " + String(status));
  error.response = {
    status,
    statusText: "",
    data,
    headers: {},
    config: { headers: new AxiosHeaders() },
  };
  return error;
}

describe("toApiError: la API respondio con un error", () => {
  it("usa el mensaje que envia la API, que ya esta pensado para leerse", () => {
    const error = toApiError(
      errorConRespuesta(401, {
        error: { code: "UNAUTHORIZED", message: "Credenciales invalidas." },
      }),
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe("Credenciales invalidas.");
    expect(error.code).toBe("UNAUTHORIZED");
    expect(error.status).toBe(401);
  });

  it("no ofrece reintentar un 4xx: repetir la peticion da el mismo error", () => {
    expect(toApiError(errorConRespuesta(400, {})).retriable).toBe(false);
  });

  it("si ofrece reintentar un fallo del servidor", () => {
    expect(toApiError(errorConRespuesta(503, {})).retriable).toBe(true);
  });

  it("no filtra el mensaje tecnico crudo cuando la respuesta no tiene el formato esperado", () => {
    const error = toApiError(errorConRespuesta(500, "<html>Internal Server Error</html>"));

    expect(error.message).toBe("No se pudo completar la operación.");
    expect(error.message).not.toContain("html");
    expect(error.message).not.toContain("500");
  });
});

describe("toApiError: la API no respondio", () => {
  it("explica que es un problema de conexion y permite reintentar", () => {
    const sinRespuesta = new AxiosError("Network Error");
    const error = toApiError(sinRespuesta);

    expect(error.code).toBe("NETWORK_ERROR");
    expect(error.retriable).toBe(true);
    // "Network Error" no es un mensaje para una persona.
    expect(error.message).not.toContain("Network Error");
    expect(error.message).toMatch(/conectar/i);
  });
});

describe("toApiError: la peticion se cancelo", () => {
  it("no se trata como un fallo reintentable", () => {
    const error = toApiError(new CanceledError("canceled"));

    expect(error.code).toBe("CANCELLED");
    expect(error.retriable).toBe(false);
  });
});

describe("toApiError: cualquier otra cosa", () => {
  it("no propaga el error original a la interfaz", () => {
    const error = toApiError(new Error("SELECT * FROM usuarios"));

    expect(error.message).toBe("Ocurrió un error inesperado.");
    expect(error.message).not.toContain("SELECT");
  });
});
