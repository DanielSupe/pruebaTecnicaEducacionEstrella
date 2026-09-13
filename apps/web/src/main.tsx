import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { router } from "./routes/router.js";
import { queryClient } from "./lib/queryClient.js";
import "./index.css";

const contenedor = document.getElementById("root");

if (!contenedor) {
  throw new Error("No se encontro el elemento #root en el documento.");
}

createRoot(contenedor).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
