// Copyright (c) Mito

import React from 'react';
import useLiveUpdatingParams from '../../../hooks/useLiveUpdatingParams';
import MitoAPI from '../../../jupyter/api';
import { AnalysisData, ColumnID, SheetData, StepType, UIState } from '../../../types';
import DropdownItem from '../../elements/DropdownItem';
import MultiToggleColumns from '../../elements/MultiToggleColumns';
import Select from '../../elements/Select';
import Col from '../../layout/Col';
import Row from '../../layout/Row';
import Spacer from '../../layout/Spacer';
import DefaultEmptyTaskpane from '../DefaultTaskpane/DefaultEmptyTaskpane';
import DefaultTaskpane from '../DefaultTaskpane/DefaultTaskpane';
import DefaultTaskpaneBody from '../DefaultTaskpane/DefaultTaskpaneBody';
import DefaultTaskpaneHeader from '../DefaultTaskpane/DefaultTaskpaneHeader';
import MergeKeysSelectionSection from './MergeKeysSelection';
import MergeSheetSection from './MergeSheetSelection';
import { getFirstSuggestedMergeKeys } from './mergeUtils';


// Enum to allow you to refer to the first or second sheet by name, for clarity
export enum MergeSheet {
    First = 0,
    Second = 1
}

/*
    Each entry of this enum is a merge type that the user can choose. 
    In all cases, except lookup, these values are passed directly to 
    the pandas merge function. 
*/
export enum MergeType {
    LOOKUP = 'lookup',
    LEFT = 'left',
    RIGHT = 'right',
    INNER = 'inner',
    OUTER = 'outer',
    UNIQUE_IN_LEFT = 'unique in left',
    UNIQUE_IN_RIGHT = 'unique in right'
}

export interface MergeParams {
    how: string,
    sheet_index_one: number,
    sheet_index_two: number,
    merge_key_column_ids: [ColumnID, ColumnID][],
    selected_column_ids_one: ColumnID[],
    selected_column_ids_two: ColumnID[],
    destination_sheet_index?: number
}


export type MergeTaskpaneProps = {
    selectedSheetIndex: number,
    sheetDataArray: SheetData[],
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    mitoAPI: MitoAPI,
    analysisData: AnalysisData;
    /* 
        These props are only defined if we are editing a merge
        that already exists, and these are what we then default it to
    */
    existingMergeParams?: MergeParams;
    destinationSheetIndex?: number;
};


export const getDefaultMergeParams = (
    sheetDataArray: SheetData[], 
    _sheetIndexOne: number, 
    _sheetIndexTwo?: number, 
    previousParams?: MergeParams, // When we change the merge params, we use the previous params to handle cases like switching input sheets
): MergeParams | undefined => {

    if (sheetDataArray.length < 2) {
        return undefined;
    }

    const sheetIndexOne = _sheetIndexOne;
    const sheetIndexTwo = _sheetIndexTwo !== undefined
        ? _sheetIndexTwo 
        : (sheetIndexOne + 1 <= sheetDataArray.length - 1
            ? sheetIndexOne + 1
            : (sheetIndexOne - 1 >= 0 ? sheetIndexOne - 1 : sheetIndexOne)
        )
    
    // If we didn't change the sheets, then the default params are just the params we had last
    if (previousParams && previousParams.sheet_index_one == sheetIndexOne && previousParams.sheet_index_two === sheetIndexTwo) {
        return previousParams;
    }

    const suggestedMergeKeys = getFirstSuggestedMergeKeys(sheetDataArray, sheetIndexOne, sheetIndexTwo);

    // We default to selecting _all_ columns, if we switched datasets. Otherwise, we keep the selected
    // params from the previous params
    let selectedColumnIDsOne: ColumnID[] = [];
    let selectedColumnIDsTwo: ColumnID[] = [];

    if (previousParams && previousParams.sheet_index_one == sheetIndexOne) {
        selectedColumnIDsOne = previousParams.selected_column_ids_one;
    } else {
        const mergeKeyColumnIDsOne = suggestedMergeKeys ? suggestedMergeKeys[0] : undefined
        selectedColumnIDsOne = [...Object.keys(sheetDataArray[sheetIndexOne]?.columnIDsMap || {}).filter(columnID => !mergeKeyColumnIDsOne?.includes(columnID))]
    }
    if (previousParams && previousParams.sheet_index_two == sheetIndexTwo) {
        selectedColumnIDsTwo = previousParams.selected_column_ids_two;
    } else {
        const mergeKeyColumnIDsTwo = suggestedMergeKeys ? suggestedMergeKeys[1] : undefined
        selectedColumnIDsTwo = [...Object.keys(sheetDataArray[sheetIndexTwo]?.columnIDsMap || {}).filter(columnID => !mergeKeyColumnIDsTwo?.includes(columnID))]
    }
    
    return {
        how: previousParams ? previousParams.how : 'lookup',
        sheet_index_one: sheetIndexOne,
        sheet_index_two: sheetIndexTwo,
        merge_key_column_ids: suggestedMergeKeys ? [suggestedMergeKeys] : [],
        selected_column_ids_one: selectedColumnIDsOne,
        selected_column_ids_two: selectedColumnIDsTwo,
        destination_sheet_index: undefined
    }
}


