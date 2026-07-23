import csv
import random

def generate_data(num_samples=1000):
    """
    Generates algebra balancing examples.

    Features:
      op                -> 0 = subtract, 1 = add
      lhs_delta         -> change applied to left side
      rhs_delta         -> change applied to right side
      delta_difference  -> lhs_delta - rhs_delta

    Label:
      is_valid          -> 1 if both sides received the same change
                           0 otherwise
    """

    with open('training_data.csv', 'w', newline='') as f:
        writer = csv.writer(f)

        writer.writerow([
            'op',
            'lhs_delta',
            'rhs_delta',
            'delta_difference',
            'is_valid'
        ])

        for _ in range(num_samples):

            op = random.randint(0, 1)
            k = random.randint(1, 20)

            # Valid balance step
            difference = k - k

            writer.writerow([
                op,
                k,
                k,
                difference,
                1
            ])


            # Invalid balance step
            wrong_k = random.randint(1, 20)

            while wrong_k == k:
                wrong_k = random.randint(1, 20)

            difference = k - wrong_k

            writer.writerow([
                op,
                k,
                wrong_k,
                difference,
                0
            ])


generate_data()

print("Trainer ingredients created: training_data.csv")