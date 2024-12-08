import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Stack } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const Sidebar = () => {
  const { t } = useTranslation();
 



  return (
    <aside className="bg-dark data-bs-theme-dark border-end vh-100" style={{ width: '250px' }}>
      <nav className="nav flex-column p-3">
        <Stack gap={3}>
        <Link className="nav-link" to="/">{t('sidebar.home')}</Link>
        <Link className="nav-link" to="/transactions">{t('sidebar.transactions')}</Link>
        <Link className='nav-link' to="/accounts">{t('sidebar.accounts')}</Link>
        <Link className='nav-link' to="/reports">{t('sidebar.reports')}</Link>
        <Link className='nav-link text-decoration-none text-light' to="/customers">{t('sidebar.customers')}</Link>
        </Stack>
      </nav>
    </aside>
  );
};

export default Sidebar;