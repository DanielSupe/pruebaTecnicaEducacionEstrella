import { describe, it, expect } from "vitest";
import {
  MAX_VIDEO_BYTES,
  VIDEO_CONTENT_TYPES,
  extensionForContentType,
  videoMetadataSchema,
} from "./video.js";

const validMetadata = { contentType: "video/mp4", sizeBytes: 1024 } as const;

describe("MAX_VIDEO_BYTES", () => {
  // Este valor lo comparten la validación del navegador, la política de subida
  // firmada y la verificación del objeto almacenado. Si alguien lo cambia sin
  // cambiar los otros dos, esta prueba lo detecta antes que un usuario.
  it("son exactamente 200 MiB", () => {
    expect(MAX_VIDEO_BYTES).toBe(209_715_200);
  });
});

describe("videoMetadataSchema: tipo de contenido", () => {
  it.each(Object.keys(VIDEO_CONTENT_TYPES))("acepta %s", (contentType) => {
    expect(videoMetadataSchema.safeParse({ ...validMetadata, contentType }).success).toBe(true);
  });

  it.each(["video/avi", "video/quicktime", "application/pdf", "", "VIDEO/MP4"])(
    "rechaza %s",
    (contentType) => {
      expect(videoMetadataSchema.safeParse({ ...validMetadata, contentType }).success).toBe(false);
    },
  );

  it("explica en español los formatos aceptados", () => {
    const result = videoMetadataSchema.safeParse({ ...validMetadata, contentType: "video/avi" });
    expect(result.error?.issues[0]?.message).toBe("El video debe estar en formato .mp4 o .webm");
  });
});

describe("videoMetadataSchema: tamaño", () => {
  it("acepta un video que pesa exactamente el límite", () => {
    // El límite es inclusivo: un video de justo 200 MiB es válido.
    const result = videoMetadataSchema.safeParse({ ...validMetadata, sizeBytes: MAX_VIDEO_BYTES });
    expect(result.success).toBe(true);
  });

  it("rechaza un video que pesa un solo byte más que el límite", () => {
    const result = videoMetadataSchema.safeParse({
      ...validMetadata,
      sizeBytes: MAX_VIDEO_BYTES + 1,
    });
    expect(result.success).toBe(false);
  });

  it.each([0, -1, 1.5, Number.NaN])("rechaza el tamaño %s", (sizeBytes) => {
    expect(videoMetadataSchema.safeParse({ ...validMetadata, sizeBytes }).success).toBe(false);
  });
});

describe("extensionForContentType", () => {
  it("deriva la extensión del tipo de contenido, no del nombre de archivo", () => {
    expect(extensionForContentType("video/mp4")).toBe("mp4");
    expect(extensionForContentType("video/webm")).toBe("webm");
  });
});
