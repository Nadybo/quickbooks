import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FloatingLabel, Form, Button } from 'react-bootstrap';
import { toast } from 'react-toastify';

function RegisterForm() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user',
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { t } = useTranslation();

    // Обработка изменения полей ввода
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    // Обработка отправки формы
    const handleSubmit = (e) => {
        e.preventDefault();

        axios.post('http://localhost:5000/register', formData)
            .then((response) => {
                console.log('Регистрация успешна:', response.data);
                toast.success('Регистрация успешна!', { position: 'top-center' });
                // Перенаправление на главную страницу
                navigate('/login');
            })
            .catch((error) => {
                console.error('Ошибка регистрации:', error.response?.data || error.message);
                setError(error.response?.data?.message || 'Ошибка регистрации');
            });
    };

    return (
        <div className="container mt-5">
    <div className="row justify-content-center">
        <div className="col-md-6">
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

                <FloatingLabel label="Роль" className="mb-3">
                    <Form.Select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                    >
                        <option value="user">Пользователь</option>
                        <option value="admin">Администратор</option>
                    </Form.Select>
                </FloatingLabel>

                <Button type="submit" className="btn btn-primary w-100">
                    {t('form.register')}
                </Button>

                <div className="mt-3 text-center">
                    <span>{t('form.text')}</span>
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
