// Copyright (c) Saga Inc.

import React, { useEffect } from 'react';
import { MitoAPI } from '../../api/api';
import { MitoSelection, SheetData } from '../../types';
import Dropdown from '../elements/Dropdown';
import DropdownItem from '../elements/DropdownItem';
import DropdownSectionSeperator from '../elements/DropdownSectionSeperator';
import { TaskpaneType } from '../taskpanes/taskpanes';
import { getSelectedRowLabelsWithEntireSelectedRow } from './selectionUtils';

/*
    Displays a set of actions one can perform on a row
*/
export default function IndexHeaderDropdown(props: {
    mitoAPI: MitoAPI;
    sheetData: SheetData;
    sheetIndex: number;
    selections: MitoSelection[];
    display: boolean;
    index: string | number,
    setOpenIndexHeaderDropdown: React.Dispatch<React.SetStateAction<number | undefined>>,
    closeOpenEditingPopups: (taskpanesToKeepIfOpen?: TaskpaneType[]) => void;
}): JSX.Element {

    // Log opening this dropdown
    useEffect(() => {
        if (props.display) {
            void props.mitoAPI.log('opened_index_header_dropdown')
        }
    }, [props.display])

    return (
        <Dropdown
            display={props.display}
            closeDropdown={() => props.setOpenIndexHeaderDropdown(undefined)}
            width='medium'
        >
            <DropdownItem 
                title='Delete Rows'
                onClick={() => {
                    void props.mitoAPI.editDeleteRow(props.sheetIndex, getSelectedRowLabelsWithEntireSelectedRow(props.selections, props.sheetData));
                }}
            />
            <DropdownItem 
                title='Promote Row to Header'
                onClick={() => {
                    void props.mitoAPI.editPromoteRowToHeader(props.sheetIndex, props.index);
                }}
            />
            <DropdownSectionSeperator isDropdownSectionSeperator/>
            <DropdownItem 
                title='Reset and Drop Index'
                onClick={() => {
                    void props.mitoAPI.editResetIndex(props.sheetIndex, true);
                }}
            />
            <DropdownItem 
                title='Reset Index'
                onClick={() => {
                    void props.mitoAPI.editResetIndex(props.sheetIndex, false);
                }}
            />
        </Dropdown>
    )
}