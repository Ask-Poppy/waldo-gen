# Poppy Dataset Creation Workflow

Welcome to the Poppy Dataset Creation Workflow! This guide will help you set up, simulate, generate, and curate a custom dataset for Poppy, an AI homework helper. Follow the steps below to get your project up and running.

## Table of Contents
1. [Setup Environment](#setup-environment)
2. [Generate Initial Samples](#generate-initial-samples)
3. [Validate JSONL Files](#validate-jsonl-files)
4. [Split and Validate Dataset](#split-and-validate-dataset)
5. [Generate Additional Samples](#generate-additional-samples)
6. [Upload Data](#upload-data)
7. [Fine-Tune Model](#fine-tune-model)
8. [Workflow Overview](#workflow-overview)
9. [Notes](#notes)
10. [Troubleshooting](#troubleshooting)
11. [Contributing](#contributing)
12. [License](#license)

## Setup Environment
1. **Clone the Repository**
   ```bash
   git clone https://github.com/simon-archer/waldo-gen.git
   cd waldo-gen
   ```

2. **Install Dependencies**
   Ensure you have Python installed. Then, install the required packages:
   ```bash
   pip install -r requirements.txt
   ```

## Generate Initial Samples
- Run the chat simulation to generate initial conversation samples:
  ```bash
  python scripts/chat.py
  ```

## Validate JSONL Files
- Ensure the data files are correctly formatted:
  ```bash
  python scripts/validate_jsonl.py
  ```

## Split and Validate Dataset
- Split the dataset into training and validation sets and validate:
  ```bash
  python scripts/split.py
  ```

## Generate Additional Samples
- Generate more conversation samples as needed:
  ```bash
  python scripts/generate.py
  ```
- Append the new samples to `data/conversations.jsonl` and validate again.

## Upload Data
- Upload your datasets (`training.jsonl` and `validation.jsonl`) for model fine-tuning:
  ```bash
  python scripts/upload.py
  ```

## Fine-Tune Model
- Use your curated datasets to fine-tune the Poppy model. Follow the specific instructions provided in the fine-tuning guide.

## Workflow Overview
1. **Simulate Conversations**: Use `chat.py` to generate conversation data.
2. **Validate Data**: Ensure all JSONL files are correctly formatted using `validate_jsonl.py`.
3. **Split Data**: Divide the data into training and validation sets using `split.py`.
4. **Generate More Data**: Expand the dataset with `generate.py` if needed.
5. **Upload Data**: Upload your datasets with `upload.py`.
6. **Fine-Tune**: Proceed with model fine-tuning using the prepared datasets.

## Notes
- **API Key**: Ensure you have a valid OpenAI API key. Replace the placeholder in `scripts/chat.py` with your actual key.
- **Data Files**: Keep your dataset files in the `data/` directory.
- **Regular Validation**: Always validate your data after any modifications to prevent errors during training.
- **Customization**: For advanced customization, refer to the individual script documentation within the `scripts/` folder.

## Troubleshooting
- **Invalid JSON**: If you encounter errors related to JSON formatting, run:
  ```bash
  python scripts/validate_jsonl.py
  ```
  This will help identify and fix errors in your dataset files.
  
- **Dependency Issues**: Ensure all packages are installed correctly with:
  ```bash
  pip install -r requirements.txt
  ```
  
- **API Errors**: If you face issues related to the OpenAI API, check your API key and internet connection.

## Contributing
We welcome contributions! To contribute to the Poppy project:
1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Commit your changes with clear messages.
4. Open a pull request detailing your changes.

Please ensure your contributions adhere to the project's code of conduct.

## License
This project is licensed under the [MIT License](LICENSE).