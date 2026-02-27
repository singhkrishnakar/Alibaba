"""
Logging setup for automation
"""
import logging
import sys
import io
from pathlib import Path
from datetime import datetime


def setup_logger(name: str, log_file: str = None, level=logging.INFO):
    """
    Setup logger with console and file handlers
    
    Args:
        name: Logger name
        log_file: Optional log file path
        level: Logging level
    
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # Console handler with UTF-8 encoding
    if sys.stdout.encoding != 'utf-8':
        console_stream = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    else:
        console_stream = sys.stdout
    console_handler = logging.StreamHandler(console_stream)
    console_handler.setLevel(level)
    console_format = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    console_handler.setFormatter(console_format)
    logger.addHandler(console_handler)
    
    # File handler (optional)
    if log_file:
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(level)
        file_format = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        file_handler.setFormatter(file_format)
        logger.addHandler(file_handler)
    
    return logger


def get_timestamp():
    """Get current timestamp for logging"""
    return datetime.now().strftime("%Y%m%d_%H%M%S")
