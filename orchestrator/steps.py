from .core import BaseStep, StepResult
import logging
from decimal import Decimal
from typing import Dict
from orchestrator.agents import risky_by_keywords, risky_by_deepseek

logger = logging.getLogger(__name__)


DEFAULT_PARAMS = {
    "dti_rule": {"max_dti_threshold": 0.4},
    "amount_policy": {
        "cap_for_country": {"ES": 30_000, "FR": 25_000, "DE": 35_000, "OTHER": 20_000}
    },
    "risk_scoring": {"approve_threshold": 45},
    "sentiment_check": {"risky_keywords": ["gambling", "crypto", "casino"]},
}



class DebtToIncomeRule(BaseStep):
    name = "dti_rule"
    

    def get_params(self, params):
        self.threshold = Decimal(
            params.get(
                "max_dti_threshold", DEFAULT_PARAMS["dti_rule"]["max_dti_threshold"]
            )
        )

    def execute(self, params: dict) -> StepResult:
        """Checks if DTI is below the configured threshold."""
        self.get_params(params)
        try:
            dti = self.application.declared_debts / self.application.monthly_income
        except (ZeroDivisionError, TypeError):
            logger.error(
                f"DTI Rule failed for App {self.application.id}: Invalid income data."
            )
            return "ERROR", {"reason": "Invalid income data", "dti": "N/A"}

        outcome = "PASS" if dti < self.threshold else "FAIL"
        detail = {"dti": round(dti, 4), "threshold": str(self.threshold)}

        return StepResult(outcome, detail)


class AmountPolicyRule(BaseStep):
    name = "amount_policy"

    def get_params(self, params):
        cap_for_country = params.get(
            "cap_for_country", DEFAULT_PARAMS["amount_policy"]["cap_for_country"]
        )
        country_code = self.application.country.upper()
        self.max_amount = Decimal(
            cap_for_country.get(
                country_code,
                cap_for_country.get(
                    "OTHER", DEFAULT_PARAMS["amount_policy"]["cap_for_country"]["OTHER"]
                ),
            )
        )

    def execute(self, params: dict) -> StepResult:
        """Checks if the loan amount exceeds the country-specific maximum."""
        self.get_params(params)
        outcome = "PASS" if self.application.amount <= self.max_amount else "FAIL"
        detail = {
            "country_max": self.max_amount,
            "application_amount": str(self.application.amount),
        }

        return StepResult(outcome, detail)


class RiskScoringStep(BaseStep):
    name = "risk_scoring"

    def get_params(self, params):
        _, details_amount_policy_calculation = AmountPolicyRule(
            self.application
        ).execute(params)
        _, details_dti_calculation = DebtToIncomeRule(self.application).execute(params)

        self.dti = details_dti_calculation["dti"]
        self.max_amount_allowed = details_amount_policy_calculation["country_max"]
        self.approve_threshold = params.get(
            "approve_threshold", DEFAULT_PARAMS["risk_scoring"]["approve_threshold"]
        )

    def execute(self, params: dict) -> StepResult:
        """Simulates an external call to a Risk Scoring Service."""
        # risk = (dti * 100) + (amount / max_allowed * 20)
        self.get_params(params)
        risk_score = (self.dti * 100) + (
            self.application.amount / self.max_amount_allowed * 20
        )

        outcome = "PASS" if risk_score <= self.approve_threshold else "FAIL"
        detail = {"risk_score": risk_score, "min_threshold": self.approve_threshold}

        return StepResult(outcome, detail)

class SentimentCheckStep:
    """
    Bonus agent-style step.
    Modes:
      - 'keyword' (default)
      - 'llm': uses DeepSeek R1 through OpenRouter
    """

    name = "sentiment_check"
    class SentimentSubStrategy():
        def is_risky(self, purpose: str, params: dict) -> bool: ...

    class KeywordSentiment(SentimentSubStrategy):
        def is_risky(self, purpose: str, params: dict) -> bool:
            keywords = params.get("risky_keywords", DEFAULT_PARAMS["sentiment_check"]["risky_keywords"])
            return risky_by_keywords(purpose, keywords)

    class LLMSentiment(SentimentSubStrategy):
        def is_risky(self, purpose: str, params: dict) -> bool:
            return risky_by_deepseek(purpose)

    SENTIMENT_MODES: Dict[str, SentimentSubStrategy] = {
        "keyword": KeywordSentiment(),
        "llm": LLMSentiment(),
    }

    def __init__(self, application):
        self.application = application

    def execute(self, params: dict) -> StepResult:
        mode = params.get("mode", "keyword")
        sentiment_strategy = self.SENTIMENT_MODES.get(mode, self.SENTIMENT_MODES["keyword"])
        purpose = (self.application.loan_purpose or "").strip()

        try:
            risky = sentiment_strategy.is_risky(purpose, params)
        except Exception as _:
            risky = self.SENTIMENT_MODES["keyword"].is_risky(purpose, params)
            mode = "keyword"

        outcome = "RISKY" if risky else "SAFE"
        detail = {
            "mode": mode,
            "purpose": purpose,
            "outcome_reason": (
                "Matched risky keywords"
                if (risky and mode == "keyword")
                else ("DeepSeek detected risk" if risky else "No risk detected")
            ),
        }
        return StepResult(outcome, detail)

STEP_PROCESSORS: Dict[str, BaseStep] = {
    "dti_rule": DebtToIncomeRule,
    "amount_policy": AmountPolicyRule,
    "risk_scoring": RiskScoringStep,
    "sentiment_check": SentimentCheckStep,
}
