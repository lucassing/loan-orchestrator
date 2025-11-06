import logging
from decimal import Decimal

logger = logging.getLogger(__name__)

class BaseStep:
    """Abstract base class for all pipeline steps."""
    name = "base_step"

    def __init__(self, application):
        self.application = application

    def execute(self, params: dict) -> tuple[str, dict]:
        """
        Executes the step logic.
        Returns: tuple of (outcome: str, detail: dict)
        """
        raise NotImplementedError("Subclasses must implement the execute method.")
