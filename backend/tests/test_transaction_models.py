"""
Tests for Transaction models validation using Pydantic
"""

import pytest
from decimal import Decimal
from pydantic import ValidationError
from models.transaction import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    TransactionListResponse,
    TransactionSummary,
    TransactionFilter
)


class TestTransactionCreate:
    """Tests for TransactionCreate model validation"""
    
    def test_valid_expense_transaction(self):
        """Test creating a valid expense transaction"""
        transaction_data = {
            'account_id': 'acc_test123',
            'amount': 50.99,
            'description': 'Lunch at restaurant',
            'transaction_type': 'expense',
            'category': 'food_drinks'
        }
        
        transaction = TransactionCreate(**transaction_data)
        assert transaction.account_id == 'acc_test123'
        assert transaction.amount == Decimal('50.99')
        assert transaction.description == 'Lunch at restaurant'
        assert transaction.transaction_type == 'expense'
        assert transaction.category == 'food_drinks'
        assert transaction.is_recurring is False
        assert transaction.tags == []
    
    def test_valid_income_transaction(self):
        """Test creating a valid income transaction"""
        transaction_data = {
            'account_id': 'acc_test123',
            'amount': 5000.00,
            'description': 'Monthly salary',
            'transaction_type': 'salary',
            'category': 'salary',
            'reference_number': 'SAL-2024-01',
            'is_recurring': True,
            'recurring_frequency': 'monthly'
        }
        
        transaction = TransactionCreate(**transaction_data)
        assert transaction.amount == 5000.00
        assert transaction.transaction_type == 'salary'
        assert transaction.is_recurring is True
        assert transaction.recurring_frequency == 'monthly'
        assert transaction.reference_number == 'SAL-2024-01'
    
    def test_valid_transfer_transaction(self):
        """Test creating a valid transfer transaction"""
        transaction_data = {
            'account_id': 'acc_source123',
            'destination_account_id': 'acc_dest456',
            'amount': 1000.00,
            'description': 'Transfer to savings',
            'transaction_type': 'transfer',
            'category': 'account_transfer'
        }
        
        transaction = TransactionCreate(**transaction_data)
        assert transaction.destination_account_id == 'acc_dest456'
        assert transaction.transaction_type == 'transfer'
        assert transaction.category == 'account_transfer'
    
    def test_zero_amount(self):
        """Test validation with zero amount (should fail)"""
        transaction_data = {
            'account_id': 'acc_test123',
            'amount': 0.0,
            'description': 'Invalid transaction',
            'transaction_type': 'expense',
            'category': 'other_expenses'
        }
        
        with pytest.raises(ValidationError) as exc_info:
            TransactionCreate(**transaction_data)
        
        error = exc_info.value.errors()[0]
        assert 'amount' in str(error)
        assert 'cannot be zero' in str(error)
    
    def test_empty_description(self):
        """Test validation with empty description"""
        transaction_data = {
            'account_id': 'acc_test123',
            'amount': 100.0,
            'description': '',
            'transaction_type': 'expense',
            'category': 'other_expenses'
        }
        
        with pytest.raises(ValidationError) as exc_info:
            TransactionCreate(**transaction_data)
        
        errors = exc_info.value.errors()
        assert any('description' in str(error) for error in errors)
    
    def test_whitespace_description_normalization(self):
        """Test that whitespace in description is normalized"""
        transaction_data = {
            'account_id': 'acc_test123',
            'amount': 100.0,
            'description': '  Multiple   spaces   here  ',
            'transaction_type': 'expense',
            'category': 'other_expenses'
        }
        
        transaction = TransactionCreate(**transaction_data)
        assert transaction.description == 'Multiple spaces here'
    
    def test_invalid_transaction_date(self):
        """Test validation with invalid date format"""
        transaction_data = {
            'account_id': 'acc_test123',
            'amount': 100.0,
            'description': 'Test transaction',
            'transaction_type': 'expense',
            'category': 'other_expenses',
            'transaction_date': 'invalid-date'
        }
        
        with pytest.raises(ValidationError) as exc_info:
            TransactionCreate(**transaction_data)
        
        error = exc_info.value.errors()[0]
        assert 'transaction_date' in str(error)
        assert 'ISO format' in str(error)
    
    def test_valid_iso_date(self):
        """Test validation with valid ISO date"""
        transaction_data = {
            'account_id': 'acc_test123',
            'amount': 100.0,
            'description': 'Test transaction',
            'transaction_type': 'expense',
            'category': 'other_expenses',
            'transaction_date': '2024-01-15T10:30:00'
        }
        
        transaction = TransactionCreate(**transaction_data)
        assert transaction.transaction_date == '2024-01-15T10:30:00'
    
    def test_too_many_tags(self):
        """Test validation with too many tags"""
        transaction_data = {
            'account_id': 'acc_test123',
            'amount': 100.0,
            'description': 'Test transaction',
            'transaction_type': 'expense',
            'category': 'other_expenses',
            'tags': [f'tag{i}' for i in range(15)]  # More than 10 tags
        }
        
        with pytest.raises(ValidationError) as exc_info:
            TransactionCreate(**transaction_data)
        
        error = exc_info.value.errors()[0]
        assert 'tags' in str(error)
        assert 'Maximum 10 tags' in str(error)
    
    def test_tag_too_long(self):
        """Test validation with tag too long"""
        transaction_data = {
            'account_id': 'acc_test123',
            'amount': 100.0,
            'description': 'Test transaction',
            'transaction_type': 'expense',
            'category': 'other_expenses',
            'tags': ['a' * 35]  # More than 30 characters
        }
        
        with pytest.raises(ValidationError) as exc_info:
            TransactionCreate(**transaction_data)
        
        error = exc_info.value.errors()[0]
        assert 'tags' in str(error)
        assert '30 characters' in str(error)
    
    def test_tags_cleanup(self):
        """Test that empty tags are cleaned up"""
        transaction_data = {
            'account_id': 'acc_test123',
            'amount': 100.0,
            'description': 'Test transaction',
            'transaction_type': 'expense',
            'category': 'other_expenses',
            'tags': ['valid', '', '  ', 'another_valid', '   spaced   ']
        }
        
        transaction = TransactionCreate(**transaction_data)
        assert transaction.tags == ['valid', 'another_valid', 'spaced']
    
    def test_amount_precision(self):
        """Test amount is rounded to 2 decimal places"""
        transaction_data = {
            'account_id': 'acc_test123',
            'amount': 123.456789,
            'description': 'Test transaction',
            'transaction_type': 'expense',
            'category': 'other_expenses'
        }
        
        transaction = TransactionCreate(**transaction_data)
        assert transaction.amount == Decimal('123.46')
    
    def test_negative_amount_valid(self):
        """Test that negative amounts are valid (for refunds, etc.)"""
        transaction_data = {
            'account_id': 'acc_test123',
            'amount': -50.00,
            'description': 'Refund',
            'transaction_type': 'refund',
            'category': 'refunds'
        }
        
        transaction = TransactionCreate(**transaction_data)
        assert transaction.amount == -50.00
        assert transaction.transaction_type == 'refund'
    
    def test_amount_out_of_range(self):
        """Test validation with amount out of range"""
        transaction_data = {
            'account_id': 'acc_test123',
            'amount': 1000000000.00,  # Too large
            'description': 'Too big',
            'transaction_type': 'expense',
            'category': 'other_expenses'
        }
        
        with pytest.raises(ValidationError) as exc_info:
            TransactionCreate(**transaction_data)
        
        error = exc_info.value.errors()[0]
        assert 'amount' in str(error)
        assert '999,999,999.99' in str(error)


