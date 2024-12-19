import random
from faker import Faker
import mysql.connector
from mysql.connector import Error

def insert_random_clients(number_of_records):
    host = "127.0.0.1"  
    database = "quickbooks"  
    user = "root"  
    password = "root" 

    fake = Faker() 

    try:
        connection = mysql.connector.connect(
            host=host,
            database=database,
            user=user,
            password=password
        )

        if connection.is_connected():
            print("Подключение к базе данных успешно!")

            insert_query = """
                INSERT INTO Clients (name, email, phone, address, type)
                VALUES (%s, %s, %s, %s, %s)
            """

            cursor = connection.cursor()

            for _ in range(number_of_records):
                name = fake.company()
                email = fake.email()
                phone = fake.phone_number()[:20]
                address = fake.address().replace("\n", ", ")
                client_type = random.choice(['client', 'supplier'])

                cursor.execute(insert_query, (name, email, phone, address, client_type))

            connection.commit()
            print(f"Успешно добавлено {number_of_records} записей в таблицу Clients.")

    except Error as e:
        print(f"Ошибка подключения к базе данных: {e}")
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
            print("Соединение с базой данных закрыто.")

if __name__ == "__main__":
    insert_random_clients(10)
