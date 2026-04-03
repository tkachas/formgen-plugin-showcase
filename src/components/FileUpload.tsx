import React from 'react';
import type { FieldProps } from '@rjsf/utils';
import { Upload, Button, Flex, Typography } from 'antd';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { UploadOutlined } from '@ant-design/icons';
import { toRcFile } from '../utils/toRcFile';

const FileUploadField: React.FC<FieldProps> = ({
  formData = [],
  onChange,
  uiSchema,
}) => {
  const fileList: UploadFile[] = (formData as File[]).map(toRcFile);

  const handleChange: UploadProps['onChange'] = info => {
    const updatedFiles = info.fileList
      .map(f => f.originFileObj)
      .filter(Boolean) as File[];
    onChange(updatedFiles);
  };

  return (
    <Flex vertical align="flex-start" gap={10}>
      {uiSchema && uiSchema['ui:title'] && (
        <Typography.Text strong>
          {uiSchema['ui:title']}
        </Typography.Text>
      )}
      <Upload
        multiple
        fileList={fileList}
        onChange={handleChange}
        beforeUpload={() => false}
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
      >
        <Button icon={<UploadOutlined />}>Select Files</Button>
      </Upload>
    </Flex>
  );
};

export default FileUploadField;