class TestTransactionUpdate:
    """Tests for TransactionUpdate model validation"""
    
    def test_valid_update(self):
        """Test valid transaction update"""
        update_data = {
            'description': 'Updated description',
            'category': 'groceries',
            'notes': 'Updated notes',
            'tags': ['updated', 'tags']
        }
        
        update = TransactionUpdate(**update_data)
        assert update.description == 'Updated description'
        assert update.category == 'groceries'
        assert update.notes == 'Updated notes'
        assert update.tags == ['updated', 'tags']
    
    def test_partial_update(self):
        """Test partial update with only some fields"""
        update_data = {
            'description': 'New description'
        }
        
        update = TransactionUpdate(**update_data)
        assert update.description == 'New description'
        assert update.category is None
        assert update.notes is None
        assert update.tags is None
    
    def test_empty_description_validation(self):
        """Test that empty description is rejected"""
        update_data = {
            'description': '   '
        }
        
        with pytest.raises(ValidationError) as exc_info:
            TransactionUpdate(**update_data)
        
        error = exc_info.value.errors()[0]
        assert 'description' in str(error)


class TestTransactionFilter:
    """Tests for TransactionFilter model validation"""
    
    def test_default_values(self):
        """Test filter with default values"""
        filter_data = {}
        
        filter_obj = TransactionFilter(**filter_data)
        assert filter_obj.page == 1
        assert filter_obj.per_page == 50
        assert filter_obj.sort_by == 'date'
        assert filter_obj.sort_order == 'desc'
        assert filter_obj.account_id is None
    
    def test_valid_filters(self):
        """Test valid filter combinations"""
        filter_data = {
            'account_id': 'acc_test123',
            'transaction_type': 'expense',
            'category': 'food_drinks',
            'date_from': '2024-01-01T00:00:00',
            'date_to': '2024-01-31T23:59:59',
            'amount_min': 10.00,
            'amount_max': 1000.00,
            'search_term': 'restaurant',
            'tags': ['food', 'dining'],
            'page': 2,
            'per_page': 25,
            'sort_by': 'amount',
            'sort_order': 'asc'
        }
        
        filter_obj = TransactionFilter(**filter_data)
        assert filter_obj.account_id == 'acc_test123'
        assert filter_obj.transaction_type == 'expense'
        assert filter_obj.category == 'food_drinks'
        assert filter_obj.page == 2
        assert filter_obj.per_page == 25
        assert filter_obj.sort_by == 'amount'
        assert filter_obj.sort_order == 'asc'
    
    def test_invalid_page(self):
        """Test validation with invalid page number"""
        filter_data = {
            'page': 0
        }
        
        with pytest.raises(ValidationError) as exc_info:
            TransactionFilter(**filter_data)
        
        error = exc_info.value.errors()[0]
        assert 'page' in str(error)
    
    def test_invalid_per_page(self):
        """Test validation with invalid per_page"""
        filter_data = {
            'per_page': 150  # More than 100
        }
        
        with pytest.raises(ValidationError) as exc_info:
            TransactionFilter(**filter_data)
        
        error = exc_info.value.errors()[0]
        assert 'per_page' in str(error)
    
    def test_invalid_date_format(self):
        """Test validation with invalid date format"""
        filter_data = {
            'date_from': 'invalid-date'
        }
        
        with pytest.raises(ValidationError) as exc_info:
            TransactionFilter(**filter_data)
        
        error = exc_info.value.errors()[0]
        assert 'date_from' in str(error)
        assert 'ISO format' in str(error)


