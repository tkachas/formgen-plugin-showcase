import { useMemo } from 'react';
import Form from '@rjsf/antd';
import validator from '@rjsf/validator-ajv8';
import { mergeSchemas, type RJSFSchema, type UiSchema } from '@rjsf/utils';
import type { IChangeEvent } from '@rjsf/core';
import { Button, Space, message } from 'antd';
import FileUploadField from './FileUpload';
import UuidSelectWidget from './UuidSelect';
import CustomizableDateWidget from './CustomizableDateWidget';
import { withUiSchemaMerge } from '../utils/withUiSchemaMerge';
import { withTitleMap } from '../utils/withTitleMap';

interface FormWrapperProps<T, C> {
  schema: RJSFSchema;
  uiSchemas: UiSchema[];
  context: C;
  customSchema?: RJSFSchema;
  onSubmit?: (formData: T) => void;
}

export function FormWrapper<T, C>(props: FormWrapperProps<T, C>) {
  const { schema, uiSchemas, context, customSchema, onSubmit } = props;

  const mergedSchema = useMemo(() => {
    if (customSchema) {
      return mergeSchemas(schema, customSchema);
    }
    return schema;
  }, [schema, customSchema]);

  const mergedUiSchema = useMemo(() => {
    return withUiSchemaMerge(...uiSchemas);
  }, [uiSchemas]);

  const onDataSubmit = (data: IChangeEvent) => {
    if (onSubmit) {
      onSubmit(data.formData);
      message.success('Form submitted successfully!');
      console.log('Form data:', data.formData);
    }
  };

  return (
    <Form
      liveValidate
      schema={mergedSchema}
      uiSchema={withTitleMap(mergedSchema, mergedUiSchema)}
      formContext={context}
      validator={validator}
      onSubmit={onDataSubmit}
      showErrorList={false}
      fields={{
        fileUpload: FileUploadField,
      }}
      widgets={{
        uuidSelect: UuidSelectWidget,
        customizableDate: CustomizableDateWidget,
      }}
    >
      <Space style={{ marginTop: 16 }}>
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
      </Space>
    </Form>
  );
}
