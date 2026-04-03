import { useMemo } from 'react';
import type { UiSchema } from '@rjsf/utils';
import { Typography } from 'antd';
import { FormWrapper } from '../components/FormWrapper';
import {
  CreateCompanyDtoFormSchema,
  CreateCompanyDtoFormUiSchemaBase,
  type CreateCompanyDtoCtx,
  type CreateCompanyDtoForm,
  type CreateCompanyDtoI18nType,
} from '../client';

const { Title, Paragraph } = Typography;

export default function CompanyForm() {
  const context: CreateCompanyDtoCtx = useMemo(() => ({
    uuids: {
      legalAddress_districtId: [
        { label: 'Central District', value: '11111111-1111-1111-1111-111111111111' },
        { label: 'Northern District', value: '22222222-2222-2222-2222-222222222222' },
      ],
      actualAddress_districtId: [
        { label: 'Central District', value: '11111111-1111-1111-1111-111111111111' },
        { label: 'Northern District', value: '22222222-2222-2222-2222-222222222222' },
      ],
      representatives_items_allowedProjectIds: [
        { label: 'Project Alpha', value: '33333333-3333-3333-3333-333333333333' },
        { label: 'Project Beta', value: '44444444-4444-4444-4444-444444444444' },
        { label: 'Project Gamma', value: '55555555-5555-5555-5555-555555555555' },
      ],
      responsibleEmployeeId: [
        { label: 'John Doe', value: '66666666-6666-6666-6666-666666666666' },
        { label: 'Jane Smith', value: '77777777-7777-7777-7777-777777777777' },
      ],
      relatedCompanyIds: [
        { label: 'Partner Company A', value: '88888888-8888-8888-8888-888888888888' },
        { label: 'Partner Company B', value: '99999999-9999-9999-9999-999999999999' },
      ],
    },
  }), []);

  const customUiSchema: UiSchema<CreateCompanyDtoForm> = {
    'ui:order': [
      'companyName',
      'shortName',
      'registrationNumber',
      'taxNumber',
      'registrationDate',
      'companyType',
      'logo',
      'legalAddress',
      'actualAddress',
      'representatives',
      'responsibleEmployeeId',
      'relatedCompanyIds',
      '*',
    ],
  };

  const uiSchemaTitles: CreateCompanyDtoI18nType = {
    'ui:title': 'Создание организации',
    companyName: { 'ui:title': 'Наименование организации' },
    shortName: { 'ui:title': 'Краткое наименование' },
    registrationNumber: { 'ui:title': 'ОГРН' },
    taxNumber: { 'ui:title': 'ИНН' },
    registrationDate: { 'ui:title': 'Дата регистрации' },
    companyType: { 'ui:title': 'Организационно-правовая форма' },
    logo: { 'ui:title': 'Логотип' },
    legalAddress: {
      'ui:title': 'Юридический адрес',
      country: { 'ui:title': 'Страна' },
      city: { 'ui:title': 'Город' },
      street: { 'ui:title': 'Улица' },
      house: { 'ui:title': 'Дом' },
      postalCode: { 'ui:title': 'Почтовый индекс' },
      districtId: { 'ui:title': 'Район' },
    },
    actualAddress: {
      'ui:title': 'Фактический адрес',
      country: { 'ui:title': 'Страна' },
      city: { 'ui:title': 'Город' },
      street: { 'ui:title': 'Улица' },
      house: { 'ui:title': 'Дом' },
      postalCode: { 'ui:title': 'Почтовый индекс' },
      districtId: { 'ui:title': 'Район' },
    },
    representatives: {
      'ui:title': 'Представители',
      items: {
        fullName: { 'ui:title': 'ФИО' },
        position: { 'ui:title': 'Должность' },
        powerOfAttorneyFile: { 'ui:title': 'Доверенность' },
        allowedProjectIds: { 'ui:title': 'Доступные проекты' },
      },
    },
    responsibleEmployeeId: { 'ui:title': 'Ответственный сотрудник' },
    relatedCompanyIds: { 'ui:title': 'Связанные организации' },
  };

  const onSubmit = (data: CreateCompanyDtoForm) => {
    console.log('Company form submitted:', data);
  };

  return (
    <div>
      <Title level={2}>Форма организации</Title>
      <FormWrapper
        schema={CreateCompanyDtoFormSchema}
        uiSchemas={[customUiSchema, uiSchemaTitles, CreateCompanyDtoFormUiSchemaBase]}
        context={context}
        onSubmit={onSubmit}
      />
    </div>
  );
}
