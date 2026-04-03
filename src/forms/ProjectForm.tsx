import { useMemo } from 'react';
import type { UiSchema } from '@rjsf/utils';
import { Typography } from 'antd';
import { FormWrapper } from '../components/FormWrapper';
import {
  CreateProjectDtoFormSchema,
  CreateProjectDtoFormUiSchemaBase,
  type CreateProjectDtoCtx,
  type CreateProjectDtoForm,
  type CreateProjectDtoI18nType,
} from '../client';

const { Title, Paragraph } = Typography;

export default function ProjectForm() {
  const context: CreateProjectDtoCtx = useMemo(() => ({
    uuids: {
      ownerId: [
        { label: 'John Doe', value: '11111111-1111-1111-1111-111111111111' },
        { label: 'Jane Smith', value: '22222222-2222-2222-2222-222222222222' },
      ],
      reviewerIds: [
        { label: 'Alice Johnson', value: '33333333-3333-3333-3333-333333333333' },
        { label: 'Bob Williams', value: '44444444-4444-4444-4444-444444444444' },
        { label: 'Carol Brown', value: '55555555-5555-5555-5555-555555555555' },
      ],
      companyId: [
        { label: 'Tech Corp', value: '66666666-6666-6666-6666-666666666666' },
        { label: 'Innovation Ltd', value: '77777777-7777-7777-7777-777777777777' },
      ],
      teamMemberIds: [
        { label: 'Developer 1', value: '88888888-8888-8888-8888-888888888888' },
        { label: 'Developer 2', value: '99999999-9999-9999-9999-999999999999' },
        { label: 'Designer 1', value: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' },
      ],
      documents_items_tagIds: [
        { label: 'Contract', value: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' },
        { label: 'Specification', value: 'cccccccc-cccc-cccc-cccc-cccccccccccc' },
        { label: 'Report', value: 'dddddddd-dddd-dddd-dddd-dddddddddddd' },
      ],
      executionMode_anyOf: [
        { label: 'External Contractor A', value: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee' },
        { label: 'External Contractor B', value: 'ffffffff-ffff-ffff-ffff-ffffffffffff' },
      ],
    },
  }), []);

  const customUiSchema: UiSchema<CreateProjectDtoForm> = {
    'ui:order': [
      'name',
      'description',
      'startDate',
      'endDate',
      'status',
      'budget',
      'ownerId',
      'reviewerIds',
      'companyId',
      'teamMemberIds',
      'coverImage',
      'documents',
      'executionMode',
      '*',
    ],
  };

  const uiSchemaTitles: CreateProjectDtoI18nType = {
    'ui:title': 'Создание проекта',
    name: { 'ui:title': 'Название проекта' },
    description: { 'ui:title': 'Описание' },
    startDate: { 'ui:title': 'Дата начала' },
    endDate: { 'ui:title': 'Дата окончания' },
    status: { 'ui:title': 'Статус' },
    budget: { 'ui:title': 'Бюджет' },
    ownerId: { 'ui:title': 'Владелец проекта' },
    reviewerIds: { 'ui:title': 'Проверяющие' },
    companyId: { 'ui:title': 'Организация' },
    teamMemberIds: { 'ui:title': 'Участники команды' },
    coverImage: { 'ui:title': 'Обложка' },
    documents: {
      'ui:title': 'Документы проекта',
      items: {
        title: { 'ui:title': 'Название документа' },
        description: { 'ui:title': 'Описание' },
        file: { 'ui:title': 'Файл' },
        tagIds: { 'ui:title': 'Теги' },
      },
    },
    executionMode: { 'ui:title': 'Режим выполнения' },
  };

  const onSubmit = (data: CreateProjectDtoForm) => {
    console.log('Project form submitted:', data);
  };

  return (
    <div>
      <Title level={2}>Форма проекта</Title>
      <FormWrapper
        schema={CreateProjectDtoFormSchema}
        uiSchemas={[customUiSchema, uiSchemaTitles, CreateProjectDtoFormUiSchemaBase]}
        context={context}
        onSubmit={onSubmit}
      />
    </div>
  );
}
