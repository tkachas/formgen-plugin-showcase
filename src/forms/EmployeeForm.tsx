import { useMemo } from 'react';
import type { UiSchema } from '@rjsf/utils';
import { Typography } from 'antd';
import { FormWrapper } from '../components/FormWrapper';
import {
  CreateEmployeeDtoFormSchema,
  CreateEmployeeDtoFormUiSchemaBase,
  type CreateEmployeeDtoCtx,
  type CreateEmployeeDtoForm,
  type CreateEmployeeDtoI18nType,
} from '../client';

const { Title, Paragraph } = Typography;

export default function EmployeeForm() {
  const context: CreateEmployeeDtoCtx = useMemo(() => ({
    uuids: {
      departmentId: [
        { label: 'Engineering', value: '11111111-1111-1111-1111-111111111111' },
        { label: 'Marketing', value: '22222222-2222-2222-2222-222222222222' },
        { label: 'Sales', value: '33333333-3333-3333-3333-333333333333' },
      ],
      managerId: [
        { label: 'John Doe', value: '44444444-4444-4444-4444-444444444444' },
        { label: 'Jane Smith', value: '55555555-5555-5555-5555-555555555555' },
      ],
      mentorIds: [
        { label: 'Alice Johnson', value: '66666666-6666-6666-6666-666666666666' },
        { label: 'Bob Williams', value: '77777777-7777-7777-7777-777777777777' },
        { label: 'Carol Brown', value: '88888888-8888-8888-8888-888888888888' },
      ],
      address_districtId: [
        { label: 'Central District', value: '99999999-9999-9999-9999-999999999999' },
        { label: 'Northern District', value: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' },
      ],
      skills_items_certificateId: [
        { label: 'AWS Certified', value: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' },
        { label: 'Azure Certified', value: 'cccccccc-cccc-cccc-cccc-cccccccccccc' },
      ],
      preferredWorkspace_anyOf: [
        { label: 'Main Office', value: 'dddddddd-dddd-dddd-dddd-dddddddddddd' },
        { label: 'Branch Office', value: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee' },
      ],
    },
  }), []);

  const customUiSchema: UiSchema<CreateEmployeeDtoForm> = {
    'ui:order': [
      'firstName',
      'lastName',
      'middleName',
      'birthDate',
      'employeeType',
      'active',
      'salary',
      'experienceYears',
      'departmentId',
      'managerId',
      'mentorIds',
      'avatar',
      'certificates',
      'address',
      'passport',
      'contactInfo',
      'emergencyContacts',
      'educations',
      'skills',
      'preferredWorkspace',
      '*',
    ],
  };

  const uiSchemaTitles: CreateEmployeeDtoI18nType = {
    'ui:title': 'Создание сотрудника',
    firstName: { 'ui:title': 'Имя' },
    lastName: { 'ui:title': 'Фамилия' },
    middleName: { 'ui:title': 'Отчество' },
    birthDate: { 'ui:title': 'Дата рождения' },
    employeeType: { 'ui:title': 'Тип занятости' },
    active: { 'ui:title': 'Активен' },
    salary: { 'ui:title': 'Заработная плата' },
    experienceYears: { 'ui:title': 'Стаж работы (лет)' },
    departmentId: { 'ui:title': 'Отдел' },
    managerId: { 'ui:title': 'Руководитель' },
    mentorIds: { 'ui:title': 'Наставники' },
    avatar: { 'ui:title': 'Фотография' },
    certificates: { 'ui:title': 'Сертификаты' },
    address: {
      'ui:title': 'Адрес регистрации',
      country: { 'ui:title': 'Страна' },
      city: { 'ui:title': 'Город' },
      street: { 'ui:title': 'Улица' },
      house: { 'ui:title': 'Дом' },
      postalCode: { 'ui:title': 'Почтовый индекс' },
      districtId: { 'ui:title': 'Район' },
    },
    passport: {
      'ui:title': 'Паспортные данные',
      series: { 'ui:title': 'Серия' },
      number: { 'ui:title': 'Номер' },
      issueDate: { 'ui:title': 'Дата выдачи' },
      issuedBy: { 'ui:title': 'Кем выдан' },
      scan: { 'ui:title': 'Скан паспорта' },
      attachments: { 'ui:title': 'Дополнительные документы' },
    },
    contactInfo: {
      'ui:title': 'Контактная информация',
      email: { 'ui:title': 'Электронная почта' },
      phone: { 'ui:title': 'Телефон' },
      telegram: { 'ui:title': 'Telegram' },
    },
    emergencyContacts: {
      'ui:title': 'Контакты для экстренной связи',
      items: {
        fullName: { 'ui:title': 'ФИО' },
        phone: { 'ui:title': 'Телефон' },
        relation: { 'ui:title': 'Степень родства' },
      },
    },
    educations: {
      'ui:title': 'Образование',
      items: {
        institution: { 'ui:title': 'Учебное заведение' },
        faculty: { 'ui:title': 'Факультет' },
        graduationDate: { 'ui:title': 'Дата окончания' },
        diplomaFile: { 'ui:title': 'Диплом' },
      },
    },
    skills: {
      'ui:title': 'Навыки',
      items: {
        name: { 'ui:title': 'Название навыка' },
        level: { 'ui:title': 'Уровень' },
        certificateId: { 'ui:title': 'Сертификат' },
      },
    },
    preferredWorkspace: { 'ui:title': 'Предпочитаемое место работы' },
  };

  const onSubmit = (data: CreateEmployeeDtoForm) => {
    console.log('Employee form submitted:', data);
  };

  return (
    <div>
      <Title level={2}>Форма сотрудника</Title>
      <FormWrapper
        schema={CreateEmployeeDtoFormSchema}
        uiSchemas={[customUiSchema, uiSchemaTitles, CreateEmployeeDtoFormUiSchemaBase]}
        context={context}
        onSubmit={onSubmit}
      />
    </div>
  );
}
