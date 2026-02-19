import path from "node:path";

export const config = {
  port: Number(process.env.PORT ?? 3001),
  assetsPath: path.resolve(__dirname, "../../recolour-case"),
  uploadsPath: path.resolve(__dirname, "../../recolour-case/uploads"),
} as const;