class TestTransactionResponse:
    """Tests for TransactionResponse model"""
    
    def test_valid_response(self):
        """Test creating a valid transaction response"""
        response_data = {
            'transaction_id': 'txn_test123',
            'user_id': 'user_456',
            'account_id': 'acc_789',
            'amount': 123.45,
            'description': 'Test transaction',
            'transaction_type': 'expense',
            'category': 'food_drinks',
            'transaction_date': '2024-01-15T10:30:00',
            'created_at': '2024-01-15T10:30:00',
            'updated_at': '2024-01-15T10:30:00'
        }
        
        response = TransactionResponse(**response_data)
        assert response.transaction_id == 'txn_test123'
        assert response.amount == Decimal('123.45')
        assert response.tags is None  # Default value


class TestTransactionListResponse:
    """Tests for TransactionListResponse model"""
    
    def test_valid_list_response(self):
        """Test creating a valid transaction list response"""
        transaction_data = {
            'transaction_id': 'txn_test123',
            'user_id': 'user_456',
            'account_id': 'acc_789',
            'account_name': 'Test Account',
            'amount': 123.45,
            'description': 'Test transaction',
            'transaction_type': 'expense',
            'category': 'food_drinks',
            'status': 'completed',
            'transaction_date': '2024-01-15T10:30:00',
            'account_balance_after': 876.55,
            'created_at': '2024-01-15T10:30:00',
            'updated_at': '2024-01-15T10:30:00'
        }
        
        transaction = TransactionResponse(**transaction_data)
        
        list_data = {
            'transactions': [transaction],
            'total_count': 1,
            'total_pages': 1,
            'total_income': 0.0,
            'total_expenses': 123.45,
            'net_amount': -123.45
        }
        
        list_response = TransactionListResponse(**list_data)
        assert len(list_response.transactions) == 1
        assert list_response.total_count == 1
        assert list_response.page == 1  # Default value
        assert list_response.per_page == 50  # Default value


class TestTransactionSummary:
    """Tests for TransactionSummary model"""
    
    def test_valid_summary(self):
        """Test creating a valid transaction summary"""
        summary_data = {
            'period': '2024-01',
            'total_income': 5000.00,
            'total_expenses': 3000.00,
            'net_amount': 2000.00,
            'transaction_count': 25,
            'income_by_category': {
                'salary': 5000.00
            },
            'expenses_by_category': {
                'food_drinks': 1000.00,
                'transportation': 500.00,
                'shopping': 1500.00
            },
            'activity_by_account': {
                'acc_123': {
                    'account_name': 'Checking Account',
                    'total_income': 5000.00,
                    'total_expenses': 3000.00,
                    'net_amount': 2000.00,
                    'transaction_count': 25
                }
            },
            'top_expense_categories': [
                {'category': 'shopping', 'amount': 1500.00},
                {'category': 'food_drinks', 'amount': 1000.00}
            ],
            'top_income_categories': [
                {'category': 'salary', 'amount': 5000.00}
            ]
        }
        
        summary = TransactionSummary(**summary_data)
        assert summary.period == '2024-01'
        assert summary.total_income == 5000.00
        assert summary.net_amount == 2000.00
        assert len(summary.top_expense_categories) == 2
        assert summary.top_expense_categories[0]['category'] == 'shopping'
