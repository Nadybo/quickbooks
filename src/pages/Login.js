import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { FloatingLabel, Form, Button } from 'react-bootstrap';

function LoginPage({ onLogin }) {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
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
        setIsLoading(true);

        axios
            .post('http://localhost:5000/login', formData)
            .then((response) => {
                console.log('Вход успешен:', response.data);
                toast.success('Вы успешно вошли!', { position: 'top-center' });
                // Сохраняем токен
                localStorage.setItem('userToken', response.data.token);

                // Вызываем родительскую функцию, которая обновит состояние авторизации
                onLogin(true); // Передаем true, чтобы родительский компонент знал, что пользователь авторизован

                navigate('/');
            })
            .catch((error) => {
                toast.error('Ошибка входа. Проверьте данные!', { position: 'top-center' });
                setError(error.response?.data?.message || 'Неверный email или пароль');
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-5">
                    <h2 className="text-center mb-4">Вход</h2>
                    <form onSubmit={handleSubmit}>
                        <FloatingLabel controlId="floatingInput" label={t('form.email')} className="mb-3">
                            <Form.Control
                                type="email"
                                placeholder="name@example.com"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </FloatingLabel>

                        <FloatingLabel controlId="floatingPassword" label={t('form.password')} className="mb-3">
                            <Form.Control
                                type="password"
                                placeholder={t('form.password')}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </FloatingLabel>

                        <Button type="submit" className="btn btn-primary w-100" disabled={isLoading}>
                            {isLoading ? 'Загрузка...' : t('form.btnLogin')}
                        </Button>
                        <div className="mt-3 text-center">
                            <span>{t('form.text')}</span>   
                            <Link to="/register">{t('form.register')}</Link>
                        </div>
                    </form>

                    {error && <p className="text-danger text-center mt-3">{error}</p>}
                </div>
            </div>
        </div>
    );
}

export default LoginPage;