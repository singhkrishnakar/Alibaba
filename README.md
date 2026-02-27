# LLM Toolkit Automation Framework

A reusable, structured automation framework for the LLM Toolkit staging environment.

## Features

- **Modular Architecture**: Separated concerns into logical modules
- **Async/Await Pattern**: Efficient browser automation using Playwright
- **Comprehensive Logging**: Track all automation steps with detailed logs
- **Screenshot Capture**: Automatic screenshots at key steps
- **Configuration-Driven**: JSON-based configuration for easy customization
- **Error Handling**: Robust error handling and reporting

## Project Structure

```
framework/
├── config.py              # Configuration dataclasses
├── logger_setup.py        # Logging configuration
├── browser_manager.py     # Browser operations
├── authenticator.py       # Authentication module
├── project_selector.py    # Project navigation
├── prompt_creator.py      # Prompt creation
├── response_evaluator.py  # Response evaluation
├── form_handler.py        # Form submission
├── main.py               # Main orchestrator
├── requirements.txt      # Python dependencies
├── config_example.json   # Example configuration
└── README.md            # This file
```

## Installation

1. Navigate to framework directory
2. Install dependencies:
```bash
pip install -r requirements.txt
playwright install
```

## Usage

### Method 1: Using Configuration File

1. Create a `config.json` file based on `config_example.json`
2. Update with your credentials and settings
3. Run:
```python
import asyncio
from main import LLMToolkitAutomation

asyncio.run(LLMToolkitAutomation.from_config_file("config.json"))
```

### Method 2: Programmatic Usage

```python
import asyncio
from config import AutomationConfig, UserCredentials, ProjectConfig, PromptConfig, MetadataConfig, QuestionType
from main import LLMToolkitAutomation

config = AutomationConfig(
    credentials=UserCredentials(
        email="your_email@innodata.com",
        password="your_password"
    ),
    project=ProjectConfig(
        project_name="Your Project",
        project_url="/project/prompt/XXX"
    ),
    prompt=PromptConfig(
        question_text="Your question",
        question_type=QuestionType.ESSAY_STYLE,
        level="Undergraduate",
        discipline="Your Discipline"
    ),
    metadata=MetadataConfig(
        final_answer="Your answer",
        solution_process="Your process",
        thinking_process="Your thinking",
        level="Undergraduate",
        discipline="Your Discipline",
        key_points="Key points",
        no_unit_required=True
    )
)

automation = LLMToolkitAutomation(config)
asyncio.run(automation.run())
```

### Method 3: Custom Workflow

```python
import asyncio
from config import UserCredentials, ProjectConfig
from browser_manager import BrowserManager
from authenticator import LLMToolkitAuthenticator

async def custom_workflow():
    browser = BrowserManager(headless=False, screenshot_dir="./screenshots")
    await browser.launch()
    
    authenticator = LLMToolkitAuthenticator(browser)
    await authenticator.login(
        UserCredentials(email="user@innodata.com", password="password")
    )
    
    # Your custom logic here
    
    await browser.close()

asyncio.run(custom_workflow())
```

## Module Reference

### BrowserManager
Handles all browser operations:
- `launch()` - Start browser
- `navigate_to(url)` - Navigate to URL
- `click(selector)` - Click element
- `fill_text(selector, text)` - Fill input
- `evaluate_script(script)` - Run JavaScript
- `take_screenshot(filename)` - Save screenshot

### Authenticator
Handles login/logout:
- `login(credentials, base_url)` - Login to application
- `logout()` - Logout from application

### ProjectSelector
Navigate projects:
- `navigate_to_project(project_name)` - Select project
- `get_available_projects()` - List projects

### PromptCreator
Create and run prompts:
- `create_prompt(config)` - Create new prompt
- `run_prompt()` - Execute prompt

### ResponseEvaluator
Evaluate responses:
- `evaluate_response(index, status)` - Mark single response
- `evaluate_multiple_responses(evaluations)` - Mark multiple
- `mark_all_responses_random()` - Random evaluation

### FormHandler
Handle forms:
- `fill_metadata(metadata)` - Fill metadata form
- `submit_form()` - Submit form

## Configuration Options

### AutomationConfig
- `credentials`: User login credentials
- `project`: Project settings
- `prompt`: Prompt configuration
- `metadata`: Form metadata
- `headless`: Run in headless mode (default: False)
- `wait_timeout`: Default wait time in ms (default: 10000)
- `take_screenshots`: Enable screenshots (default: True)
- `screenshot_dir`: Screenshot directory (default: "./screenshots")

## Logging

Logs are saved to `./logs/automation_TIMESTAMP.log` and also printed to console.

## Extending the Framework

### Adding New Modules

1. Create a new module file (e.g., `my_module.py`)
2. Import `BrowserManager` and logger
3. Create a class with methods for your functionality
4. Use `browser.evaluate_script()` for JavaScript interactions

Example:
```python
from browser_manager import BrowserManager
from logger_setup import setup_logger

logger = setup_logger(__name__)

class MyModule:
    def __init__(self, browser_manager: BrowserManager):
        self.browser = browser_manager
    
    async def do_something(self):
        # Your code here
        logger.info("Did something")
```

### Adding to Main Workflow

```python
# In main.py
from my_module import MyModule

class LLMToolkitAutomation:
    def __init__(self, config):
        # ... existing code ...
        self.my_module = MyModule(self.browser)
    
    async def run(self):
        # ... existing code ...
        await self.my_module.do_something()
        # ... rest of code ...
```

## Troubleshooting

### Browser won't launch
- Install Playwright browsers: `playwright install`
- Check if port 3000+ is available

### Elements not found
- Check selectors in `evaluate_script()` calls
- Use `take_screenshot()` to debug page state
- Increase timeout in configuration

### Login fails
- Verify credentials are correct
- Check if login page URL is correct
- Check for CAPTCHA or 2FA

## Best Practices

1. Always use try-except blocks in async functions
2. Take screenshots at key workflow steps
3. Use descriptive error messages in logging
4. Keep credentials in separate config files
5. Test with small tasks before running large batches
6. Review screenshots to debug issues

## Future Enhancements

- [ ] Database logging
- [ ] Email notifications
- [ ] Parallel task execution
- [ ] Task scheduling
- [ ] Performance metrics
- [ ] Screenshot comparison
- [ ] CI/CD integration

## Support

For issues or questions, refer to the module docstrings and logging output.

## License

This framework is provided as-is for internal use.
