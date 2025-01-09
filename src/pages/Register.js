import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FloatingLabel, Form, Button } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function RegisterForm() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Отправляемые данные:', formData);
    
        axios.post('http://localhost:5000/register', formData)
            .then((response) => {
                console.log('Регистрация успешна:', response.data);
                toast.success('Регистрация успешна!');
                navigate('/login');
            })
            .catch((error) => {
                console.error('Ошибка регистрации:', error.response?.data || error.message);
                setError(error.response?.data?.message || 'Ошибка регистрации');
            });
    };
    
      

    return (
        <div className="container mt-5">
            <ToastContainer />
    <div className="row justify-content-center">
        <div className="col-md-5">
            <h2 className="text-center mb-4">Регистрация</h2>
            <form onSubmit={handleSubmit}>
                <FloatingLabel label="Имя" className="mb-3">
                    <Form.Control
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </FloatingLabel>

                <FloatingLabel label="Email" className="mb-3">
                    <Form.Control
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </FloatingLabel>

                <FloatingLabel label="Пароль" className="mb-3">
                    <Form.Control
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </FloatingLabel>

                <Button type="submit" className="btn btn-success w-100">
                    {t('form.register')}
                </Button>

                <div className="mt-3 text-center">
                    <span>{t('form.textToLogin')}</span>
                    <Link to="/login">{t('form.login')}</Link>
                </div>
            </form>

            {error && <p className="text-danger text-center mt-3">{error}</p>}
        </div>
    </div>
</div>

    );
}

export default RegisterForm;
