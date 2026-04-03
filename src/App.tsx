import { useState } from 'react';
import { ConfigProvider, Layout, Menu, Card, Typography } from 'antd';
import EmployeeForm from './forms/EmployeeForm';
import CompanyForm from './forms/CompanyForm';
import ProjectForm from './forms/ProjectForm';

const { Header, Content } = Layout;
const { Title } = Typography;

type FormType = 'employee' | 'company' | 'project';

function App() {
  const [selectedForm, setSelectedForm] = useState<FormType>('employee');

  const menuItems = [
    {
      key: 'employee',
      label: 'Создать сотрудника',
    },
    {
      key: 'company',
      label: 'Создать компанию',
    },
    {
      key: 'project',
      label: 'Создать проект',
    },
  ];

  const renderForm = () => {
    switch (selectedForm) {
      case 'employee':
        return <EmployeeForm />;
      case 'company':
        return <CompanyForm />;
      case 'project':
        return <ProjectForm />;
      default:
        return null;
    }
  };

  return (
    <ConfigProvider>
      <Layout style={{ minHeight: '100vh', display: 'flex',  alignItems: 'center' }}>
        <Header style={{ display: 'flex', alignItems: 'center', background: '#001529' }}>
          <Title level={3} style={{ color: 'white', margin: 0 }}>
            FormGen Showcase
          </Title>
        </Header>
        <Layout>
          <Content style={{ padding: '24px' }}>
            <Card style={{width: '800px'}}>
              <Menu
                mode="horizontal"
                selectedKeys={[selectedForm]}
                items={menuItems}
                onClick={({ key }) => setSelectedForm(key as FormType)}
                style={{ marginBottom: 24, maxWidth: '50vw' }}
              />
              {renderForm()}
            </Card>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
