import psycopg2
import sys

def reset_database():
    """Reset the database by deleting all purchase orders and signatures."""
    # Database connection parameters
    DB_PARAMS = {
        'dbname': 'secure_purchase_order',
        'user': 'postgres',
        'password': 'meet123',
        'host': 'localhost',
        'port': '5432'
    }
    
    try:
        # Connect to the database
        print("Connecting to PostgreSQL database...")
        conn = psycopg2.connect(**DB_PARAMS)
        
        # Create a cursor and enable autocommit mode
        conn.autocommit = False
        cursor = conn.cursor()
        
        try:
            # Start a transaction
            print("Starting database reset...")
            
            # First get counts
            cursor.execute("SELECT COUNT(*) FROM purchase_order_signature")
            signature_count = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM purchase_order_purchaseorder")
            order_count = cursor.fetchone()[0]
            
            # Delete data
            print("Deleting signatures...")
            cursor.execute("DELETE FROM purchase_order_signature")
            
            print("Deleting purchase orders...")
            cursor.execute("DELETE FROM purchase_order_purchaseorder")
            
            # Commit the transaction
            conn.commit()
            print(f"Successfully deleted {signature_count} signatures and {order_count} purchase orders.")
            print("Database reset complete.")
            
        except Exception as e:
            # Roll back the transaction in case of error
            conn.rollback()
            print(f"Error: {e}")
            print("Database reset failed. Rolling back changes.")
            return False
        finally:
            # Close cursor and connection
            cursor.close()
            conn.close()
            
        return True
        
    except Exception as e:
        print(f"Database connection error: {e}")
        return False

if __name__ == "__main__":
    print("*** Database Reset Tool ***")
    print("WARNING: This will delete ALL purchase orders and signatures from the database.")
    print("This action cannot be undone.")
    
    if len(sys.argv) > 1 and sys.argv[1] == "--force":
        confirm = "yes"
    else:
        confirm = input("Type 'yes' to confirm: ").lower()
    
    if confirm == "yes":
        success = reset_database()
        if success:
            print("Database reset completed successfully.")
        else:
            print("Database reset failed.")
    else:
        print("Operation cancelled.") 