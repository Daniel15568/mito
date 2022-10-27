// Copyright (c) Mito

import React from 'react';
import { useStateFromAPIAsync } from '../../hooks/useStateFromAPIAsync';

// Import 
import MitoAPI from '../../jupyter/api';
import { AnalysisData, UIState } from '../../types';
import DropdownItem from '../elements/DropdownItem';
import Input from '../elements/Input';
import Select from '../elements/Select';
import TextButton from '../elements/TextButton';
import Toggle from '../elements/Toggle';
import Tooltip from '../elements/Tooltip';
import Col from '../layout/Col';
import Row from '../layout/Row';
import Spacer from '../layout/Spacer';
import DefaultTaskpane from '../taskpanes/DefaultTaskpane/DefaultTaskpane';
import DefaultTaskpaneBody from '../taskpanes/DefaultTaskpane/DefaultTaskpaneBody';
import DefaultTaskpaneFooter from '../taskpanes/DefaultTaskpane/DefaultTaskpaneFooter';
import DefaultTaskpaneHeader from '../taskpanes/DefaultTaskpane/DefaultTaskpaneHeader';

const ENCODINGS = [
    "utf_8",
    "ascii",
    "latin_1",
    "big5",
    "big5hkscs",
    "cp037",
    "cp273",
    "cp424",
    "cp437",
    "cp500",
    "cp720",
    "cp737",
    "cp775",
    "cp850",
    "cp852",
    "cp855",
    "cp856",
    "cp857",
    "cp858",
    "cp860",
    "cp861",
    "cp862",
    "cp863",
    "cp864",
    "cp865",
    "cp866",
    "cp869",
    "cp874",
    "cp875",
    "cp932",
    "cp949",
    "cp950",
    "cp1006",
    "cp1026",
    "cp1125",
    "cp1140",
    "cp1250",
    "cp1251",
    "cp1252",
    "cp1253",
    "cp1254",
    "cp1255",
    "cp1256",
    "cp1257",
    "cp1258",
    "euc_jp",
    "euc_jis_2004",
    "euc_jisx0213",
    "euc_kr",
    "gb2312",
    "gbk",
    "gb18030",
    "hz",
    "iso2022_jp",
    "iso2022_jp_1",
    "iso2022_jp_2",
    "iso2022_jp_2004",
    "iso2022_jp_3",
    "iso2022_jp_ext",
    "iso2022_kr",
    "iso8859_2",
    "iso8859_3",
    "iso8859_4",
    "iso8859_5",
    "iso8859_6",
    "iso8859_7",
    "iso8859_8",
    "iso8859_9",
    "iso8859_10",
    "iso8859_11",
    "iso8859_13",
    "iso8859_14",
    "iso8859_15",
    "iso8859_16",
    "johab",
    "koi8_r",
    "koi8_t",
    "koi8_u",
    "kz1048",
    "mac_cyrillic",
    "mac_greek",
    "mac_iceland",
    "mac_latin2",
    "mac_roman",
    "mac_turkish",
    "ptcp154",
    "shift_jis",
    "shift_jis_2004",
    "shift_jisx0213",
    "utf_32",
    "utf_32_be",
    "utf_32_le",
    "utf_16",
    "utf_16_be",
    "utf_16_le",
    "utf_7",
    "utf_8_sig"
] 

export const DECIMALS = ['.', ',']

const DELIMETER_TOOLTIP = 'The text that seperates one column from another.'
const ENCODING_TOOLTIP = 'Set the encoding used to save this file.' // I can't think of anything better lol
const DECIMAL_TOOLTIP = 'Set the character used to separate the decimal places.'
const SKIP_ROWS_TOOLTIP = 'The number of rows at the top of the file to skip when reading data into the dataframe'
const ERROR_BAD_LINES_TOOLTIP = 'Turn on to skip any lines that are missing fields.'

export const DEFAULT_DELIMETER = ",";
export const DEFAULT_ENCODING = "utf-8";
export const DEFAULT_DECIMAL = ".";
export const DEFAULT_SKIPROWS = 0;
export const DEFAULT_ERROR_BAD_LINES = true;

interface CSVImportConfigScreenProps {
    mitoAPI: MitoAPI;
    analysisData: AnalysisData;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    isUpdate: boolean;

    fileName: string; // data.csv
    filePath: string; // the/full/path/to/data.csv

    params: CSVImportParams | undefined;
    setParams: (updater: (prevParams: CSVImportParams) => CSVImportParams) => void;
    edit: () => void;
    editApplied: boolean;
    loading: boolean;
    error: string | undefined;

