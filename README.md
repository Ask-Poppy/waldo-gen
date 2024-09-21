# Poppy Dataset Creation Workflow

## Setup Environment
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Generate Initial Samples
- Create `poppy_initial.jsonl` with initial training examples.

## Validate JSONL
- Run validation:
  ```bash
  python validate_jsonl.py
  ```

## Split and Validate Dataset
- Split into training and validation sets and validate:
  ```bash
  python split_and_validate_dataset.py
  ```

## Expand Dataset
- Generate additional samples:
  ```bash
  python generate_samples.py
  ```
- Append to `poppy_initial.jsonl` and validate again.

## Fine-Tune Model
- Proceed with model fine-tuning using the prepared datasets.