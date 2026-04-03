import type { RJSFSchema, UiSchema } from '@rjsf/utils';

export function withTitleMap<T>(schema: RJSFSchema, uiSchema: UiSchema<T> = {}): UiSchema<T> {
  const properties = schema.properties || {};
  const titlesObj: Record<string, string | undefined> = {};

  for (const key of Object.keys(properties)) {
    const fieldUi = uiSchema[key];
    if (fieldUi && typeof fieldUi === 'object' && 'ui:title' in fieldUi) {
      titlesObj[key] = fieldUi['ui:title'] as string;
    }
  }

  return {
    ...uiSchema,
    'ui:propertyTitles': titlesObj,
  };
}
