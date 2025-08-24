"""
Tests for account models
"""

import pytest
from pydantic import ValidationError

from src.models.account import (
    AccountCreate,
    AccountUpdate,
    AccountResponse,
    AccountBalance,
    AccountListResponse
)


class TestAccountCreate:
    
    def test_valid_account_create(self):
        """Test valid account creation data"""
        data = {
            'name': 'Test Account',
            'account_type': 'savings',
            'bank_name': 'BBVA México',
            'bank_code': 'bbva',
            'currency': 'MXN',
            'initial_balance': 1000.0,
            'is_active': True,
            'description': 'Test savings account',
            'color': '#FF0000'
        }
        
        account = AccountCreate(**data)
        assert account.name == 'Test Account'
        assert account.account_type == 'savings'
        assert account.bank_name == 'BBVA México'
        assert account.bank_code == 'bbva'
        assert account.currency == 'MXN'
        assert account.initial_balance == 1000.0
        assert account.is_active is True
        assert account.description == 'Test savings account'
        assert account.color == '#FF0000'
    
    def test_account_create_minimal_data(self):
        """Test account creation with minimal required data"""
        data = {
            'name': 'Simple Account',
            'account_type': 'checking',
            'bank_name': 'Test Bank'
        }
        
        account = AccountCreate(**data)
        assert account.name == 'Simple Account'
        assert account.account_type == 'checking'
        assert account.bank_name == 'Test Bank'
        assert account.currency == 'MXN'  # Default value
        assert account.initial_balance == 0.0  # Default value
        assert account.is_active is True  # Default value
        assert account.bank_code is None
        assert account.description is None
        assert account.color is None
    
    def test_account_create_invalid_name_empty(self):
        """Test account creation with empty name"""
        data = {
            'name': '',
            'account_type': 'savings',
            'bank_name': 'Test Bank'
        }
        
        with pytest.raises(ValidationError) as exc_info:
            AccountCreate(**data)
        
        # Pydantic will catch the empty string with min_length=1 before our custom validator
        error_message = str(exc_info.value)
        assert 'String should have at least 1 character' in error_message
    
    def test_account_create_invalid_name_spaces_only(self):
        """Test account creation with name containing only spaces"""
        data = {
            'name': '   ',
            'account_type': 'savings',
            'bank_name': 'Test Bank'
        }
        
        with pytest.raises(ValidationError) as exc_info:
            AccountCreate(**data)
        
        assert 'Account name cannot be empty' in str(exc_info.value)
    
    def test_account_create_name_cleanup(self):
        """Test account name cleanup (remove extra spaces)"""
        data = {
            'name': '  Test   Account  Name  ',
            'account_type': 'savings',
            'bank_name': 'Test Bank'
        }
        
        account = AccountCreate(**data)
        assert account.name == 'Test Account Name'
    
    def test_account_create_invalid_currency(self):
        """Test account creation with invalid currency"""
        data = {
            'name': 'Test Account',
            'account_type': 'savings',
            'bank_name': 'Test Bank',
            'currency': 'INVALID'
        }
        
        with pytest.raises(ValidationError) as exc_info:
            AccountCreate(**data)
        
        assert 'Currency must be one of' in str(exc_info.value)
    
    def test_account_create_currency_normalization(self):
        """Test currency normalization to uppercase"""
        data = {
            'name': 'Test Account',
            'account_type': 'savings',
            'bank_name': 'Test Bank',
            'currency': 'usd'
        }
        
        account = AccountCreate(**data)
        assert account.currency == 'USD'
    
    def test_account_create_invalid_color(self):
        """Test account creation with invalid color format"""
        data = {
            'name': 'Test Account',
            'account_type': 'savings',
            'bank_name': 'Test Bank',
            'color': 'red'  # Not hex format
        }
        
        with pytest.raises(ValidationError) as exc_info:
            AccountCreate(**data)
        
        assert 'Color must be a valid hex color' in str(exc_info.value)
    
    def test_account_create_valid_color_formats(self):
        """Test account creation with valid color formats"""
        # Test 6-digit hex
        data1 = {
            'name': 'Test Account',
            'account_type': 'savings',
            'bank_name': 'Test Bank',
            'color': '#FF0000'
        }
        account1 = AccountCreate(**data1)
        assert account1.color == '#FF0000'
        
        # Test 3-digit hex
        data2 = {
            'name': 'Test Account',
            'account_type': 'savings',
            'bank_name': 'Test Bank',
            'color': '#F00'
        }
        account2 = AccountCreate(**data2)
        assert account2.color == '#F00'
        
        # Test lowercase conversion to uppercase
        data3 = {
            'name': 'Test Account',
            'account_type': 'savings',
            'bank_name': 'Test Bank',
            'color': '#ff0000'
        }
        account3 = AccountCreate(**data3)
        assert account3.color == '#FF0000'
    
    def test_account_create_initial_balance_limits(self):
        """Test initial balance validation limits"""
        # Test maximum positive balance
        data = {
            'name': 'Test Account',
            'account_type': 'savings',
            'bank_name': 'Test Bank',
            'initial_balance': 999999999.99
        }
        account = AccountCreate(**data)
        assert account.initial_balance == 999999999.99
        
        # Test maximum negative balance
        data['initial_balance'] = -999999999.99
        account = AccountCreate(**data)
        assert account.initial_balance == -999999999.99
        
        # Test balance over limit
        data['initial_balance'] = 1000000000.00
        with pytest.raises(ValidationError) as exc_info:
            AccountCreate(**data)
        assert 'Initial balance must be between' in str(exc_info.value)
    
    def test_account_create_balance_rounding(self):
        """Test balance rounding to 2 decimal places"""
        data = {
            'name': 'Test Account',
            'account_type': 'savings',
            'bank_name': 'Test Bank',
            'initial_balance': 123.456789
        }
        
        account = AccountCreate(**data)
        assert account.initial_balance == 123.46


