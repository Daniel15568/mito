#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for set column formula edit events
"""
from mitosheet.step_performers.sort import SORT_DIRECTION_ASCENDING
import pandas as pd

from mitosheet.utils import get_new_id
from mitosheet.tests.test_utils import create_mito_wrapper_dfs, create_mito_wrapper
from mitosheet.column_headers import get_column_header_id


def test_edit_cell_formula_on_message_receive():
    mito = create_mito_wrapper([123])
    mito.add_column(0, 'B')
    mito.set_formula('=A', 0, 'B')

    assert 'B' in mito.dfs[0]
    assert mito.dfs[0]['B'].equals(mito.dfs[0]['A'])

def test_overwrite_on_double_set():
    mito = create_mito_wrapper([123])
    mito.add_column(0, 'B')
    mito.set_formula('=A', 0, 'B')
    mito.set_formula('=1', 0, 'B')

    assert 'B' in mito.dfs[0]
    assert mito.dfs[0]['B'].equals(pd.Series([1]))
    assert mito.curr_step_idx == 3

def test_double_set_does_not_error():
    mito = create_mito_wrapper([123])
    mito.add_column(0, 'B')
    mito.set_formula('=A', 0, 'B')

    mito.mito_backend.receive_message(mito, {
        'event': 'edit_event',
        'id': get_new_id(),
        'type': 'set_column_formula_edit',
        'step_id': get_new_id(),
        'params': {
            'sheet_index': 0,
            'column_header': 'B',
            'new_formula': '=A'
        }
    })

    assert 'B' in mito.dfs[0]
    assert mito.dfs[0]['B'].equals(mito.dfs[0]['A'])

def test_edit_cell_formula_mulitple_msg_receives():
    mito = create_mito_wrapper([123])
    mito.add_column(0, 'B')
    mito.set_formula('=A', 0, 'B')
    mito.set_formula('=1', 0, 'B')

    assert 'B' in mito.dfs[0]
    assert mito.curr_step.column_spreadsheet_code[0]['B'] == '=1'


def test_edit_to_same_formula_no_error():
    mito = create_mito_wrapper([123])
    mito.add_column(0, 'B')
    mito.set_formula('=A', 0, 'B')

    # should not throw error
    mito.mito_backend.steps_manager.handle_edit_event({
        'event': 'edit_event',
        'type': 'set_column_formula_edit',
        'step_id': get_new_id(),
        'params': {
            'sheet_index': 0,
            'column_id': get_column_header_id('B'),
            'new_formula': '=A'
        }
    })

    assert 'B' in mito.dfs[0]
    assert mito.curr_step.column_spreadsheet_code[0]['B'] == '=A'


def test_formulas_fill_missing_parens():
    mito = create_mito_wrapper([123])
    mito.add_column(0, 'B')
    mito.set_formula('=SUM(A', 0, 'B')

    assert mito.dfs[0].equals(
        pd.DataFrame({
            'A': [123],
            'B': [123]
        })
    )

def test_formulas_fill_missing_two_parens():
    mito = create_mito_wrapper([123])
    mito.add_column(0, 'B')
    mito.set_formula('=SUM(SUM(A', 0, 'B')

    assert mito.dfs[0].equals(
        pd.DataFrame({
            'A': [123],
            'B': [123]
        })
    )


def test_multi_sheet_edits_edit_correct_dfs():
    df1 = pd.DataFrame(data={'A': [1]})
    df2 = pd.DataFrame(data={'A': [2]})
    mito = create_mito_wrapper_dfs(df1, df2)

    mito.add_column(0, 'B')
    mito.add_column(1, 'B')
    mito.set_formula('=A + 1', 0, 'B')
    mito.set_formula('=A + 100', 1, 'B')

    assert 'B' in mito.dfs[0]
    assert 'B' in mito.dfs[1]
    assert mito.curr_step.column_spreadsheet_code[0]['B'] == '=A + 1'
    assert mito.curr_step.column_spreadsheet_code[1]['B'] == '=A + 100'


def test_only_writes_single_code():
    df = pd.DataFrame(data={'A': [1]})
    mito = create_mito_wrapper_dfs(df)
    mito.set_formula('=A', 0, 'B', add_column=True)
    mito.set_formula('=B', 0, 'C', add_column=True)
    mito.set_formula('=A', 0, 'D', add_column=True)
    mito.set_formula('=100', 0, 'B', add_column=True)

    assert mito.transpiled_code == [
        "df1.insert(1, 'B', df1['A'])", 
        "df1.insert(2, 'C', df1['B'])", 
        "df1.insert(3, 'D', df1['A'])", 
        "df1['B'] = 100", 
    ]

def test_can_set_formula_referencing_datetime():
    df = pd.DataFrame(data={pd.to_datetime('12-22-1997'): [1]})
    mito = create_mito_wrapper_dfs(df)
    mito.set_formula('=1997-12-22 00:00:00', 0, 'B', add_column=True)

    assert mito.dfs[0].equals(
        pd.DataFrame(data={pd.to_datetime('12-22-1997'): [1], 'B': [1]})
    )

def test_can_set_formula_referencing_timedelta():
    df = pd.DataFrame(data={pd.to_timedelta('2 days 00:00:00'): [1]})
    mito = create_mito_wrapper_dfs(df)
    mito.set_formula('=2 days 00:00:00', 0, 'B', add_column=True)

    assert mito.dfs[0].equals(
        pd.DataFrame(data={pd.to_timedelta('2 days 00:00:00'): [1], 'B': [1]})
    )


def test_inplace_edit_overwrites_properly():
    df = pd.DataFrame(data={'A': [1]})
    mito = create_mito_wrapper_dfs(df)
    mito.set_formula('=A + 1', 0, 'A')
    mito.set_formula('=A + 2', 0, 'A')
    mito.set_formula('=A + 3', 0, 'A')
    mito.undo()

    assert mito.transpiled_code == [
        "df1['A'] = df1['A'] + 2", 
    ]

def test_formula_with_letters_df_in_column_header_works():
    df = pd.DataFrame(data={'df': [1]})
    mito = create_mito_wrapper_dfs(df)
    mito.set_formula('=df', 0, 'A', add_column=True)

    assert mito.dfs[0].equals(
        pd.DataFrame({
            'df': [1],
            'A': [1]
        })
    )

def test_set_formula_then_rename_no_optimize_yet():
    mito = create_mito_wrapper_dfs(pd.DataFrame(data={'A': [1]}))
    mito.add_column(0, 'B')
    mito.sort(0, 'B', SORT_DIRECTION_ASCENDING) # Sort to break up the optimization
    mito.set_formula('=10', 0, 'B', add_column=False)
    mito.rename_column(0, 'B', 'C')

    assert mito.dfs[0].equals(pd.DataFrame({'A': [1], 'C': [10]}))
    assert mito.transpiled_code == [
        "df1.insert(1, 'B', 0)", 
        "df1 = df1.sort_values(by='B', ascending=True, na_position='first')", 
        "df1['B'] = 10", 
        "df1.rename(columns={'B': 'C'}, inplace=True)"
    ]

def test_set_formula_then_delete_optimize():
    mito = create_mito_wrapper_dfs(pd.DataFrame(data={'A': [1]}))
    mito.add_column(0, 'B')
    mito.sort(0, 'B', SORT_DIRECTION_ASCENDING) # Sort to break up the optimization
    mito.set_formula('=10', 0, 'B', add_column=False)
    mito.delete_columns(0, ['B'])

    assert mito.dfs[0].equals(pd.DataFrame({'A': [1]}))
    assert mito.transpiled_code == [
        "df1.insert(1, 'B', 0)", 
        "df1 = df1.sort_values(by='B', ascending=True, na_position='first')",
        "df1.drop(['B'], axis=1, inplace=True)"
    ]

def test_set_formula_then_delete_optimizes_multiple():
    mito = create_mito_wrapper_dfs(pd.DataFrame(data={'A': [1]}))
    mito.add_column(0, 'B')
    mito.sort(0, 'B', SORT_DIRECTION_ASCENDING) # Sort to break up the optimization
    mito.set_formula('=10', 0, 'B', add_column=False)
    mito.set_formula('=11', 0, 'B', add_column=False)
    mito.set_formula('=12', 0, 'B', add_column=False)
    mito.set_formula('=13', 0, 'B', add_column=False)
    mito.delete_columns(0, ['B'])

    assert mito.dfs[0].equals(pd.DataFrame({'A': [1]}))
    assert mito.transpiled_code == [
        "df1.insert(1, 'B', 0)", 
        "df1 = df1.sort_values(by='B', ascending=True, na_position='first')",
        "df1.drop(['B'], axis=1, inplace=True)"
    ]

def test_set_multiple_formula_then_delete_optimizes_multiple():
    mito = create_mito_wrapper_dfs(pd.DataFrame(data={'A': [1]}))
    mito.add_column(0, 'B')
    mito.add_column(0, 'C')
    mito.sort(0, 'B', SORT_DIRECTION_ASCENDING) # Sort to break up the optimization
    mito.set_formula('=10', 0, 'B', add_column=False)
    mito.set_formula('=11', 0, 'B', add_column=False)
    mito.set_formula('=12', 0, 'C', add_column=False)
    mito.set_formula('=13', 0, 'C', add_column=False)
    mito.delete_columns(0, ['B', 'C'])

    assert mito.dfs[0].equals(pd.DataFrame({'A': [1]}))
    assert mito.transpiled_code == [
        "df1.insert(1, 'B', 0)", 
        "df1.insert(2, 'C', 0)", 
        "df1 = df1.sort_values(by='B', ascending=True, na_position='first')",
        "df1.drop(['B', 'C'], axis=1, inplace=True)"
    ]


def test_set_column_formula_in_duplicate_does_not_overoptmize():
    mito = create_mito_wrapper_dfs(pd.DataFrame(data={'A': [1]}))
    mito.add_column(0, 'B')
    mito.duplicate_dataframe(0) # Duplicate to break up the optimization
    mito.rename_column(1, 'B', 'aaron')

    assert mito.dfs[0].equals(pd.DataFrame({'A': [1], 'B': [0]}))
    assert mito.transpiled_code == [
        "df1.insert(1, 'B', 0)", 
        "df1_copy = df1.copy(deep=True)",
        "df1_copy.rename(columns={'B': 'aaron'}, inplace=True)"
    ]

def test_set_column_formula_then_delete_dataframe_optimizes():
    mito = create_mito_wrapper_dfs(pd.DataFrame(data={'A': [1]}))
    mito.add_column(0, 'B')
    mito.add_column(0, 'C')
    mito.sort(0, 'B', SORT_DIRECTION_ASCENDING) # Sort to break up the optimization
    mito.set_formula('=10', 0, 'B', add_column=False)
    mito.set_formula('=11', 0, 'B', add_column=False)
    mito.set_formula('=12', 0, 'C', add_column=False)
    mito.set_formula('=13', 0, 'C', add_column=False)
    mito.delete_columns(0, ['B', 'C'])
    mito.delete_dataframe(0)

    assert mito.transpiled_code == []

def test_set_column_formula_then_delete_diff_dataframe_not_optimizes():
    mito = create_mito_wrapper_dfs(pd.DataFrame(data={'A': [1]}))

    mito.duplicate_dataframe(0)
    mito.add_column(0, 'B')
    mito.add_column(0, 'C')
    mito.sort(0, 'B', SORT_DIRECTION_ASCENDING) # Sort to break up the optimization
    mito.set_formula('=10', 0, 'B', add_column=False)
    mito.set_formula('=11', 0, 'B', add_column=False)
    mito.set_formula('=12', 0, 'C', add_column=False)
    mito.set_formula('=13', 0, 'C', add_column=False)
    mito.delete_columns(0, ['B', 'C'])
    mito.delete_dataframe(1)

    assert len(mito.optimized_code_chunks) >= 3