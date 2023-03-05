#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the SUM function.
"""

import pytest
import pandas as pd

from mitosheet.public.v3.sheet_functions.number_functions import SUM


SUM_NUMBER_TESTS = [
    # Just constant tests
    ([2, 3], 5),
    ([2.0, 3.0], 5.0),
    ([2.0, '$3.0'], 5.0),
    ([2.0, True], 3.0),

    # Constants and series
    ([2, pd.Series([1,2,3])], pd.Series([3,4,5])),
    ([2.0, pd.Series([1,2,3])], pd.Series([3.0,4.0,5.0])),
    ([2.0, pd.Series([1,2,None])], pd.Series([3.0,4.0,None])),
    ([2.0, pd.Series(['1', '2', '3'])], pd.Series([3.0, 4.0, 5.0])),
    ([2.0, pd.Series(['1.0', '2.0', '3.0'])], pd.Series([3.0, 4.0, 5.0])),
    ([2.0, pd.Series(['$1.00', '$2.00', '$3.00'])], pd.Series([3.0, 4.0, 5.0])),
    
    # Dataframes
    ([pd.DataFrame({'a': [1, 1, 1], 'b': [2, 2, 2]}), pd.Series([1,2,3])], pd.Series([10,11,12])),
    ([pd.DataFrame({'a': [1, 1, 1], 'b': [2, 2, 2]}), 2], 11),
    ([pd.DataFrame({'a': ['$1', '$1', '$1'], 'b': [2, None, 2]}), pd.Series([1,2,3])], pd.Series([8.0,9.0,10.0])),

    # Rolling windows
    ([pd.Series([1, 2, 3]).rolling(window=2), 1], pd.Series([4, 6, 4])), #A0 = B0:B1 + 1
    ([pd.DataFrame({'B': [1, 2, 3], 'C': [4, 5, 6]}).rolling(window=2), 1], pd.Series([13, 17, 10])), #A0 = B0:C1 + 1
    ([pd.DataFrame({'B': [1, 2, 3], 'C': [4, 5, 6]}).rolling(window=3), 1], pd.Series([22, 17, 10])), #A0 = B0:C2 + 1
    ([pd.DataFrame({'B': [1, 2, 3], 'C': [4, 5, 6]}).shift(1, fill_value=0).rolling(window=2), 1], pd.Series([6, 13, 17])), #A1 = B0:C1 + 1
    # TODO: we can't support this last one!
]

@pytest.mark.parametrize("_argv,expected", SUM_NUMBER_TESTS)
def test_sum_works_for_series_and_number(_argv, expected):
    result = SUM(*_argv)
    if isinstance(result, pd.Series):
        print(result)
        assert result.equals(expected)
    else: 
        assert result == expected