const MergeTaskpane = (props: MergeTaskpaneProps): JSX.Element => {

    const {params, setParams, error} = useLiveUpdatingParams<MergeParams, MergeParams>(
        () => props.existingMergeParams !== undefined ? props.existingMergeParams : getDefaultMergeParams(props.sheetDataArray, props.selectedSheetIndex, undefined, undefined),
        StepType.Merge,
        props.mitoAPI,
        props.analysisData,
        50, // 50 ms debounce delay,
        undefined,
        {
            doNotSendDefaultParams: props.destinationSheetIndex !== undefined,
        },
        props.sheetDataArray
    )

    /*
        If the merge params are undefined, then display this error message.
    */
    if (params === undefined || props.sheetDataArray.length < 2) {
        return <DefaultEmptyTaskpane setUIState={props.setUIState} message='You need two dataframes before you can merge them.'/>
    }

    const sheetDataOne: SheetData = props.sheetDataArray[params.sheet_index_one];
    const sheetDataTwo: SheetData = props.sheetDataArray[params.sheet_index_two];

    const mergeKeyColumnIDsOne = params.merge_key_column_ids.map(([one, ]) => {return one});
    const mergeKeyColumnIDsTwo = params.merge_key_column_ids.map(([, two]) => {return two});

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader
                header="Merge Dataframes"
                setUIState={props.setUIState}
            />
            <DefaultTaskpaneBody>
                <Row justify='space-between' align='center' suppressTopBottomMargin>
                    <Col offsetRight={1}>
                        <p className='text-header-3'>
                            Merge Type
                        </p>
                    </Col>
                    <Col offsetRight={2}>
                        <Select 
                            value={params.how}
                            onChange={(mergeType: string) => {
                                const newMergeTypeEnum = mergeType as MergeType
                                setParams(prevParams => {
                                    return {
                                        ...prevParams,
                                        how: newMergeTypeEnum
                                    }
                                })
                            }}
                            width='medium-large'
                        >
                            <DropdownItem
                                title={MergeType.LOOKUP}
                                subtext="Includes all rows from the first sheet and only matching rows from the second sheet. If there are mulitple matches in the second sheet, only takes the first."
                            />
                            <DropdownItem
                                title={MergeType.LEFT}
                                subtext="Includes all rows from the first sheet and only matching rows from the second sheet. Includes all matches."
                            />
                            <DropdownItem
                                title={MergeType.RIGHT}
                                subtext="Includes all rows from the second sheet and only matching rows from the  first sheet. Includes all matches."
                            />
                            <DropdownItem
                                title={MergeType.INNER}
                                subtext="Only includes rows that have matches in both sheets."
                            />
                            <DropdownItem
                                title={MergeType.OUTER}
                                subtext="Includes all rows from both sheets, regardless of whether there is a match in the other sheet."
                            />
                            <DropdownItem
                                title={MergeType.UNIQUE_IN_LEFT}
                                subtext="Includes each row from the first sheet that doesn't have a match in the second sheet."
                            />
                            <DropdownItem
                                title={MergeType.UNIQUE_IN_RIGHT}
                                subtext="Includes each row from second sheet that doesn't have a match in the first sheet."
                            />
                        </Select>
                    </Col>
                </Row>
                <Spacer px={20}/>
                <MergeSheetSection
                    params={params}
                    setParams={setParams}
                    sheetDataArray={props.sheetDataArray}
                />
                <Spacer px={20}/>
                <MergeKeysSelectionSection
                    params={params}
                    setParams={setParams}
                    sheetDataArray={props.sheetDataArray}
                    error={error}
                    mitoAPI={props.mitoAPI}
                />
                <Spacer px={20}/>
                <div>
                    <p className='text-header-3'>
                        Columns to Keep from First Dataframe
                    </p>
                    {params.how !== MergeType.UNIQUE_IN_RIGHT &&
                        <MultiToggleColumns
                            sheetData={sheetDataOne}
                            selectedColumnIDs={params.selected_column_ids_one.concat(mergeKeyColumnIDsOne)}
                            disabledColumnIDs={mergeKeyColumnIDsOne}
                            mitoAPI={props.mitoAPI}
                            onChange={(newSelectedColumnIDs: ColumnID[]) => {
                                const newSelectedColumnIDsFiltered = newSelectedColumnIDs.filter(columnID => !mergeKeyColumnIDsOne.includes(columnID))
                                setParams(oldDropDuplicateParams => {
                                    return {
                                        ...oldDropDuplicateParams,
                                        selected_column_ids_one: newSelectedColumnIDsFiltered
                                    }
                                })
                            }}
                        />
                    }
                    {params.how === MergeType.UNIQUE_IN_RIGHT &&
                        <p>
                            Finding the unique values in the second sheet doesn&apos;t keep any columns from the first sheet.
                        </p>
                    }
                </div>                
                <Spacer px={20}/>
                <div>
                    <p className='text-header-3'>
                        Columns to Keep from Second Dataframe
                    </p>
                    {params.how !== MergeType.UNIQUE_IN_LEFT && 
                        <MultiToggleColumns
                            sheetData={sheetDataTwo}
                            selectedColumnIDs={params.selected_column_ids_two.concat(mergeKeyColumnIDsTwo)}
                            disabledColumnIDs={mergeKeyColumnIDsTwo}
                            mitoAPI={props.mitoAPI}
                            onChange={(newSelectedColumnIDs: ColumnID[]) => {
                                const newSelectedColumnIDsFiltered = newSelectedColumnIDs.filter(columnID => !mergeKeyColumnIDsTwo.includes(columnID))
                                setParams(oldDropDuplicateParams => {
                                    return {
                                        ...oldDropDuplicateParams,
                                        selected_column_ids_two: newSelectedColumnIDsFiltered
                                    }
                                })
                            }}
                        />
                    }
                    {params.how === MergeType.UNIQUE_IN_LEFT &&
                        <p>
                            Finding the unique values in the first sheet doesn&apos;t keep any columns from the second sheet.
                        </p>
                    }
                </div>
            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    )
}


export default MergeTaskpane;