    backCallback: () => void;
    notCloseable?: boolean;
}

// This is our guesses about the metadata of the file
export interface CSVFileMetadata {
    delimeters: string[],
    encodings: string[],
    decimals: string[]
    skiprows: number[]
}

export interface CSVImportParams {
    file_names: string[],
    delimeters?: string[],
    encodings?: string[],
    decimals?: string[],
    skiprows?: number[]
    error_bad_lines?: boolean[],
}


const getButtonMessage = (fileName: string, loading: boolean, isUpdate: boolean): string => {
    if (loading) {
        return `Importing...`
    } else if (isUpdate) {
        return `Update to ${fileName}`
    }
    return `Import ${fileName}`;
}


function getSuccessMessage(fileName: string): string {
    return `Imported ${fileName}`
}


/* 
    Allows a user to configure the import for a specific CSV file
*/
function CSVImportConfigScreen(props: CSVImportConfigScreenProps): JSX.Element {

    // Get the metadata of the CSV file
    const [fileMetadata] = useStateFromAPIAsync<CSVFileMetadata | undefined, undefined>(
        undefined,
        () => {return props.mitoAPI.getCSVFilesMetadata(props.params?.file_names || [])},
        (loadedData) => {
            props.setParams(prevParams => {
                return {
                    ...prevParams,
                    delimeters: loadedData?.delimeters || [DEFAULT_DELIMETER],
                    encodings: loadedData?.encodings || [DEFAULT_ENCODING],
                    decimals: loadedData?.decimals || [DEFAULT_DECIMAL]
                }
            })
        },
        []
    );


    const resetParams = () => {
        props.setParams(prevParams => {
            return {
                ...prevParams,
                delimeters: fileMetadata?.delimeters || [DEFAULT_DELIMETER],
                encodings: fileMetadata?.encodings || [DEFAULT_ENCODING],
                error_bad_lines: [DEFAULT_ERROR_BAD_LINES],
            }
        })
    }

    if (props.params === undefined || props.fileName === undefined || props.filePath === undefined) {
        return (
            <div className='text-body-1'>
                There has been an error loading your CSV file encodings. Please try again, or contact support.
            </div>
        )
    }

    const delimeters = props.params.delimeters;
    const encodings = props.params.encodings;
    const decimals = props.params.decimals;
    const skiprows = props.params.skiprows;
    const error_bad_lines = props.params.error_bad_lines;

    const currentDelimeter = delimeters !== undefined ? delimeters[0] : DEFAULT_DELIMETER;
    const currentEncoding = encodings !== undefined ? encodings[0] : DEFAULT_ENCODING;
    const currentDecimal = decimals !== undefined ? decimals[0] : DEFAULT_DECIMAL
    const currentSkiprows = skiprows !== undefined ? skiprows[0] : DEFAULT_SKIPROWS
    const currentErrorBadLines = error_bad_lines !== undefined ? error_bad_lines[0] : DEFAULT_ERROR_BAD_LINES;
    
    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader
                header={!props.isUpdate ? `Import ${props.fileName}` : `Update to ${props.fileName}`}
                setUIState={props.setUIState}
                backCallback={props.backCallback}
                notCloseable={props.notCloseable}
            />
            <DefaultTaskpaneBody noScroll>
                {props.error !== undefined &&
                    <p className='text-color-error'> {props.error} </p>
                }
                <Row justify='space-between' align='center' title={DELIMETER_TOOLTIP}>
                    <Col>
                        <Row justify='start' align='center' suppressTopBottomMargin>
                            <p className='text-body-1'>
                                Delimeter
                            </p>
                            <Tooltip title={DELIMETER_TOOLTIP}/>
                        </Row>
                    </Col>
                    <Col>
                        <Input
                            width='medium'
                            value={currentDelimeter}
                            onChange={(e) => {
                                const newDelimeter = e.target.value;
                                props.setParams(prevParams => {
                                    return {
                                        ...prevParams,
                                        delimeters: [newDelimeter]
                                    }
                                })
                            }} 
                            onKeyDown={(e) => {
                                // If you press tab, we add it to the input, as this is very valid delimeter
                                if (e.key === 'Tab') {
                                    e.preventDefault();
                                    props.setParams(prevParams => {
                                        const delimeters = prevParams.delimeters;
                                        return {
                                            ...prevParams,
                                            delimeters: [(delimeters !== undefined ? delimeters[0] : DEFAULT_DELIMETER) + '\t']
                                        }
                                    })
                                }
                            }}
                        />
                    </Col>
                </Row>
                <Row justify='space-between' align='center' title={ENCODING_TOOLTIP}>
                    <Col>
                        <Row justify='start' align='center' suppressTopBottomMargin>
                            <p className='text-body-1'>
                                Encoding
                            </p>
                            <Tooltip title={ENCODING_TOOLTIP}/>
                        </Row>
                    </Col>
                    <Col>
                        <Select 
                            searchable
                            width='medium' 
                            value={currentEncoding} 
                            onChange={(newEncoding) => {
                                props.setParams(prevParams => {
                                    return {
                                        ...prevParams,
                                        encodings: [newEncoding]
                                    }
                                })
                            }}>
                            {(ENCODINGS).map((encoding) => {
                                return <DropdownItem key={encoding} title={encoding}/>
                            })}
                        </Select>
                    </Col>
                </Row>
                <Row justify='space-between' align='center' title={DECIMAL_TOOLTIP}>
                    <Col>
                        <Row justify='start' align='center' suppressTopBottomMargin>
                            <p className='text-body-1'>
                                Decimal Separator
                            </p>
                            <Tooltip title={DECIMAL_TOOLTIP}/>
                        </Row>
                    </Col>
                    <Col>
                        <Select 
                            searchable
                            width='medium' 
                            value={currentDecimal} 
                            onChange={(newDecimalSeparator) => {
                                props.setParams(prevParams => {
                                    return {
                                        ...prevParams,
                                        decimals: [newDecimalSeparator]
                                    }
                                })
                            }}>
                            {(DECIMALS).map((decimalSeparator) => {
                                return <DropdownItem key={decimalSeparator} title={decimalSeparator}/>
                            })}
                        </Select>
                    </Col>
                </Row>
                <Row justify='space-between' align='center' title={SKIP_ROWS_TOOLTIP}>
                    <Col>
                        <Row justify='start' align='center' suppressTopBottomMargin>
                            <p className='text-body-1'>
                                Number of Rows to Skip
                            </p>
                            <Tooltip title={SKIP_ROWS_TOOLTIP}/>
                        </Row>
                    </Col>
                    <Col>
                        <Input
                            value={"" + currentSkiprows}
                            type='number'
                            width='medium'
                            onChange={(e) => {
                                const newSkiprows = e.target.value;
                                // Since we can only skip integer number of rows, we don't let the user add a decimal,
                                // which they probably won't anyways
                                const newSkiprowsNumber = Math.floor(parseFloat(newSkiprows))

                                props.setParams(prevParams => {
                                    return {
                                        ...prevParams,
                                        skiprows: [newSkiprowsNumber]
                                    }
                                })
                            }}
                        />
                    </Col>
                </Row>
                <Row justify='space-between' align='center' title={ERROR_BAD_LINES_TOOLTIP}>
                    <Col>
                        <Row justify='start' align='center' suppressTopBottomMargin>
                            <p className='text-body-1'>
                                Skip Invalid Lines
                            </p>
                            <Tooltip title={ERROR_BAD_LINES_TOOLTIP}/>
                        </Row>
                    </Col>
                    <Col>
                        <Toggle value={!currentErrorBadLines} onChange={() => {
                            props.setParams(prevParams => {
                                const error_bad_lines = prevParams.error_bad_lines;
                                return {
                                    ...prevParams,
                                    error_bad_lines: [error_bad_lines !== undefined ? !error_bad_lines[0] : DEFAULT_ERROR_BAD_LINES]
                                }
                            })
                        }}/>
                    </Col>
                </Row>
            </DefaultTaskpaneBody>
            <DefaultTaskpaneFooter>
                <p className='text-body-2 text-color-medium-gray-important mb-5px'>
                    <span className='text-body-2-link' onClick={resetParams}>Reset parameters to automatically detected parameters. </span> 
                </p>
                <TextButton
                    variant='dark'
                    width='block'
                    onClick={() => {
                        props.edit();
                    }}
                    autoFocus
                >
                    {getButtonMessage(props.fileName, props.loading, props.isUpdate)}
                </TextButton>
                {props.editApplied && !props.loading &&
                    <p className='text-subtext-1'>
                        {getSuccessMessage(props.fileName)} 
                    </p>
                } 
                {!props.editApplied && 
                    <Spacer px={16}/>
                }
            </DefaultTaskpaneFooter>
        </DefaultTaskpane>
    )
}

export default CSVImportConfigScreen;
