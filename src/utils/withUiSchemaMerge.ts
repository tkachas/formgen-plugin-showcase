import { mergeSchemas, type GenericObjectType } from '@rjsf/utils';

export function withUiSchemaMerge(...uiSchemas: (GenericObjectType | undefined)[]): GenericObjectType {
  const validSchemas = uiSchemas.filter(
    (schema): schema is GenericObjectType => schema !== undefined && schema !== null,
  );

  if (validSchemas.length === 0) {
    return {};
  }

  if (validSchemas.length === 1) {
    return validSchemas[0];
  }

  return validSchemas.reduce((merged, current) => mergeSchemas(merged, current));
}
