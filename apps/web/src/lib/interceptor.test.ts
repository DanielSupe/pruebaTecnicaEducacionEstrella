import { describe, it, expect, vi, beforeEach } from "vitest";

const obtenerToken = vi.fn<() => Promise<string | null>>();

// Se simula el modulo de sesion: estas pruebas son del interceptor, no de la
// libreria de autenticacion.
vi.mock("./session.js", () => ({ getAccessToken: () => obtenerToken() }));

vi.mock("../config/config.js", () => ({
  config: { apiBaseUrl: "http://localhost:3000/api/v1" },
}));

const { http } = await import("./http.js");

/** Ejecuta la cadena de interceptores de peticion sin llegar a la red. */
async function cabecerasDeLaPeticion(): Promise<Record<string, unknown>> {
  const manejador = http.interceptors.request as unknown as {
    handlers: { fulfilled: (c: unknown) => Promise<{ headers: Record<string, unknown> }> }[];
  };

  const peticion = { headers: {} as Record<string, unknown> };
  const resultado = await manejador.handlers[0]!.fulfilled(peticion);
  return resultado.headers;
}

beforeEach(() => {
  obtenerToken.mockReset();
});

describe("interceptor de peticiones", () => {
  it("adjunta el token de acceso cuando hay sesion", async () => {
    obtenerToken.mockResolvedValue("token-de-acceso");

    const cabeceras = await cabecerasDeLaPeticion();

    expect(cabeceras.Authorization).toBe("Bearer token-de-acceso");
  });

  it("omite la cabecera cuando no hay sesion, en lugar de fallar", async () => {
    // Las pantallas publicas tambien usan este cliente: si esto lanzara, la
    // pantalla de acceso no podria hablar con la API.
    obtenerToken.mockResolvedValue(null);

    const cabeceras = await cabecerasDeLaPeticion();

    expect(cabeceras.Authorization).toBeUndefined();
  });

  it("pide el token en CADA peticion, sin guardarse una copia", async () => {
    // Cachearlo por nuestra cuenta significa enviar tokens caducados justo
    // cuando alguien lleva rato trabajando.
    obtenerToken.mockResolvedValue("primero");
    await cabecerasDeLaPeticion();

    obtenerToken.mockResolvedValue("segundo");
    const cabeceras = await cabecerasDeLaPeticion();

    expect(obtenerToken).toHaveBeenCalledTimes(2);
    expect(cabeceras.Authorization).toBe("Bearer segundo");
  });
});
