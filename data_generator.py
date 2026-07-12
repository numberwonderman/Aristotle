import csv
import random

def generate_data(num_samples=1000):
    with open('training_data.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['op', 'lhs', 'rhs', 'is_valid'])
        
        for _ in range(num_samples):
            lhs = random.randint(1, 20)
            rhs = random.randint(1, 20)
            # Create a valid move (e.g., subtracting)
            writer.writerow([1, lhs + rhs, rhs, 1])
            # Create an invalid move (e.g., adding instead of subtracting)
            writer.writerow([1, lhs, rhs, 0])

generate_data()
print("Trainer Ingredients created: training_data.csv")
