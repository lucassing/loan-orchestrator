from .core import BaseStep
import logging
from decimal import Decimal

logger = logging.getLogger(__name__)
# ----------------------------------------------------------------------
# Core Business Rules (from the exercise scope)
# ----------------------------------------------------------------------
class DebtToIncomeRule(BaseStep):
    name = "dti_rule"

    def execute(self, params: dict) -> tuple[str, dict]:
        """Checks if DTI is below the configured threshold."""
        try:
            # Use Decimal for financial precision
            dti = self.application.declared_debts / self.application.monthly_income
        except (ZeroDivisionError, TypeError):
            logger.error(
                f"DTI Rule failed for App {self.application.id}: Invalid income data."
            )
            return "ERROR", {"reason": "Invalid income data", "dti": "N/A"}

        threshold = Decimal(params.get("max_dti_threshold", "0.35"))  # Default 35%

        outcome = "PASS" if dti <= threshold else "FAIL"
        detail = {"dti": str(round(dti, 4)), "threshold": str(threshold)}

        return outcome, detail


class AmountPolicyRule(BaseStep):
    name = "amount_policy"

    def execute(self, params: dict) -> tuple[str, dict]:
        """Checks if the loan amount exceeds the country-specific maximum."""
        max_amounts = params.get("max_amounts", {})

        # Get the max amount for the application's country or a default 'OTHER'
        country_code = self.application.country.upper()
        max_amount = Decimal(
            max_amounts.get(country_code, max_amounts.get("OTHER", "25000"))
        )

        outcome = "PASS" if self.application.amount <= max_amount else "FAIL"
        detail = {
            "country_max": str(max_amount),
            "application_amount": str(self.application.amount),
        }

        return outcome, detail


# ----------------------------------------------------------------------
# External Service/Bonus Steps (from the exercise scope)
# ----------------------------------------------------------------------


class RiskScoringStep(BaseStep):
    name = "risk_scoring"

    def execute(self, params: dict) -> tuple[str, dict]:
        """Simulates an external call to a Risk Scoring Service."""

        # --- SIMULATION START ---
        import random

        # Logic is simulated to depend on application data
        base_score = 700
        if self.application.monthly_income < 2500:
            base_score -= 50

        # Add random noise for a realistic simulation
        risk_score = base_score + random.randint(-40, 40)
        # --- SIMULATION END ---

        score_threshold = int(params.get("min_score", 650))

        # Outcome is typically a score or a calculated tier/threshold status
        outcome = "SCORE"
        detail = {"risk_score": risk_score, "min_threshold": score_threshold}

        return outcome, detail


class SentimentCheck(BaseStep):
    name = "sentiment_check"

    def execute(self, params: dict) -> tuple[str, dict]:
        """
        Simulates an external AI Agent call to check for risky loan purposes.
        (The preferred solution is a real API call, but we simulate it here.)
        """

        # --- SIMULATION START (AI Agent) ---
        risky_keywords = params.get(
            "risky_keywords", ["gambling", "crypto", "speculation", "investment"]
        )
        loan_purpose = self.application.loan_purpose.lower()

        is_risky = any(keyword in loan_purpose for keyword in risky_keywords)
        # --- SIMULATION END ---

        outcome = "FAIL" if is_risky else "PASS"
        detail = {
            "keywords_detected": is_risky,
            "purpose": self.application.loan_purpose[:50],
        }

        return outcome, detail


# Step Processor Map: used by the Celery task to map step_type to class
STEP_PROCESSORS = {
    "dti_rule": DebtToIncomeRule,
    "amount_policy": AmountPolicyRule,
    "risk_scoring": RiskScoringStep,
    "sentiment_check": SentimentCheck,
}
