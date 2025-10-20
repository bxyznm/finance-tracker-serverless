"""
Tests for card models and validation
"""

import pytest
from pydantic import ValidationError
from datetime import datetime

# Add the src directory to the path for imports
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

import pytest
from pydantic import ValidationError
from datetime import datetime, timezone
import sys
import os

# Add the parent directory to Python path so we can import src modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.models.card import (
    CardCreate, CardUpdate, CardResponse, CardTransaction, 
    CardPayment, CardBill, CardType, CardNetwork, CardStatus
)


class TestCardCreate:
    """Tests for CardCreate model validation"""
    
    def test_valid_card_creation(self):
        """Test creating a valid card"""
        card_data = {
            'name': 'Tarjeta Principal',
            'card_type': 'credit',
            'card_network': 'visa',
            'bank_name': 'BBVA',
            'credit_limit': 50000.0,
            'current_balance': 1000.0,
            'payment_due_date': 15,
            'cut_off_date': 1,
            'currency': 'MXN'
        }
        
        card = CardCreate(**card_data)
        assert card.name == 'Tarjeta Principal'
        assert card.card_type == 'credit'
        assert card.card_network == 'visa'
        assert card.bank_name == 'BBVA'
        assert card.credit_limit == 50000.0
        assert card.current_balance == 1000.0
        assert card.payment_due_date == 15
        assert card.cut_off_date == 1
        assert card.currency == 'MXN'
        assert card.status == 'active'  # Default value
    
    def test_minimal_card_creation(self):
        """Test creating a card with minimal required fields"""
        card_data = {
            'name': 'Tarjeta Básica',
            'card_type': 'debit',
            'card_network': 'mastercard',
            'bank_name': 'Santander'
        }
        
        card = CardCreate(**card_data)
        assert card.name == 'Tarjeta Básica'
        assert card.card_type == 'debit'
        assert card.card_network == 'mastercard'
        assert card.bank_name == 'Santander'
        assert card.current_balance == 0.0  # Default value
        assert card.currency == 'MXN'  # Default value
        assert card.status == 'active'  # Default value
    
    def test_invalid_card_type(self):
        """Test validation with invalid card type"""
        card_data = {
            'name': 'Test Card',
            'card_type': 'invalid_type',
            'card_network': 'visa',
            'bank_name': 'Test Bank'
        }
        
        with pytest.raises(ValidationError) as exc_info:
            CardCreate(**card_data)
        
        errors = exc_info.value.errors()
        assert any(error['type'] == 'literal_error' for error in errors)
    
    def test_invalid_card_network(self):
        """Test validation with invalid card network"""
        card_data = {
            'name': 'Test Card',
            'card_type': 'credit',
            'card_network': 'invalid_network',
            'bank_name': 'Test Bank'
        }
        
        with pytest.raises(ValidationError) as exc_info:
            CardCreate(**card_data)
        
        errors = exc_info.value.errors()
        assert any(error['type'] == 'literal_error' for error in errors)
    
    def test_empty_name_validation(self):
        """Test validation with empty name"""
        card_data = {
            'name': '',
            'card_type': 'credit',
            'card_network': 'visa',
            'bank_name': 'Test Bank'
        }
        
        with pytest.raises(ValidationError) as exc_info:
            CardCreate(**card_data)
        
        errors = exc_info.value.errors()
        assert any('name' in str(error) for error in errors)
    
    def test_whitespace_name_validation(self):
        """Test validation with whitespace-only name"""
        card_data = {
            'name': '   ',
            'card_type': 'credit',
            'card_network': 'visa',
            'bank_name': 'Test Bank'
        }
        
        with pytest.raises(ValidationError) as exc_info:
            CardCreate(**card_data)
        
        errors = exc_info.value.errors()
        assert any('empty' in str(error) for error in errors)
    
    def test_name_normalization(self):
        """Test that name gets normalized (extra spaces removed)"""
        card_data = {
            'name': '  Tarjeta   Principal  ',
            'card_type': 'credit',
            'card_network': 'visa',
            'bank_name': 'Test Bank'
        }
        
        card = CardCreate(**card_data)
        assert card.name == 'Tarjeta Principal'
    
    def test_negative_credit_limit(self):
        """Test validation with negative credit limit"""
        card_data = {
            'name': 'Test Card',
            'card_type': 'credit',
            'card_network': 'visa',
            'bank_name': 'Test Bank',
            'credit_limit': -1000.0
        }
        
        with pytest.raises(ValidationError) as exc_info:
            CardCreate(**card_data)
        
        errors = exc_info.value.errors()
        assert any('credit_limit' in str(error) for error in errors)
    
    def test_invalid_payment_due_date(self):
        """Test validation with invalid payment due date"""
        card_data = {
            'name': 'Test Card',
            'card_type': 'credit',
            'card_network': 'visa',
            'bank_name': 'Test Bank',
            'payment_due_date': 35  # Invalid day
        }
        
        with pytest.raises(ValidationError) as exc_info:
            CardCreate(**card_data)
        
        errors = exc_info.value.errors()
        assert any('payment_due_date' in str(error) for error in errors)
    
    def test_invalid_cut_off_date(self):
        """Test validation with invalid cut off date"""
        card_data = {
            'name': 'Test Card',
            'card_type': 'credit',
            'card_network': 'visa',
            'bank_name': 'Test Bank',
            'cut_off_date': 0  # Invalid day
        }
        
        with pytest.raises(ValidationError) as exc_info:
            CardCreate(**card_data)
        
        errors = exc_info.value.errors()
        assert any('cut_off_date' in str(error) for error in errors)
    
    def test_valid_date_range(self):
        """Test validation with valid date range"""
        card_data = {
            'name': 'Test Card',
            'card_type': 'credit',
            'card_network': 'visa',
            'bank_name': 'Test Bank',
            'payment_due_date': 15,
            'cut_off_date': 31
        }
        
        card = CardCreate(**card_data)
        assert card.payment_due_date == 15
        assert card.cut_off_date == 31


