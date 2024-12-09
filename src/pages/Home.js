import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

function Home() {
  const { t } = useTranslation();
  return (
    <Tabs>
      <Tab eventKey="home" title={t('body.home')} >
        главная страница
      </Tab>
      <Tab eventKey="planner" title={t('body.planner')}>
        Tab content for planns
      </Tab>
    </Tabs>
  );
}

export default Home;