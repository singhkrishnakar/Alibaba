"""
Configuration management for LLM Toolkit automation
"""
from dataclasses import dataclass
from typing import List, Optional
from enum import Enum


class QuestionType(Enum):
    """Question type options"""
    MULTIPLE_CHOICE = "Multiple Choice"
    ESSAY_STYLE = "Essay Style"


class ResponseStatus(Enum):
    """Response evaluation status"""
    CORRECT = "Correct"
    INCORRECT = "Incorrect"


@dataclass
class UserCredentials:
    """User login credentials"""
    email: str
    password: str


@dataclass
class ProjectConfig:
    """Project configuration"""
    project_name: str
    project_url: str
    base_url: str = "https://llmtoolkit-staging.innodata.com"


@dataclass
class PromptConfig:
    """Prompt creation configuration"""
    question_text: str
    question_type: QuestionType
    level: str
    discipline: str
    base_model: Optional[str] = None


@dataclass
class MetadataConfig:
    """Metadata configuration for submission"""
    final_answer: str
    solution_process: str
    thinking_process: str
    level: str
    discipline: str
    key_points: Optional[str] = None
    answer_unit: Optional[str] = None
    no_unit_required: bool = False


@dataclass
class AutomationConfig:
    """Complete automation configuration"""
    credentials: UserCredentials
    project: ProjectConfig
    prompt: PromptConfig
    metadata: MetadataConfig
    headless: bool = False
    wait_timeout: int = 10000
    take_screenshots: bool = True
    screenshot_dir: str = "./screenshots"


# Example configuration
EXAMPLE_CONFIG = {
    "credentials": {
        "email": "pzr@innodata.com",
        "password": "Password@2027"
    },
    "project": {
        "project_name": "Chem v3",
        "project_url": "/project/prompt/356"
    },
    "prompt": {
        "question_text": "hi",
        "question_type": "Essay Style",
        "level": "Undergraduate",
        "discipline": "Organic Chemistry"
    },
    "metadata": {
        "final_answer": "The model responded with a greeting...",
        "solution_process": "Evaluated the response quality...",
        "thinking_process": "Assessed model response...",
        "level": "Undergraduate",
        "discipline": "Organic Chemistry",
        "key_points": "Model greeting responses are appropriate",
        "no_unit_required": True
    }
}
