import logging
from dataclasses import dataclass
from decimal import Decimal

logger = logging.getLogger(__name__)

from enum import Enum
from typing import Any, Dict


class Outcome(str, Enum):
    PASS_ = "PASS"
    FAIL = "FAIL"
    ERROR = "ERROR"


@dataclass(frozen=True)
class StepResult:
    outcome: Outcome
    detail: Dict[str, Any]

    def __iter__(self):
        yield self.outcome
        yield self.detail


class BaseStep:
    """Abstract base class for all pipeline steps."""

    name = "base_step"

    def __init__(self, application):
        self.application = application

    def get_params(self, params):
        raise NotImplementedError("Subclasses must implement the method.")

    def execute(self, params: dict) -> StepResult:
        """
        Executes the step logic.
        Returns: tuple of (outcome: str, detail: dict)
        """
        raise NotImplementedError("Subclasses must implement the method.")