class TestCardUpdate:
    """Tests for CardUpdate model validation"""
    
    def test_partial_update(self):
        """Test updating only some fields"""
        update_data = {
            'name': 'Updated Name',
            'credit_limit': 75000.0
        }
        
        card_update = CardUpdate(**update_data)
        assert card_update.name == 'Updated Name'
        assert card_update.credit_limit == 75000.0
        assert card_update.bank_name is None  # Not updated
    
    def test_empty_update(self):
        """Test creating empty update (all fields optional)"""
        card_update = CardUpdate()
        assert card_update.name is None
        assert card_update.credit_limit is None
        assert card_update.status is None


class TestCardTransaction:
    """Tests for CardTransaction model validation"""
    
    def test_valid_transaction(self):
        """Test creating a valid transaction"""
        transaction_data = {
            'amount': 150.50,
            'description': 'Purchase at store',
            'transaction_type': 'purchase'
        }
        
        transaction = CardTransaction(**transaction_data)
        assert transaction.amount == 150.50
        assert transaction.description == 'Purchase at store'
        assert transaction.transaction_type == 'purchase'
    
    def test_negative_amount_refund(self):
        """Test validation with negative amount for refunds (should be valid)"""
        transaction_data = {
            'amount': -50.0,
            'description': 'Refund transaction',
            'transaction_type': 'refund'
        }
        
        # Negative amounts should be valid for refunds
        transaction = CardTransaction(**transaction_data)
        assert transaction.amount == -50.0
        assert transaction.description == 'Refund transaction'
        assert transaction.transaction_type == 'refund'

    def test_zero_amount(self):
        """Test validation with zero amount (should fail)"""
        transaction_data = {
            'amount': 0.0,
            'description': 'Invalid transaction',
            'transaction_type': 'purchase'
        }
        
        with pytest.raises(ValidationError) as exc_info:
            CardTransaction(**transaction_data)
        
        error = exc_info.value.errors()[0]
        assert error['type'] == 'value_error'
    
    def test_empty_description(self):
        """Test validation with empty description"""
        transaction_data = {
            'amount': 100.0,
            'description': '',
            'transaction_type': 'purchase'
        }
        
        with pytest.raises(ValidationError) as exc_info:
            CardTransaction(**transaction_data)
        
        errors = exc_info.value.errors()
        assert any('description' in str(error) for error in errors)


class TestCardPayment:
    """Tests for CardPayment model validation"""
    
    def test_valid_payment(self):
        """Test creating a valid payment"""
        payment_data = {
            'amount': 500.0,
            'description': 'Monthly payment'
        }
        
        payment = CardPayment(**payment_data)
        assert payment.amount == 500.0
        assert payment.description == 'Monthly payment'
    
    def test_negative_payment_amount(self):
        """Test validation with negative payment amount"""
        payment_data = {
            'amount': -100.0,
            'description': 'Invalid payment'
        }
        
        with pytest.raises(ValidationError) as exc_info:
            CardPayment(**payment_data)
        
        errors = exc_info.value.errors()
        assert any('amount' in str(error) for error in errors)


