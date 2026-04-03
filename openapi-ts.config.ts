import { defineConfig } from "@hey-api/openapi-ts";
import { defineConfig as formgenDefineConfig } from "./plugins/formgen/index.ts";

export default defineConfig({
  input: "./openapi.yaml",
  output: "src/client",
  plugins: [
    {
      name: "@hey-api/typescript",
    },
    formgenDefineConfig({
      targetSchemas: {
        CreateEmployeeDto: { excludeFields: ['id'] },
        CreateCompanyDto: { excludeFields: ['id'] },
        CreateProjectDto: { excludeFields: ['id'] },
      },
    }),
  ],
});
