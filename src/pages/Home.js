import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import React from 'react';
import { useTranslation } from 'react-i18next';

function Home() {
  const { t } = useTranslation();
  return (
    <Tabs
      defaultActiveKey="home"
      id="uncontrolled-tab-example"
      className="mb-3"
    >
      <Tab eventKey="home" title={t('body.home')} >
        главная страница
      </Tab>
      <Tab eventKey="planner" title="Planner">
        Tab content for planns
      </Tab>
    </Tabs>
  );
}

export default Home;