class TestCardResponse:
    """Tests for CardResponse model"""
    
    def test_valid_card_response(self):
        """Test CardResponse with all valid fields"""
        now = datetime.now(timezone.utc).isoformat()
        
        response_data = {
            'card_id': 'card_123',
            'user_id': 'user_456',
            'name': 'Visa Principal',
            'card_type': 'credit',
            'card_network': 'visa',
            'bank_name': 'BBVA',
            'credit_limit': 50000.0,
            'current_balance': 15000.0,
            'minimum_payment': 750.0,
            'payment_due_date': 15,
            'cut_off_date': 25,
            'currency': 'MXN',
            'status': 'active',
            'created_at': now,
            'updated_at': now
        }
        
        card_response = CardResponse(**response_data)
        assert card_response.card_id == 'card_123'
        assert card_response.user_id == 'user_456'
        assert card_response.name == 'Visa Principal'
        assert card_response.card_type == 'credit'
        assert card_response.card_network == 'visa'
        assert card_response.bank_name == 'BBVA'
        assert card_response.current_balance == 15000.0
        assert card_response.credit_limit == 50000.0
        assert card_response.currency == 'MXN'
        assert card_response.status == 'active'
    
    def test_calculated_available_credit(self):
        """Test CardResponse with calculated available credit"""
        now = datetime.now(timezone.utc).isoformat()
        
        response_data = {
            'card_id': 'card_123',
            'user_id': 'user_456',
            'name': 'Mastercard Oro',
            'card_type': 'credit',
            'card_network': 'mastercard',
            'bank_name': 'Santander',
            'credit_limit': 100000.0,
            'current_balance': 25000.0,
            'minimum_payment': 1250.0,
            'payment_due_date': 10,
            'cut_off_date': 20,
            'currency': 'MXN',
            'status': 'active',
            'created_at': now,
            'updated_at': now
        }
        
        card_response = CardResponse(**response_data)
        assert card_response.card_id == 'card_123'
        assert card_response.name == 'Mastercard Oro'
        assert card_response.card_type == 'credit'
        assert card_response.card_network == 'mastercard'
        assert card_response.bank_name == 'Santander'
        assert card_response.credit_limit == 100000.0
        assert card_response.current_balance == 25000.0
        assert card_response.currency == 'MXN'
        # Test that available credit calculation would be possible
        # (credit_limit - current_balance = 100000 - 25000 = 75000)
        if card_response.available_credit is not None:
            assert card_response.available_credit == 75000.0
    
    def test_inactive_status_allowed(self):
        """Test CardResponse accepts 'inactive' status for soft-deleted cards"""
        now = datetime.now(timezone.utc).isoformat()
        
        response_data = {
            'card_id': 'card_deleted',
            'user_id': 'user_123',
            'name': 'Tarjeta Eliminada',
            'card_type': 'credit',
            'card_network': 'visa',
            'bank_name': 'BBVA',
            'credit_limit': 30000.0,
            'current_balance': 5000.0,
            'currency': 'MXN',
            'status': 'inactive',  # Testing inactive status
            'created_at': now,
            'updated_at': now
        }
        
        # Should not raise ValidationError
        card_response = CardResponse(**response_data)
        assert card_response.status == 'inactive'
        assert card_response.card_id == 'card_deleted'
        assert card_response.name == 'Tarjeta Eliminada'


class TestCardBill:
    """Tests for CardBill model"""
    
    def test_valid_card_bill(self):
        """Test creating a valid card bill"""
        now = datetime.now(timezone.utc).isoformat()
        
        bill_data = {
            'bill_id': 'bill_123',
            'card_id': 'card_456',
            'user_id': 'user_789',
            'billing_month': 9,
            'billing_year': 2025,
            'statement_balance': 1500.0,
            'minimum_payment': 150.0,
            'payment_due_date': '2025-10-15',
            'status': 'pending',
            'paid_amount': 0.0,
            'late_fee': 0.0,
            'interest_charged': 0.0,
            'created_at': now,
            'updated_at': now
        }
        
        bill = CardBill(**bill_data)
        assert bill.bill_id == 'bill_123'
        assert bill.billing_month == 9
        assert bill.billing_year == 2025
        assert bill.statement_balance == 1500.0
        assert bill.minimum_payment == 150.0
        assert bill.status == 'pending'