class TestAccountUpdate:
    
    def test_account_update_partial(self):
        """Test partial account update"""
        data = {
            'name': 'Updated Name',
            'description': 'Updated description'
        }
        
        update = AccountUpdate(**data)
        assert update.name == 'Updated Name'
        assert update.description == 'Updated description'
        assert update.account_type is None  # Not provided
        assert update.bank_name is None     # Not provided
    
    def test_account_update_empty(self):
        """Test account update with no data"""
        update = AccountUpdate()
        assert update.name is None
        assert update.account_type is None
        assert update.bank_name is None
    
    def test_account_update_name_validation(self):
        """Test name validation in updates"""
        # Valid name
        update = AccountUpdate(name='Valid Name')
        assert update.name == 'Valid Name'
        
        # Empty name should fail
        with pytest.raises(ValidationError):
            AccountUpdate(name='')
        
        # Spaces-only name should fail
        with pytest.raises(ValidationError):
            AccountUpdate(name='   ')
    
    def test_account_update_color_empty_string(self):
        """Test color update with empty string"""
        update = AccountUpdate(color='')
        assert update.color == ''


class TestAccountBalance:
    
    def test_account_balance_positive(self):
        """Test positive balance change"""
        balance = AccountBalance(amount=500.0, description='Deposit')
        assert balance.amount == 500.0
        assert balance.description == 'Deposit'
    
    def test_account_balance_negative(self):
        """Test negative balance change"""
        balance = AccountBalance(amount=-100.0)
        assert balance.amount == -100.0
        assert balance.description is None
    
    def test_account_balance_zero_amount(self):
        """Test zero amount validation"""
        with pytest.raises(ValidationError) as exc_info:
            AccountBalance(amount=0.0)
        
        assert 'Amount cannot be zero' in str(exc_info.value)
    
    def test_account_balance_amount_limits(self):
        """Test amount validation limits"""
        # Test within limits
        balance = AccountBalance(amount=999999999.99)
        assert balance.amount == 999999999.99
        
        balance = AccountBalance(amount=-999999999.99)
        assert balance.amount == -999999999.99
        
        # Test over limits
        with pytest.raises(ValidationError) as exc_info:
            AccountBalance(amount=1000000000.00)
        assert 'Amount must be between' in str(exc_info.value)
    
    def test_account_balance_rounding(self):
        """Test amount rounding"""
        balance = AccountBalance(amount=123.456789)
        assert balance.amount == 123.46


class TestAccountResponse:
    
    def test_account_response_complete(self):
        """Test complete account response"""
        data = {
            'account_id': 'acc_123',
            'user_id': 'user_123',
            'name': 'Test Account',
            'account_type': 'savings',
            'bank_name': 'Test Bank',
            'bank_code': 'bbva',
            'currency': 'MXN',
            'current_balance': 1500.0,
            'is_active': True,
            'description': 'Test account',
            'color': '#FF0000',
            'created_at': '2024-01-01T00:00:00',
            'updated_at': '2024-01-01T00:00:00'
        }
        
        response = AccountResponse(**data)
        assert response.account_id == 'acc_123'
        assert response.user_id == 'user_123'
        assert response.name == 'Test Account'
        assert response.account_type == 'savings'
        assert response.bank_name == 'Test Bank'
        assert response.bank_code == 'bbva'
        assert response.currency == 'MXN'
        assert response.current_balance == 1500.0
        assert response.is_active is True
        assert response.description == 'Test account'
        assert response.color == '#FF0000'
        assert response.created_at == '2024-01-01T00:00:00'
        assert response.updated_at == '2024-01-01T00:00:00'


