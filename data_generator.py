import csv
import random

def generate_data(num_samples=1000):
    """
    Simulates a single algebra balancing step: given an equation state
    a = b, and an operation applied to isolate a variable, was the
    SAME value subtracted/added from BOTH sides?

    Features:
      op        -> 0 = subtract, 1 = add
      lhs_delta -> amount actually changed on the left side
      rhs_delta -> amount actually changed on the right side
    Label:
      is_valid  -> 1 if lhs_delta == rhs_delta (correctly balanced), else 0
    """
    with open('training_data.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['op', 'lhs_delta', 'rhs_delta', 'is_valid'])

        for _ in range(num_samples):
            op = random.randint(0, 1)  # 0 = subtract, 1 = add
            k = random.randint(1, 20)  # the value being applied

            # Valid case: same k applied to both sides
            writer.writerow([op, k, k, 1])

            # Invalid case: different (mismatched) value applied to one side
            wrong_k = random.randint(1, 20)
            while wrong_k == k:
                wrong_k = random.randint(1, 20)
            writer.writerow([op, k, wrong_k, 0])

generate_data()
print("Trainer Ingredients created: training_data.csv")ted: training_data.csv")

def generate_data(num_samples=1000):
    """
    Simulates a single algebra balancing step: given an equation state
    a = b, and an operation applied to isolate a variable, was the
    SAME value subtracted/added from BOTH sides?

    Features:
      op        -> 0 = subtract, 1 = add
      lhs_delta -> amount actually changed on the left side
      rhs_delta -> amount actually changed on the right side
    Label:
      is_valid  -> 1 if lhs_delta == rhs_delta (correctly balanced), else 0
    """
    with open('training_data.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['op', 'lhs_delta', 'rhs_delta', 'is_valid'])

        for _ in range(num_samples):
            op = random.randint(0, 1)  # 0 = subtract, 1 = add
            k = random.randint(1, 20)  # the value being applied

            # Valid case: same k applied to both sides
            writer.writerow([op, k, k, 1])

            # Invalid case: different (mismatched) value applied to one side
            wrong_k = random.randint(1, 20)
            while wrong_k == k:
                wrong_k = random.randint(1, 20)
            writer.writerow([op, k, wrong_k, 0])

generate_data()
print("Trainer Ingredients created: training_data.csv")
