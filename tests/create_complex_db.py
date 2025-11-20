import sqlite3
import random
from datetime import datetime, timedelta
import os

def create_complex_db():
    db_path = "tests/data/complex_sales.db"
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Create Tables
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS customers (
        customer_id INTEGER PRIMARY KEY,
        name TEXT,
        email TEXT,
        signup_date DATE,
        country TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS products (
        product_id INTEGER PRIMARY KEY,
        name TEXT,
        category TEXT,
        price REAL,
        stock_quantity INTEGER
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        order_id INTEGER PRIMARY KEY,
        customer_id INTEGER,
        order_date DATE,
        status TEXT,
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS order_items (
        item_id INTEGER PRIMARY KEY,
        order_id INTEGER,
        product_id INTEGER,
        quantity INTEGER,
        unit_price REAL,
        FOREIGN KEY (order_id) REFERENCES orders(order_id),
        FOREIGN KEY (product_id) REFERENCES products(product_id)
    )
    """)

    # Generate Data
    countries = ['USA', 'UK', 'Canada', 'Germany', 'France']
    categories = ['Electronics', 'Clothing', 'Books', 'Home', 'Toys']
    statuses = ['Pending', 'Shipped', 'Delivered', 'Cancelled']

    # 1. Customers
    customers = []
    for i in range(1, 51):
        customers.append((
            i, 
            f"Customer {i}", 
            f"customer{i}@example.com", 
            (datetime.now() - timedelta(days=random.randint(0, 365))).strftime('%Y-%m-%d'),
            random.choice(countries)
        ))
    cursor.executemany("INSERT OR IGNORE INTO customers VALUES (?, ?, ?, ?, ?)", customers)

    # 2. Products
    products = []
    for i in range(1, 21):
        products.append((
            i,
            f"Product {i}",
            random.choice(categories),
            round(random.uniform(10.0, 500.0), 2),
            random.randint(0, 100)
        ))
    cursor.executemany("INSERT OR IGNORE INTO products VALUES (?, ?, ?, ?, ?)", products)

    # 3. Orders & Items
    orders = []
    order_items = []
    item_id_counter = 1
    
    for i in range(1, 101):
        order_date = (datetime.now() - timedelta(days=random.randint(0, 60))).strftime('%Y-%m-%d')
        customer_id = random.randint(1, 50)
        orders.append((i, customer_id, order_date, random.choice(statuses)))
        
        # Items for this order
        num_items = random.randint(1, 5)
        for _ in range(num_items):
            product_id = random.randint(1, 20)
            product = products[product_id-1]
            price = product[3]
            quantity = random.randint(1, 3)
            
            order_items.append((
                item_id_counter,
                i,
                product_id,
                quantity,
                price
            ))
            item_id_counter += 1

    cursor.executemany("INSERT OR IGNORE INTO orders VALUES (?, ?, ?, ?)", orders)
    cursor.executemany("INSERT OR IGNORE INTO order_items VALUES (?, ?, ?, ?, ?)", order_items)

    conn.commit()
    conn.close()
    print(f"Created complex database at {db_path}")

if __name__ == "__main__":
    create_complex_db()