class TestAccountListResponse:
    
    def test_account_list_response(self):
        """Test account list response"""
        account_data = {
            'account_id': 'acc_123',
            'user_id': 'user_123',
            'name': 'Test Account',
            'account_type': 'savings',
            'bank_name': 'Test Bank',
            'currency': 'MXN',
            'current_balance': 1500.0,
            'is_active': True,
            'created_at': '2024-01-01T00:00:00',
            'updated_at': '2024-01-01T00:00:00'
        }
        
        account = AccountResponse(**account_data)
        
        list_data = {
            'accounts': [account],
            'total_count': 1,
            'active_count': 1,
            'total_balance_by_currency': {'MXN': 1500.0}
        }
        
        response = AccountListResponse(**list_data)
        assert len(response.accounts) == 1
        assert response.total_count == 1
        assert response.active_count == 1
        assert response.total_balance_by_currency['MXN'] == 1500.0
    
    def test_account_list_response_empty(self):
        """Test empty account list response"""
        list_data = {
            'accounts': [],
            'total_count': 0,
            'active_count': 0,
            'total_balance_by_currency': {}
        }
        
        response = AccountListResponse(**list_data)
        assert len(response.accounts) == 0
        assert response.total_count == 0
        assert response.active_count == 0
        assert len(response.total_balance_by_currency) == 0


class TestAccountTypes:
    
    def test_valid_account_types(self):
        """Test all valid account types"""
        valid_types = [
            'checking', 'savings', 'credit_card', 'investment', 
            'cash', 'loan', 'other'
        ]
        
        for account_type in valid_types:
            data = {
                'name': 'Test Account',
                'account_type': account_type,
                'bank_name': 'Test Bank'
            }
            
            account = AccountCreate(**data)
            assert account.account_type == account_type
    
    def test_invalid_account_type(self):
        """Test invalid account type"""
        data = {
            'name': 'Test Account',
            'account_type': 'invalid_type',
            'bank_name': 'Test Bank'
        }
        
        with pytest.raises(ValidationError):
            AccountCreate(**data)


class TestBankCodes:
    
    def test_valid_bank_codes(self):
        """Test all valid bank codes"""
        valid_codes = [
            'bbva', 'banamex', 'santander', 'banorte', 'hsbc', 
            'scotiabank', 'inbursa', 'azteca', 'bajio', 'mifel',
            'actinver', 'invex', 'multiva', 've_por_mas',
            'bank_of_america', 'chase', 'wells_fargo', 'citi', 'other'
        ]
        
        for bank_code in valid_codes:
            data = {
                'name': 'Test Account',
                'account_type': 'savings',
                'bank_name': 'Test Bank',
                'bank_code': bank_code
            }
            
            account = AccountCreate(**data)
            assert account.bank_code == bank_code
    
    def test_invalid_bank_code(self):
        """Test invalid bank code"""
        data = {
            'name': 'Test Account',
            'account_type': 'savings',
            'bank_name': 'Test Bank',
            'bank_code': 'invalid_bank'
        }
        
        with pytest.raises(ValidationError):
            AccountCreate(**data)


class TestCurrencyValidation:
    
    def test_valid_currencies(self):
        """Test all valid currencies"""
        valid_currencies = ['MXN', 'USD', 'EUR', 'CAD', 'GBP', 'JPY']
        
        for currency in valid_currencies:
            data = {
                'name': 'Test Account',
                'account_type': 'savings',
                'bank_name': 'Test Bank',
                'currency': currency
            }
            
            account = AccountCreate(**data)
            assert account.currency == currency
    
    def test_currency_case_insensitive(self):
        """Test currency case insensitivity"""
        currencies = ['mxn', 'usd', 'eur', 'cad', 'gbp', 'jpy']
        
        for currency in currencies:
            data = {
                'name': 'Test Account',
                'account_type': 'savings',
                'bank_name': 'Test Bank',
                'currency': currency
            }
            
            account = AccountCreate(**data)
            assert account.currency == currency.upper()
    
    def test_invalid_currency(self):
        """Test invalid currency"""
        data = {
            'name': 'Test Account',
            'account_type': 'savings',
            'bank_name': 'Test Bank',
            'currency': 'INVALID'
        }
        
        with pytest.raises(ValidationError) as exc_info:
            AccountCreate(**data)
        
        assert 'Currency must be one of' in str(exc_info.value)
